import { Injectable, Logger } from '@nestjs/common';
import {
  areIntervalsOverlapping,
  addMinutes,
  differenceInMinutes,
} from 'date-fns';
import { PrismaService } from '@core/database/prisma.service';
import { AppointmentConflict, ConflictCheckResult } from '../interfaces';
import { AppointmentStatus } from '@glamo/database';

/**
 * Tipo de conflito
 */
export enum ConflictType {
  PROFESSIONAL_BUSY = 'PROFESSIONAL_BUSY',
  CLIENT_BUSY = 'CLIENT_BUSY',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  OUTSIDE_WORKING_HOURS = 'OUTSIDE_WORKING_HOURS',
  BLOCKED_TIME = 'BLOCKED_TIME',
  INSUFFICIENT_ADVANCE = 'INSUFFICIENT_ADVANCE',
  EXCEEDS_MAX_ADVANCE = 'EXCEEDS_MAX_ADVANCE',
}

/**
 * Parâmetros para verificação de conflito
 */
export interface ConflictCheckParams {
  tenantId: string;
  professionalId: string;
  clientId?: string;
  startTime: Date;
  duration: number;
  excludeAppointmentId?: string;
  resourceIds?: string[];
}

/**
 * Serviço responsável pela verificação de conflitos de agendamento
 */
@Injectable()
export class ConflictCheckerService {
  private readonly logger = new Logger(ConflictCheckerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica todos os tipos de conflito para um agendamento
   */
  async checkConflicts(params: ConflictCheckParams): Promise<ConflictCheckResult> {
    const {
      tenantId,
      professionalId,
      clientId,
      startTime,
      duration,
      excludeAppointmentId,
      resourceIds,
    } = params;

    const endTime = addMinutes(startTime, duration);
    const conflicts: AppointmentConflict[] = [];

    // 1. Verificar conflito de profissional
    const professionalConflicts = await this.checkProfessionalConflicts(
      tenantId,
      professionalId,
      startTime,
      endTime,
      excludeAppointmentId,
    );
    conflicts.push(...professionalConflicts);

    // 2. Verificar conflito de cliente (opcional)
    if (clientId) {
      const clientConflicts = await this.checkClientConflicts(
        tenantId,
        clientId,
        startTime,
        endTime,
        excludeAppointmentId,
      );
      conflicts.push(...clientConflicts);
    }

    // 3. Verificar bloqueios de horário
    const blockedTimeConflicts = await this.checkBlockedTimeConflicts(
      tenantId,
      professionalId,
      startTime,
      endTime,
    );
    conflicts.push(...blockedTimeConflicts);

    // 4. Verificar horário de trabalho
    const workingHoursConflict = await this.checkWorkingHoursConflict(
      tenantId,
      professionalId,
      startTime,
      endTime,
    );
    if (workingHoursConflict) {
      conflicts.push(workingHoursConflict);
    }

    // 5. Verificar recursos (se aplicável)
    if (resourceIds && resourceIds.length > 0) {
      const resourceConflicts = await this.checkResourceConflicts(
        tenantId,
        resourceIds,
        startTime,
        endTime,
        excludeAppointmentId,
      );
      conflicts.push(...resourceConflicts);
    }

    // 6. Verificar antecedência
    const advanceConflict = this.checkAdvanceTimeConflict(tenantId, startTime);
    if (advanceConflict) {
      conflicts.push(advanceConflict);
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      canOverride: this.determineCanOverride(conflicts),
    };
  }

  /**
   * Verifica conflitos do profissional
   */
  private async checkProfessionalConflicts(
    tenantId: string,
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    const overlappingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          {
            AND: [
              { scheduledAt: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    for (const apt of overlappingAppointments) {
      conflicts.push({
        type: ConflictType.PROFESSIONAL_BUSY,
        appointmentId: apt.id,
        startTime: apt.scheduledAt,
        endTime: apt.endTime,
        description: `Profissional já possui agendamento com ${apt.client.name} das ${this.formatTime(apt.scheduledAt)} às ${this.formatTime(apt.endTime)}`,
        severity: 'ERROR',
      });
    }

    return conflicts;
  }

  /**
   * Verifica conflitos do cliente
   */
  private async checkClientConflicts(
    tenantId: string,
    clientId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    const overlappingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        clientId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          {
            AND: [
              { scheduledAt: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
      include: {
        professional: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    for (const apt of overlappingAppointments) {
      conflicts.push({
        type: ConflictType.CLIENT_BUSY,
        appointmentId: apt.id,
        startTime: apt.scheduledAt,
        endTime: apt.endTime,
        description: `Cliente já possui agendamento com ${apt.professional.user.name} das ${this.formatTime(apt.scheduledAt)} às ${this.formatTime(apt.endTime)}`,
        severity: 'WARNING',
      });
    }

    return conflicts;
  }

  /**
   * Verifica bloqueios de horário
   */
  private async checkBlockedTimeConflicts(
    tenantId: string,
    professionalId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    const blocks = await this.prisma.professionalTimeBlock.findMany({
      where: {
        professionalId,
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
    });

    for (const block of blocks) {
      conflicts.push({
        type: ConflictType.BLOCKED_TIME,
        startTime: block.startTime,
        endTime: block.endTime,
        description: block.reason || 'Horário bloqueado pelo profissional',
        severity: 'ERROR',
      });
    }

    return conflicts;
  }

  /**
   * Verifica se está dentro do horário de trabalho
   */
  private async checkWorkingHoursConflict(
    tenantId: string,
    professionalId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<AppointmentConflict | null> {
    const dayOfWeek = this.getDayOfWeekEnum(startTime);

    const schedule = await this.prisma.professionalSchedule.findFirst({
      where: {
        professionalId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return {
        type: ConflictType.OUTSIDE_WORKING_HOURS,
        startTime,
        endTime,
        description: 'Profissional não trabalha neste dia',
        severity: 'ERROR',
      };
    }

    // Verificar se está dentro do horário
    const scheduleStart = this.parseTimeToDate(schedule.startTime, startTime);
    const scheduleEnd = this.parseTimeToDate(schedule.endTime, startTime);

    if (startTime < scheduleStart || endTime > scheduleEnd) {
      return {
        type: ConflictType.OUTSIDE_WORKING_HOURS,
        startTime,
        endTime,
        description: `Fora do horário de trabalho (${schedule.startTime} - ${schedule.endTime})`,
        severity: 'ERROR',
      };
    }

    // Verificar intervalo (almoço)
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStart = this.parseTimeToDate(schedule.breakStart, startTime);
      const breakEnd = this.parseTimeToDate(schedule.breakEnd, startTime);

      const overlapsBreak = areIntervalsOverlapping(
        { start: startTime, end: endTime },
        { start: breakStart, end: breakEnd },
      );

      if (overlapsBreak) {
        return {
          type: ConflictType.OUTSIDE_WORKING_HOURS,
          startTime: breakStart,
          endTime: breakEnd,
          description: `Conflita com intervalo do profissional (${schedule.breakStart} - ${schedule.breakEnd})`,
          severity: 'ERROR',
        };
      }
    }

    return null;
  }

  /**
   * Verifica conflitos de recursos
   */
  private async checkResourceConflicts(
    tenantId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    // Buscar agendamentos que usam os mesmos recursos
    const overlappingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        resources: {
          some: {
            resourceId: { in: resourceIds },
          },
        },
        OR: [
          {
            AND: [
              { scheduledAt: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    for (const apt of overlappingAppointments) {
      const conflictingResources = apt.resources.filter((r) =>
        resourceIds.includes(r.resourceId),
      );

      for (const res of conflictingResources) {
        conflicts.push({
          type: ConflictType.RESOURCE_UNAVAILABLE,
          appointmentId: apt.id,
          startTime: apt.scheduledAt,
          endTime: apt.endTime,
          description: `Recurso "${res.resource.name}" já está em uso`,
          severity: 'ERROR',
        });
      }
    }

    return conflicts;
  }

  /**
   * Verifica antecedência mínima e máxima
   */
  private checkAdvanceTimeConflict(
    tenantId: string,
    startTime: Date,
  ): AppointmentConflict | null {
    const now = new Date();
    const minutesUntilAppointment = differenceInMinutes(startTime, now);

    // Configurações padrão (deveriam vir do banco)
    const minAdvanceMinutes = 60; // 1 hora
    const maxAdvanceMinutes = 43200; // 30 dias

    if (minutesUntilAppointment < minAdvanceMinutes) {
      return {
        type: ConflictType.INSUFFICIENT_ADVANCE,
        startTime,
        endTime: startTime,
        description: `Agendamento requer no mínimo ${minAdvanceMinutes} minutos de antecedência`,
        severity: 'ERROR',
      };
    }

    if (minutesUntilAppointment > maxAdvanceMinutes) {
      return {
        type: ConflictType.EXCEEDS_MAX_ADVANCE,
        startTime,
        endTime: startTime,
        description: `Agendamento não pode ser feito com mais de ${maxAdvanceMinutes / 60 / 24} dias de antecedência`,
        severity: 'ERROR',
      };
    }

    return null;
  }

  /**
   * Determina se o conflito pode ser sobrescrito por admin
   */
  private determineCanOverride(conflicts: AppointmentConflict[]): boolean {
    // Conflitos de horário de trabalho e antecedência podem ser sobrescritos
    const nonOverridableTypes = [
      ConflictType.PROFESSIONAL_BUSY,
      ConflictType.CLIENT_BUSY,
      ConflictType.RESOURCE_UNAVAILABLE,
    ];

    return !conflicts.some(
      (c) => nonOverridableTypes.includes(c.type as ConflictType) && c.severity === 'ERROR',
    );
  }

  /**
   * Formata hora para exibição
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Converte string de tempo para Date
   */
  private parseTimeToDate(timeStr: string, referenceDate: Date): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(referenceDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Obtém enum DayOfWeek a partir de Date
   */
  private getDayOfWeekEnum(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }
}
