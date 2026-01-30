import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { addMinutes } from 'date-fns';
import { Appointment, AppointmentStatus, Prisma } from '@glamo/database';
import { PrismaService } from '@core/database/prisma.service';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import { TenantService } from '@core/tenancy/tenant.service';

import { AppointmentsRepository, PaginatedAppointments } from '../repositories/appointments.repository';
import {
  AvailabilityService,
  ConflictCheckerService,
  RecurrenceService,
  ReminderService,
} from '../services';

import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  AppointmentQueryDto,
  RecurrenceType,
} from '../dto';

import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentRescheduledEvent,
  AppointmentStatusChangedEvent,
} from '../events';

import { TimeSlot, DayAvailability } from '../interfaces';

/**
 * Transições de status permitidas
 */
const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.WAITING,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.WAITING]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_PROGRESS]: [
    AppointmentStatus.COMPLETED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

/**
 * Serviço principal de agendamentos
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantService: TenantService,
    private readonly availabilityService: AvailabilityService,
    private readonly conflictChecker: ConflictCheckerService,
    private readonly recurrenceService: RecurrenceService,
    private readonly reminderService: ReminderService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Cria um novo agendamento
   */
  async create(
    dto: CreateAppointmentDto,
    userId: string,
  ): Promise<Appointment | Appointment[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    // Verificar limite de agendamentos do plano
    await this.tenantService.enforceLimit(tenantId, 'appointmentsPerMonth');

    // Calcular duração total dos serviços
    const totalDuration = await this.calculateTotalDuration(tenantId, dto.services);

    // Verificar conflitos (a menos que seja admin e pule a verificação)
    if (!dto.skipConflictCheck) {
      const startTime = new Date(dto.scheduledAt);
      const conflictResult = await this.conflictChecker.checkConflicts({
        tenantId,
        professionalId: dto.professionalId,
        clientId: dto.clientId,
        startTime,
        duration: totalDuration,
      });

      if (conflictResult.hasConflict && !conflictResult.canOverride) {
        throw new BadRequestException({
          message: 'Conflito de horário detectado',
          conflicts: conflictResult.conflicts,
        });
      }
    }

    // Calcular preço total
    const totalPrice = await this.calculateTotalPrice(tenantId, dto.services);

    // Se for recorrente, criar múltiplos agendamentos
    if (dto.recurrence && dto.recurrence !== RecurrenceType.NONE) {
      return this.createRecurringAppointments(dto, tenantId, userId, totalDuration, totalPrice);
    }

    // Criar agendamento único
    return this.createSingleAppointment(dto, tenantId, userId, totalDuration, totalPrice);
  }

  /**
   * Cria um agendamento único
   */
  private async createSingleAppointment(
    dto: CreateAppointmentDto,
    tenantId: string,
    userId: string,
    totalDuration: number,
    totalPrice: number,
  ): Promise<Appointment> {
    const startTime = new Date(dto.scheduledAt);
    const endTime = addMinutes(startTime, totalDuration);

    const appointment = await this.prisma.$transaction(async (tx) => {
      // Criar agendamento
      const apt = await tx.appointment.create({
        data: {
          tenantId,
          clientId: dto.clientId,
          professionalId: dto.professionalId,
          scheduledAt: startTime,
          endTime,
          totalDuration,
          totalPrice,
          status: AppointmentStatus.PENDING,
          notes: dto.notes,
          source: dto.source ?? 'WEB',
          createdById: userId,
        },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          professional: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      // Criar relação com serviços
      for (const service of dto.services) {
        const serviceData = await tx.service.findUnique({
          where: { id: service.serviceId },
          select: { price: true, duration: true },
        });

        await tx.appointmentService.create({
          data: {
            appointmentId: apt.id,
            serviceId: service.serviceId,
            quantity: service.quantity ?? 1,
            price: service.customPrice ?? serviceData?.price ?? 0,
            duration: serviceData?.duration ?? 0,
          },
        });
      }

      return apt;
    });

    // Buscar agendamento completo
    const fullAppointment = await this.repository.findById(appointment.id);

    // Emitir evento
    await this.emitCreatedEvent(fullAppointment!, userId, false);

    // Agendar lembretes
    await this.reminderService.scheduleReminders(appointment.id);

    this.logger.log(`Created appointment ${appointment.id} for client ${dto.clientId}`);

    return fullAppointment!;
  }

  /**
   * Cria agendamentos recorrentes
   */
  private async createRecurringAppointments(
    dto: CreateAppointmentDto,
    tenantId: string,
    userId: string,
    totalDuration: number,
    totalPrice: number,
  ): Promise<Appointment[]> {
    const startTime = new Date(dto.scheduledAt);
    const recurrenceGroupId = this.recurrenceService.generateRecurrenceGroupId();

    // Gerar ocorrências
    const occurrences = this.recurrenceService.generateOccurrences(startTime, {
      type: dto.recurrence!,
      interval: 1,
      count: dto.recurrenceCount,
      endDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
    });

    // Verificar conflitos para todas as datas
    for (const occurrence of occurrences) {
      if (!dto.skipConflictCheck) {
        const conflictResult = await this.conflictChecker.checkConflicts({
          tenantId,
          professionalId: dto.professionalId,
          clientId: dto.clientId,
          startTime: occurrence.date,
          duration: totalDuration,
        });

        if (conflictResult.hasConflict && !conflictResult.canOverride) {
          throw new BadRequestException({
            message: `Conflito de horário na data ${occurrence.date.toISOString()}`,
            conflicts: conflictResult.conflicts,
          });
        }
      }
    }

    const appointments: Appointment[] = [];

    // Criar todos os agendamentos em uma transaction
    await this.prisma.$transaction(async (tx) => {
      for (const occurrence of occurrences) {
        const endTime = addMinutes(occurrence.date, totalDuration);

        const apt = await tx.appointment.create({
          data: {
            tenantId,
            clientId: dto.clientId,
            professionalId: dto.professionalId,
            scheduledAt: occurrence.date,
            endTime,
            totalDuration,
            totalPrice,
            status: AppointmentStatus.PENDING,
            notes: dto.notes,
            source: dto.source ?? 'WEB',
            recurrenceGroupId,
            recurrenceIndex: occurrence.index,
            createdById: userId,
          },
        });

        // Criar relação com serviços
        for (const service of dto.services) {
          const serviceData = await tx.service.findUnique({
            where: { id: service.serviceId },
            select: { price: true, duration: true },
          });

          await tx.appointmentService.create({
            data: {
              appointmentId: apt.id,
              serviceId: service.serviceId,
              quantity: service.quantity ?? 1,
              price: service.customPrice ?? serviceData?.price ?? 0,
              duration: serviceData?.duration ?? 0,
            },
          });
        }

        appointments.push(apt);
      }
    });

    // Buscar agendamentos completos
    const fullAppointments = await this.repository.findByRecurrenceGroup(recurrenceGroupId);

    // Emitir eventos e agendar lembretes
    for (const apt of fullAppointments) {
      await this.emitCreatedEvent(apt, userId, true, recurrenceGroupId);
      await this.reminderService.scheduleReminders(apt.id);
    }

    this.logger.log(
      `Created ${fullAppointments.length} recurring appointments for group ${recurrenceGroupId}`,
    );

    return fullAppointments;
  }

  /**
   * Busca agendamento por ID
   */
  async findById(id: string): Promise<Appointment> {
    const appointment = await this.repository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    return appointment;
  }

  /**
   * Lista agendamentos com filtros
   */
  async findMany(query: AppointmentQueryDto): Promise<PaginatedAppointments> {
    return this.repository.findMany(query);
  }

  /**
   * Busca agendamentos por período
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    professionalId?: string,
  ): Promise<Appointment[]> {
    return this.repository.findByDateRange(startDate, endDate, professionalId);
  }

  /**
   * Atualiza um agendamento
   */
  async update(id: string, dto: UpdateAppointmentDto, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    // Verificar se pode atualizar status
    if (dto.status && !this.canTransitionTo(appointment.status, dto.status)) {
      throw new BadRequestException(
        `Não é possível mudar status de ${appointment.status} para ${dto.status}`,
      );
    }

    const previousStatus = appointment.status;

    const updated = await this.repository.update(id, {
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      status: dto.status,
    });

    // Emitir evento de mudança de status se houve mudança
    if (dto.status && dto.status !== previousStatus) {
      await this.emitStatusChangedEvent(updated, previousStatus, userId);

      // Eventos específicos por status
      if (dto.status === AppointmentStatus.CONFIRMED) {
        await this.emitConfirmedEvent(updated, userId);
      } else if (dto.status === AppointmentStatus.COMPLETED) {
        await this.emitCompletedEvent(updated, userId);
      }
    }

    return updated;
  }

  /**
   * Confirma um agendamento
   */
  async confirm(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Agendamento já está com status ${appointment.status}`,
      );
    }

    const updated = await this.repository.updateStatus(id, AppointmentStatus.CONFIRMED, {
      confirmedAt: new Date(),
      confirmedById: userId,
    });

    await this.emitStatusChangedEvent(updated, AppointmentStatus.PENDING, userId);
    await this.emitConfirmedEvent(updated, userId);

    return updated;
  }

  /**
   * Marca cliente como presente (check-in)
   */
  async checkIn(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Agendamento deve estar confirmado para fazer check-in',
      );
    }

    const updated = await this.repository.updateStatus(id, AppointmentStatus.WAITING, {
      checkedInAt: new Date(),
    });

    await this.emitStatusChangedEvent(updated, AppointmentStatus.CONFIRMED, userId);

    return updated;
  }

  /**
   * Inicia o atendimento
   */
  async startService(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.WAITING) {
      throw new BadRequestException(
        'Cliente deve estar em espera para iniciar atendimento',
      );
    }

    const updated = await this.repository.updateStatus(id, AppointmentStatus.IN_PROGRESS, {
      startedAt: new Date(),
    });

    await this.emitStatusChangedEvent(updated, AppointmentStatus.WAITING, userId);

    return updated;
  }

  /**
   * Finaliza o atendimento
   */
  async complete(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Atendimento deve estar em andamento para finalizar',
      );
    }

    const updated = await this.repository.updateStatus(id, AppointmentStatus.COMPLETED, {
      completedAt: new Date(),
    });

    await this.emitStatusChangedEvent(updated, AppointmentStatus.IN_PROGRESS, userId);
    await this.emitCompletedEvent(updated, userId);

    return updated;
  }

  /**
   * Reagenda um agendamento
   */
  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    userId: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);
    const tenantId = this.tenantContext.getCurrentTenantId();

    // Verificar se pode reagendar
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw new BadRequestException(
        'Não é possível reagendar agendamento concluído ou cancelado',
      );
    }

    const newStartTime = new Date(dto.newScheduledAt);
    const newProfessionalId = dto.newProfessionalId ?? appointment.professionalId;

    // Verificar conflitos
    if (!dto.skipConflictCheck) {
      const conflictResult = await this.conflictChecker.checkConflicts({
        tenantId,
        professionalId: newProfessionalId,
        clientId: appointment.clientId,
        startTime: newStartTime,
        duration: appointment.totalDuration,
        excludeAppointmentId: id,
      });

      if (conflictResult.hasConflict && !conflictResult.canOverride) {
        throw new BadRequestException({
          message: 'Conflito de horário no novo horário',
          conflicts: conflictResult.conflicts,
        });
      }
    }

    const previousScheduledAt = appointment.scheduledAt;
    const previousProfessionalId = appointment.professionalId;

    const updated = await this.repository.update(id, {
      scheduledAt: newStartTime,
      endTime: addMinutes(newStartTime, appointment.totalDuration),
      professionalId: newProfessionalId,
      rescheduledAt: new Date(),
      rescheduledById: userId,
      rescheduledReason: dto.reason,
    });

    // Reagendar lembretes
    await this.reminderService.rescheduleReminders(id);

    // Emitir evento
    await this.emitRescheduledEvent(
      updated,
      previousScheduledAt,
      previousProfessionalId,
      userId,
      dto.reason,
    );

    this.logger.log(`Rescheduled appointment ${id} to ${newStartTime.toISOString()}`);

    return updated;
  }

  /**
   * Cancela um agendamento
   */
  async cancel(id: string, dto: CancelAppointmentDto, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw new BadRequestException(
        'Não é possível cancelar agendamento já concluído ou cancelado',
      );
    }

    const previousStatus = appointment.status;
    const wasConfirmed = appointment.status === AppointmentStatus.CONFIRMED;
    const hoursBeforeScheduled = Math.max(
      0,
      (appointment.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    const updated = await this.repository.updateStatus(id, AppointmentStatus.CANCELLED, {
      cancelledAt: new Date(),
      cancelledById: userId,
      cancelledByClient: dto.cancelledByClient,
      cancellationReason: dto.reason,
      cancellationDescription: dto.description,
    });

    // Cancelar lembretes
    await this.reminderService.cancelReminders(id);

    // Emitir eventos
    await this.emitStatusChangedEvent(updated, previousStatus, userId);
    await this.emitCancelledEvent(updated, userId, wasConfirmed, hoursBeforeScheduled, dto);

    this.logger.log(`Cancelled appointment ${id} - reason: ${dto.reason}`);

    return updated;
  }

  /**
   * Marca como no-show
   */
  async markNoShow(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (![AppointmentStatus.CONFIRMED, AppointmentStatus.WAITING].includes(appointment.status)) {
      throw new BadRequestException(
        'Agendamento deve estar confirmado ou em espera para marcar como falta',
      );
    }

    const previousStatus = appointment.status;

    const updated = await this.repository.updateStatus(id, AppointmentStatus.NO_SHOW, {
      noShowAt: new Date(),
    });

    await this.reminderService.cancelReminders(id);
    await this.emitStatusChangedEvent(updated, previousStatus, userId);

    this.logger.log(`Marked appointment ${id} as no-show`);

    return updated;
  }

  /**
   * Obtém slots disponíveis
   */
  async getAvailableSlots(
    professionalId: string,
    date: Date,
    serviceIds?: string[],
  ): Promise<TimeSlot[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.availabilityService.getAvailableSlots({
      tenantId,
      professionalId,
      serviceIds: serviceIds ?? [],
      date,
    });
  }

  /**
   * Obtém disponibilidade por range de datas
   */
  async getAvailabilityRange(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    serviceIds?: string[],
  ): Promise<DayAvailability[]> {
    const tenantId = this.tenantContext.getCurrentTenantId();

    return this.availabilityService.getAvailabilityRange({
      tenantId,
      professionalId,
      serviceIds: serviceIds ?? [],
      startDate,
      endDate,
      includeSlots: false,
    });
  }

  /**
   * Conta agendamentos por status
   */
  async getStatusCounts(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<AppointmentStatus, number>> {
    return this.repository.countByStatus(startDate, endDate);
  }

  // ==================== Métodos Privados ====================

  /**
   * Verifica se uma transição de status é válida
   */
  private canTransitionTo(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Calcula duração total dos serviços
   */
  private async calculateTotalDuration(
    tenantId: string,
    services: { serviceId: string; quantity?: number }[],
  ): Promise<number> {
    const serviceIds = services.map((s) => s.serviceId);
    return this.availabilityService.calculateServicesDuration(tenantId, serviceIds);
  }

  /**
   * Calcula preço total dos serviços
   */
  private async calculateTotalPrice(
    tenantId: string,
    services: { serviceId: string; quantity?: number; customPrice?: number }[],
  ): Promise<number> {
    let total = 0;

    for (const item of services) {
      const service = await this.prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { price: true },
      });

      if (service) {
        const price = item.customPrice ?? Number(service.price);
        const quantity = item.quantity ?? 1;
        total += price * quantity;
      }
    }

    return total;
  }

  // ==================== Eventos ====================

  private async emitCreatedEvent(
    appointment: Appointment,
    userId: string,
    isRecurring: boolean,
    recurrenceGroupId?: string,
  ): Promise<void> {
    const event = new AppointmentCreatedEvent(
      {
        ...this.buildEventData(appointment),
        source: (appointment as any).source ?? 'WEB',
        isRecurring,
        recurrenceGroupId,
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentCreatedEvent.eventName, event);
  }

  private async emitConfirmedEvent(
    appointment: Appointment,
    userId: string,
  ): Promise<void> {
    const event = new AppointmentConfirmedEvent(
      {
        ...this.buildEventData(appointment),
        confirmedAt: new Date(),
        confirmedBy: userId,
        confirmationMethod: 'MANUAL',
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentConfirmedEvent.eventName, event);
  }

  private async emitCancelledEvent(
    appointment: Appointment,
    userId: string,
    wasConfirmed: boolean,
    hoursBeforeScheduled: number,
    dto: CancelAppointmentDto,
  ): Promise<void> {
    const event = new AppointmentCancelledEvent(
      {
        ...this.buildEventData(appointment),
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelledByClient: dto.cancelledByClient ?? false,
        reason: dto.reason!,
        description: dto.description,
        wasConfirmed,
        hoursBeforeScheduled,
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentCancelledEvent.eventName, event);
  }

  private async emitCompletedEvent(
    appointment: Appointment,
    userId: string,
  ): Promise<void> {
    const event = new AppointmentCompletedEvent(
      {
        ...this.buildEventData(appointment),
        completedAt: new Date(),
        completedBy: userId,
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentCompletedEvent.eventName, event);
  }

  private async emitRescheduledEvent(
    appointment: Appointment,
    previousScheduledAt: Date,
    previousProfessionalId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const event = new AppointmentRescheduledEvent(
      {
        ...this.buildEventData(appointment),
        rescheduledAt: new Date(),
        rescheduledBy: userId,
        previousScheduledAt,
        previousProfessionalId:
          previousProfessionalId !== appointment.professionalId
            ? previousProfessionalId
            : undefined,
        reason,
        rescheduledByClient: false,
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentRescheduledEvent.eventName, event);
  }

  private async emitStatusChangedEvent(
    appointment: Appointment,
    previousStatus: AppointmentStatus,
    userId: string,
  ): Promise<void> {
    const event = new AppointmentStatusChangedEvent(
      {
        ...this.buildEventData(appointment),
        previousStatus,
        newStatus: appointment.status,
        changedAt: new Date(),
        changedBy: userId,
      },
      userId,
    );

    this.eventEmitter.emit(AppointmentStatusChangedEvent.eventName, event);
  }

  private buildEventData(appointment: any) {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      scheduledAt: appointment.scheduledAt,
      endTime: appointment.endTime,
      status: appointment.status,
      totalDuration: appointment.totalDuration,
      totalPrice: Number(appointment.totalPrice),
      services: (appointment.services ?? []).map((s: any) => ({
        id: s.service?.id ?? s.serviceId,
        name: s.service?.name ?? '',
        duration: s.service?.duration ?? s.duration,
        price: Number(s.service?.price ?? s.price),
        quantity: s.quantity,
      })),
      client: appointment.client
        ? {
            id: appointment.client.id,
            name: appointment.client.name,
            email: appointment.client.email,
            phone: appointment.client.phone,
          }
        : undefined,
      professional: appointment.professional
        ? {
            id: appointment.professional.id,
            name: appointment.professional.user?.name ?? '',
            email: appointment.professional.user?.email,
          }
        : undefined,
    };
  }
}
