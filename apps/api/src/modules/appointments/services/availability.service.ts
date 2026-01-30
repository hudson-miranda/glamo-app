import { Injectable, Logger } from '@nestjs/common';
import {
  startOfDay,
  endOfDay,
  addMinutes,
  isBefore,
  isAfter,
  isEqual,
  areIntervalsOverlapping,
  differenceInMinutes,
  parseISO,
  format,
  eachDayOfInterval,
} from 'date-fns';
import { PrismaService } from '@core/database/prisma.service';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import {
  TimeSlot,
  DetailedTimeSlot,
  DayAvailability,
  ProfessionalAvailability,
  AvailabilityParams,
  AvailabilityRangeParams,
  ProfessionalAvailabilityConfig,
} from '../interfaces';
import { AppointmentStatus, DayOfWeek } from '@glamo/database';

/**
 * Configurações padrão de disponibilidade
 */
const DEFAULT_CONFIG: Partial<ProfessionalAvailabilityConfig> = {
  slotInterval: 30, // intervalo entre slots em minutos
  minAdvanceBooking: 60, // mínimo de antecedência em minutos
  maxAdvanceBooking: 43200, // máximo de antecedência (30 dias em minutos)
  bufferBetweenAppointments: 0, // buffer entre agendamentos
};

/**
 * Serviço responsável pelo cálculo de disponibilidade de horários
 */
@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Calcula os slots disponíveis para um profissional em uma data específica
   */
  async getAvailableSlots(params: AvailabilityParams): Promise<TimeSlot[]> {
    const { tenantId, professionalId, serviceIds, date, duration } = params;

    this.logger.debug(
      `Calculating availability for professional ${professionalId} on ${format(date, 'yyyy-MM-dd')}`,
    );

    // Buscar duração total dos serviços
    const totalDuration = duration ?? (await this.calculateServicesDuration(tenantId, serviceIds));

    // Buscar configuração de disponibilidade do profissional
    const config = await this.getProfessionalConfig(tenantId, professionalId);

    // Buscar horário de trabalho do dia
    const workingHours = await this.getWorkingHours(tenantId, professionalId, date);

    if (!workingHours || workingHours.length === 0) {
      this.logger.debug(`No working hours found for professional ${professionalId} on ${format(date, 'yyyy-MM-dd')}`);
      return [];
    }

    // Buscar bloqueios (férias, folgas, etc.)
    const blockedSlots = await this.getBlockedSlots(tenantId, professionalId, date);

    // Buscar agendamentos existentes
    const existingAppointments = await this.getExistingAppointments(
      tenantId,
      professionalId,
      startOfDay(date),
      endOfDay(date),
    );

    // Gerar todos os slots possíveis
    const allSlots = this.generateTimeSlots(
      workingHours,
      totalDuration,
      config.slotInterval,
      config.bufferBetweenAppointments,
    );

    // Filtrar slots disponíveis
    const availableSlots = this.filterAvailableSlots(
      allSlots,
      existingAppointments,
      blockedSlots,
      totalDuration,
      config,
    );

    return availableSlots;
  }

  /**
   * Calcula disponibilidade para um range de datas
   */
  async getAvailabilityRange(params: AvailabilityRangeParams): Promise<DayAvailability[]> {
    const { tenantId, professionalId, serviceIds, startDate, endDate, includeSlots } = params;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const duration = await this.calculateServicesDuration(tenantId, serviceIds);

    const availability: DayAvailability[] = [];

    for (const day of days) {
      const slots = await this.getAvailableSlots({
        tenantId,
        professionalId,
        serviceIds,
        date: day,
        duration,
      });

      availability.push({
        date: day,
        available: slots.length > 0,
        totalSlots: slots.length,
        slots: includeSlots ? slots : undefined,
      });
    }

    return availability;
  }

  /**
   * Obtém disponibilidade de múltiplos profissionais
   */
  async getProfessionalsAvailability(
    tenantId: string,
    professionalIds: string[],
    serviceIds: string[],
    date: Date,
  ): Promise<ProfessionalAvailability[]> {
    const result: ProfessionalAvailability[] = [];

    for (const professionalId of professionalIds) {
      const slots = await this.getAvailableSlots({
        tenantId,
        professionalId,
        serviceIds,
        date,
      });

      // Buscar info do profissional
      const professional = await this.prisma.professional.findUnique({
        where: { id: professionalId },
        select: { id: true, userId: true, user: { select: { name: true } } },
      });

      if (professional) {
        result.push({
          professionalId,
          professionalName: professional.user.name,
          date,
          slots,
          isAvailable: slots.length > 0,
        });
      }
    }

    return result;
  }

  /**
   * Verifica se um slot específico está disponível
   */
  async isSlotAvailable(
    tenantId: string,
    professionalId: string,
    startTime: Date,
    duration: number,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const endTime = addMinutes(startTime, duration);

    // Verificar horário de trabalho
    const workingHours = await this.getWorkingHours(tenantId, professionalId, startTime);
    const isWithinWorkingHours = workingHours.some(
      (wh) =>
        (isAfter(startTime, wh.start) || isEqual(startTime, wh.start)) &&
        (isBefore(endTime, wh.end) || isEqual(endTime, wh.end)),
    );

    if (!isWithinWorkingHours) {
      return false;
    }

    // Verificar bloqueios
    const blockedSlots = await this.getBlockedSlots(tenantId, professionalId, startTime);
    const isBlocked = blockedSlots.some((blocked) =>
      areIntervalsOverlapping(
        { start: startTime, end: endTime },
        { start: blocked.start, end: blocked.end },
      ),
    );

    if (isBlocked) {
      return false;
    }

    // Verificar conflitos com agendamentos
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        professionalId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          {
            scheduledAt: {
              gte: startTime,
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
              lte: endTime,
            },
          },
          {
            AND: [
              { scheduledAt: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    return !conflictingAppointment;
  }

  /**
   * Calcula a duração total dos serviços
   */
  async calculateServicesDuration(tenantId: string, serviceIds: string[]): Promise<number> {
    if (!serviceIds || serviceIds.length === 0) {
      return 30; // Duração padrão
    }

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        tenantId,
        active: true,
      },
      select: { duration: true },
    });

    return services.reduce((total, service) => total + service.duration, 0);
  }

  /**
   * Obtém a configuração de disponibilidade do profissional
   */
  private async getProfessionalConfig(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalAvailabilityConfig> {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        slotInterval: true,
        bufferTime: true,
        user: { select: { name: true } },
      },
    });

    // Buscar configurações do tenant
    const tenantSettings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        minAdvanceBooking: true,
        maxAdvanceBooking: true,
        defaultSlotInterval: true,
      },
    });

    return {
      professionalId,
      professionalName: professional?.user?.name ?? '',
      slotInterval:
        professional?.slotInterval ??
        tenantSettings?.defaultSlotInterval ??
        DEFAULT_CONFIG.slotInterval!,
      minAdvanceBooking:
        tenantSettings?.minAdvanceBooking ?? DEFAULT_CONFIG.minAdvanceBooking!,
      maxAdvanceBooking:
        tenantSettings?.maxAdvanceBooking ?? DEFAULT_CONFIG.maxAdvanceBooking!,
      bufferBetweenAppointments:
        professional?.bufferTime ?? DEFAULT_CONFIG.bufferBetweenAppointments!,
    };
  }

  /**
   * Obtém os horários de trabalho do profissional para uma data
   */
  private async getWorkingHours(
    tenantId: string,
    professionalId: string,
    date: Date,
  ): Promise<{ start: Date; end: Date }[]> {
    const dayOfWeek = this.getDayOfWeek(date);

    // Buscar horário regular
    const schedule = await this.prisma.professionalSchedule.findFirst({
      where: {
        professionalId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return [];
    }

    // Combinar horário com a data
    const workingHours: { start: Date; end: Date }[] = [];

    const startDate = startOfDay(date);
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    const start = addMinutes(startDate, startHour * 60 + startMinute);
    const end = addMinutes(startDate, endHour * 60 + endMinute);

    workingHours.push({ start, end });

    // Se houver intervalo (almoço), dividir em dois períodos
    if (schedule.breakStart && schedule.breakEnd) {
      const [breakStartHour, breakStartMinute] = schedule.breakStart.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = schedule.breakEnd.split(':').map(Number);

      const breakStart = addMinutes(startDate, breakStartHour * 60 + breakStartMinute);
      const breakEnd = addMinutes(startDate, breakEndHour * 60 + breakEndMinute);

      // Dividir em dois períodos
      return [
        { start, end: breakStart },
        { start: breakEnd, end },
      ];
    }

    return workingHours;
  }

  /**
   * Obtém os bloqueios de horário do profissional
   */
  private async getBlockedSlots(
    tenantId: string,
    professionalId: string,
    date: Date,
  ): Promise<{ start: Date; end: Date; reason?: string }[]> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const blocks = await this.prisma.professionalTimeBlock.findMany({
      where: {
        professionalId,
        OR: [
          {
            startTime: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          {
            endTime: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          {
            AND: [
              { startTime: { lte: dayStart } },
              { endTime: { gte: dayEnd } },
            ],
          },
        ],
      },
    });

    return blocks.map((block) => ({
      start: block.startTime,
      end: block.endTime,
      reason: block.reason ?? undefined,
    }));
  }

  /**
   * Obtém os agendamentos existentes
   */
  private async getExistingAppointments(
    tenantId: string,
    professionalId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ start: Date; end: Date; status: AppointmentStatus }[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        scheduledAt: true,
        endTime: true,
        status: true,
      },
    });

    return appointments.map((apt) => ({
      start: apt.scheduledAt,
      end: apt.endTime,
      status: apt.status,
    }));
  }

  /**
   * Gera todos os slots de tempo possíveis
   */
  private generateTimeSlots(
    workingHours: { start: Date; end: Date }[],
    duration: number,
    interval: number,
    buffer: number,
  ): { start: Date; end: Date }[] {
    const slots: { start: Date; end: Date }[] = [];

    for (const period of workingHours) {
      let currentStart = period.start;
      const totalSlotTime = duration + buffer;

      while (isBefore(addMinutes(currentStart, duration), period.end) || 
             isEqual(addMinutes(currentStart, duration), period.end)) {
        slots.push({
          start: currentStart,
          end: addMinutes(currentStart, duration),
        });
        currentStart = addMinutes(currentStart, interval);
      }
    }

    return slots;
  }

  /**
   * Filtra os slots disponíveis
   */
  private filterAvailableSlots(
    allSlots: { start: Date; end: Date }[],
    existingAppointments: { start: Date; end: Date }[],
    blockedSlots: { start: Date; end: Date }[],
    duration: number,
    config: ProfessionalAvailabilityConfig,
  ): TimeSlot[] {
    const now = new Date();
    const minBookingTime = addMinutes(now, config.minAdvanceBooking);
    const maxBookingTime = addMinutes(now, config.maxAdvanceBooking);

    return allSlots
      .filter((slot) => {
        // Verificar antecedência mínima
        if (isBefore(slot.start, minBookingTime)) {
          return false;
        }

        // Verificar antecedência máxima
        if (isAfter(slot.start, maxBookingTime)) {
          return false;
        }

        // Verificar conflito com agendamentos existentes
        const hasConflict = existingAppointments.some((apt) =>
          areIntervalsOverlapping(
            { start: slot.start, end: slot.end },
            { start: apt.start, end: apt.end },
          ),
        );

        if (hasConflict) {
          return false;
        }

        // Verificar bloqueios
        const isBlocked = blockedSlots.some((block) =>
          areIntervalsOverlapping(
            { start: slot.start, end: slot.end },
            { start: block.start, end: block.end },
          ),
        );

        if (isBlocked) {
          return false;
        }

        return true;
      })
      .map((slot) => ({
        startTime: slot.start,
        endTime: slot.end,
        available: true,
        professionalId: config.professionalId,
        professionalName: config.professionalName,
      }));
  }

  /**
   * Converte data para enum DayOfWeek
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const dayIndex = date.getDay();
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[dayIndex];
  }
}
