import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import {
  addDays,
  format,
  parse,
  startOfDay,
  endOfDay,
  isSameDay,
  isWithinInterval,
  addMinutes,
} from 'date-fns';
import { ProfessionalAvailability, WorkingHours, ScheduleBlock } from '../interfaces';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  /**
   * Obtém disponibilidade do profissional para uma data
   */
  async getAvailability(
    professionalId: string,
    date: Date,
    options: {
      serviceId?: string;
      duration?: number;
    } = {},
  ): Promise<ProfessionalAvailability> {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        workingHours: true,
        scheduleConfig: true,
        status: true,
      },
    });

    if (!professional) {
      return {
        professionalId,
        date,
        slots: [],
        isWorkingDay: false,
        hasBlockedPeriod: false,
      };
    }

    const workingHours = (professional.workingHours as WorkingHours[]) || [];
    const scheduleConfig = professional.scheduleConfig as any || {};
    const dayOfWeek = date.getDay();
    const dayConfig = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    // Verificar se é dia de trabalho
    if (!dayConfig || !dayConfig.isWorkingDay) {
      return {
        professionalId,
        date,
        slots: [],
        isWorkingDay: false,
        hasBlockedPeriod: false,
      };
    }

    // Buscar bloqueios
    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        professionalId,
        status: 'APPROVED',
        startDate: { lte: endOfDay(date) },
        endDate: { gte: startOfDay(date) },
      },
    });

    const hasBlockedPeriod = blocks.length > 0;

    // Verificar se o dia todo está bloqueado
    const fullDayBlock = blocks.find((block) => {
      if (block.isAllDay) {
        return (
          startOfDay(new Date(block.startDate)) <= startOfDay(date) &&
          endOfDay(new Date(block.endDate)) >= endOfDay(date)
        );
      }
      return false;
    });

    if (fullDayBlock) {
      return {
        professionalId,
        date,
        slots: [],
        isWorkingDay: true,
        hasBlockedPeriod: true,
        workingHours: dayConfig,
      };
    }

    // Buscar agendamentos do dia
    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: { gte: startOfDay(date) },
        endTime: { lte: endOfDay(date) },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    // Gerar slots
    const slotDuration = options.duration || scheduleConfig.defaultSlotDuration || 30;
    const slots = this.generateSlots(
      dayConfig,
      blocks,
      appointments,
      date,
      slotDuration,
    );

    return {
      professionalId,
      date,
      slots,
      isWorkingDay: true,
      hasBlockedPeriod,
      workingHours: dayConfig,
    };
  }

  /**
   * Obtém disponibilidade para um período
   */
  async getAvailabilityRange(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    options: {
      serviceId?: string;
    } = {},
  ): Promise<{ date: string; available: boolean; slots: number }[]> {
    const result: { date: string; available: boolean; slots: number }[] = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (currentDate <= end) {
      const availability = await this.getAvailability(professionalId, currentDate, options);
      const availableSlots = availability.slots.filter((s) => s.isAvailable);

      result.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        available: availableSlots.length > 0,
        slots: availableSlots.length,
      });

      currentDate = addDays(currentDate, 1);
    }

    return result;
  }

  /**
   * Verifica se um horário específico está disponível
   */
  async isSlotAvailable(
    professionalId: string,
    date: Date,
    time: string,
    duration: number,
  ): Promise<{
    available: boolean;
    reason?: string;
    conflictingAppointmentId?: string;
  }> {
    const availability = await this.getAvailability(professionalId, date, { duration });
    const slot = availability.slots.find((s) => s.time === time);

    if (!slot) {
      return { available: false, reason: 'SLOT_NOT_FOUND' };
    }

    if (!slot.isAvailable) {
      return {
        available: false,
        reason: slot.reason,
        conflictingAppointmentId: slot.appointmentId,
      };
    }

    return { available: true };
  }

  /**
   * Obtém próximos horários disponíveis
   */
  async getNextAvailableSlots(
    professionalId: string,
    options: {
      serviceId?: string;
      duration?: number;
      limit?: number;
      startFrom?: Date;
    } = {},
  ): Promise<{ date: string; time: string }[]> {
    const { duration, limit = 5, startFrom = new Date() } = options;
    const slots: { date: string; time: string }[] = [];
    let currentDate = startOfDay(startFrom);
    let daysChecked = 0;
    const maxDays = 60;

    while (slots.length < limit && daysChecked < maxDays) {
      const availability = await this.getAvailability(professionalId, currentDate, {
        serviceId: options.serviceId,
        duration,
      });

      for (const slot of availability.slots) {
        if (slot.isAvailable && slots.length < limit) {
          slots.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            time: slot.time,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
      daysChecked++;
    }

    return slots;
  }

  /**
   * Gera slots de horário
   */
  private generateSlots(
    workingHours: WorkingHours,
    blocks: any[],
    appointments: any[],
    date: Date,
    slotDuration: number,
  ): ProfessionalAvailability['slots'] {
    const slots: ProfessionalAvailability['slots'] = [];

    const [startH, startM] = workingHours.startTime.split(':').map(Number);
    const [endH, endM] = workingHours.endTime.split(':').map(Number);

    let currentTime = startOfDay(date);
    currentTime = addMinutes(currentTime, startH * 60 + startM);

    const endTime = addMinutes(startOfDay(date), endH * 60 + endM);

    // Intervalo
    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;
    if (workingHours.breakStart && workingHours.breakEnd) {
      const [bsH, bsM] = workingHours.breakStart.split(':').map(Number);
      const [beH, beM] = workingHours.breakEnd.split(':').map(Number);
      breakStart = addMinutes(startOfDay(date), bsH * 60 + bsM);
      breakEnd = addMinutes(startOfDay(date), beH * 60 + beM);
    }

    while (currentTime < endTime) {
      const timeStr = format(currentTime, 'HH:mm');
      const slotEnd = addMinutes(currentTime, slotDuration);

      let isAvailable = true;
      let reason: 'BOOKED' | 'BLOCKED' | 'BREAK' | 'OUTSIDE_HOURS' | undefined;
      let appointmentId: string | undefined;

      // Verificar intervalo
      if (breakStart && breakEnd) {
        if (
          isWithinInterval(currentTime, { start: breakStart, end: addMinutes(breakEnd, -1) }) ||
          isWithinInterval(slotEnd, { start: addMinutes(breakStart, 1), end: breakEnd })
        ) {
          isAvailable = false;
          reason = 'BREAK';
        }
      }

      // Verificar bloqueios
      for (const block of blocks) {
        if (!block.isAllDay && block.startTime && block.endTime) {
          const [bsH, bsM] = block.startTime.split(':').map(Number);
          const [beH, beM] = block.endTime.split(':').map(Number);
          const blockStart = addMinutes(startOfDay(date), bsH * 60 + bsM);
          const blockEnd = addMinutes(startOfDay(date), beH * 60 + beM);

          if (
            isWithinInterval(currentTime, { start: blockStart, end: addMinutes(blockEnd, -1) }) ||
            isWithinInterval(slotEnd, { start: addMinutes(blockStart, 1), end: blockEnd })
          ) {
            isAvailable = false;
            reason = 'BLOCKED';
            break;
          }
        }
      }

      // Verificar agendamentos
      for (const apt of appointments) {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);

        if (
          (currentTime >= aptStart && currentTime < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (currentTime <= aptStart && slotEnd >= aptEnd)
        ) {
          isAvailable = false;
          reason = 'BOOKED';
          appointmentId = apt.id;
          break;
        }
      }

      slots.push({
        time: timeStr,
        isAvailable,
        reason,
        appointmentId,
      });

      currentTime = addMinutes(currentTime, slotDuration);
    }

    return slots;
  }
}
