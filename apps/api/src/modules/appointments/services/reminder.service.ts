import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  addHours,
  subHours,
  differenceInHours,
  differenceInMinutes,
  isBefore,
} from 'date-fns';
import { PrismaService } from '@core/database/prisma.service';
import {
  AppointmentReminderEvent,
  ReminderType,
  ReminderChannel,
} from '../events/appointment-reminder.event';
import { AppointmentStatus } from '@glamo/database';

/**
 * Configuração de lembrete
 */
export interface ReminderConfig {
  type: ReminderType;
  hoursBeforeScheduled: number;
  channels: ReminderChannel[];
  enabled: boolean;
}

/**
 * Configuração padrão de lembretes
 */
const DEFAULT_REMINDERS: ReminderConfig[] = [
  {
    type: ReminderType.FIRST_REMINDER,
    hoursBeforeScheduled: 24,
    channels: [ReminderChannel.EMAIL, ReminderChannel.WHATSAPP],
    enabled: true,
  },
  {
    type: ReminderType.SECOND_REMINDER,
    hoursBeforeScheduled: 2,
    channels: [ReminderChannel.SMS, ReminderChannel.WHATSAPP],
    enabled: true,
  },
];

/**
 * Serviço responsável pelo agendamento e envio de lembretes
 */
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('appointments') private readonly appointmentsQueue: Queue,
  ) {}

  /**
   * Agenda lembretes para um agendamento
   */
  async scheduleReminders(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        professional: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        services: {
          include: {
            service: { select: { name: true, duration: true, price: true } },
          },
        },
        tenant: {
          select: { id: true },
        },
      },
    });

    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found for reminder scheduling`);
      return;
    }

    // Buscar configuração de lembretes do tenant
    const reminderConfigs = await this.getReminderConfigs(appointment.tenantId);

    const now = new Date();
    const scheduledAt = appointment.scheduledAt;

    for (const config of reminderConfigs) {
      if (!config.enabled) continue;

      const reminderTime = subHours(scheduledAt, config.hoursBeforeScheduled);

      // Só agendar se o lembrete for no futuro
      if (isBefore(now, reminderTime)) {
        const delay = reminderTime.getTime() - now.getTime();

        await this.appointmentsQueue.add(
          'send-reminder',
          {
            appointmentId: appointment.id,
            tenantId: appointment.tenantId,
            reminderType: config.type,
            channels: config.channels,
            hoursBeforeScheduled: config.hoursBeforeScheduled,
          },
          {
            delay,
            jobId: `reminder-${appointment.id}-${config.type}`,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000, // 1 minuto
            },
          },
        );

        this.logger.debug(
          `Scheduled ${config.type} reminder for appointment ${appointmentId} at ${reminderTime.toISOString()}`,
        );
      }
    }
  }

  /**
   * Cancela lembretes agendados para um agendamento
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    for (const config of DEFAULT_REMINDERS) {
      const jobId = `reminder-${appointmentId}-${config.type}`;
      
      try {
        const job = await this.appointmentsQueue.getJob(jobId);
        if (job) {
          await job.remove();
          this.logger.debug(`Cancelled reminder job ${jobId}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to cancel reminder job ${jobId}:`, error);
      }
    }
  }

  /**
   * Reagenda lembretes quando um agendamento é modificado
   */
  async rescheduleReminders(appointmentId: string): Promise<void> {
    // Cancelar lembretes existentes
    await this.cancelReminders(appointmentId);
    
    // Agendar novos lembretes
    await this.scheduleReminders(appointmentId);
  }

  /**
   * Processa o envio de um lembrete
   */
  async processReminder(data: {
    appointmentId: string;
    tenantId: string;
    reminderType: ReminderType;
    channels: ReminderChannel[];
    hoursBeforeScheduled: number;
  }): Promise<void> {
    const { appointmentId, tenantId, reminderType, channels, hoursBeforeScheduled } = data;

    // Buscar agendamento atualizado
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        professional: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, duration: true, price: true } },
          },
        },
      },
    });

    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found for reminder processing`);
      return;
    }

    // Verificar se ainda deve enviar o lembrete
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.NO_SHOW
    ) {
      this.logger.debug(
        `Skipping reminder for appointment ${appointmentId} - status is ${appointment.status}`,
      );
      return;
    }

    // Emitir evento de lembrete
    const event = new AppointmentReminderEvent({
      id: appointment.id,
      tenantId: appointment.tenantId,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      scheduledAt: appointment.scheduledAt,
      endTime: appointment.endTime,
      status: appointment.status,
      totalDuration: appointment.totalDuration,
      totalPrice: Number(appointment.totalPrice),
      services: appointment.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        duration: s.service.duration,
        price: Number(s.service.price),
        quantity: s.quantity,
      })),
      client: {
        id: appointment.client.id,
        name: appointment.client.name,
        email: appointment.client.email ?? undefined,
        phone: appointment.client.phone ?? undefined,
      },
      professional: {
        id: appointment.professional.id,
        name: appointment.professional.user.name,
        email: appointment.professional.user.email ?? undefined,
      },
      reminderType,
      channels,
      hoursBeforeScheduled,
    });

    this.eventEmitter.emit(AppointmentReminderEvent.eventName, event);

    // Registrar no banco que o lembrete foi enviado
    await this.prisma.appointmentReminder.create({
      data: {
        appointmentId,
        type: reminderType,
        channels: channels,
        sentAt: new Date(),
      },
    });

    this.logger.log(
      `Sent ${reminderType} reminder for appointment ${appointmentId} via ${channels.join(', ')}`,
    );
  }

  /**
   * Obtém configuração de lembretes do tenant
   */
  private async getReminderConfigs(tenantId: string): Promise<ReminderConfig[]> {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        reminderSettings: true,
      },
    });

    if (settings?.reminderSettings) {
      try {
        return JSON.parse(settings.reminderSettings as string);
      } catch {
        return DEFAULT_REMINDERS;
      }
    }

    return DEFAULT_REMINDERS;
  }

  /**
   * Busca lembretes pendentes que deveriam ter sido enviados
   */
  async processMissedReminders(): Promise<void> {
    const now = new Date();
    const oneHourAgo = subHours(now, 1);

    // Buscar agendamentos que deveriam ter recebido lembrete
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        scheduledAt: {
          gte: now,
          lte: addHours(now, 24),
        },
        reminders: {
          none: {
            type: ReminderType.FIRST_REMINDER,
            sentAt: { gte: oneHourAgo },
          },
        },
      },
      select: { id: true, tenantId: true },
    });

    for (const appointment of appointments) {
      await this.processReminder({
        appointmentId: appointment.id,
        tenantId: appointment.tenantId,
        reminderType: ReminderType.FIRST_REMINDER,
        channels: [ReminderChannel.EMAIL, ReminderChannel.WHATSAPP],
        hoursBeforeScheduled: 24,
      });
    }

    this.logger.log(`Processed ${appointments.length} missed reminders`);
  }
}
