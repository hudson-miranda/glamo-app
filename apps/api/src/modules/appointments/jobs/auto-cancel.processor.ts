import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@core/database/prisma.service';
import { AppointmentStatus } from '@glamo/database';
import { subMinutes, isBefore } from 'date-fns';

/**
 * Dados do job de auto-cancelamento
 */
export interface AutoCancelJobData {
  tenantId: string;
  appointmentId?: string; // Se específico ou null para batch
  reason?: string;
}

/**
 * Processor para jobs de auto-cancelamento de agendamentos
 */
@Processor('appointments')
export class AutoCancelProcessor {
  private readonly logger = new Logger(AutoCancelProcessor.name);

  /**
   * Tempo limite para confirmação (em minutos)
   */
  private readonly CONFIRMATION_TIMEOUT = 1440; // 24 horas

  /**
   * Tempo limite para no-show após horário agendado (em minutos)
   */
  private readonly NO_SHOW_TIMEOUT = 30;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processa auto-cancelamento de agendamentos não confirmados
   */
  @Process('auto-cancel-unconfirmed')
  async handleAutoCancelUnconfirmed(job: Job<AutoCancelJobData>): Promise<void> {
    const { data } = job;

    this.logger.log(
      `Processing auto-cancel unconfirmed job${data.appointmentId ? ` for appointment ${data.appointmentId}` : ''}`,
    );

    try {
      const cutoffTime = subMinutes(new Date(), this.CONFIRMATION_TIMEOUT);

      const whereClause: any = {
        status: AppointmentStatus.PENDING,
        createdAt: { lt: cutoffTime },
      };

      if (data.tenantId) {
        whereClause.tenantId = data.tenantId;
      }

      if (data.appointmentId) {
        whereClause.id = data.appointmentId;
      }

      const appointments = await this.prisma.appointment.findMany({
        where: whereClause,
        select: { id: true, tenantId: true },
      });

      if (appointments.length === 0) {
        this.logger.debug('No unconfirmed appointments to auto-cancel');
        return;
      }

      const ids = appointments.map((a) => a.id);

      await this.prisma.appointment.updateMany({
        where: { id: { in: ids } },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: 'AUTO_CANCELLED',
          cancellationDescription:
            data.reason ?? 'Cancelado automaticamente por falta de confirmação',
        },
      });

      this.logger.log(
        `Auto-cancelled ${appointments.length} unconfirmed appointments`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-cancel unconfirmed appointments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Processa marcação de no-show para agendamentos não atendidos
   */
  @Process('auto-mark-noshow')
  async handleAutoMarkNoShow(job: Job<AutoCancelJobData>): Promise<void> {
    const { data } = job;

    this.logger.log('Processing auto-mark no-show job');

    try {
      const now = new Date();
      const cutoffTime = subMinutes(now, this.NO_SHOW_TIMEOUT);

      const whereClause: any = {
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.WAITING],
        },
        scheduledAt: { lt: cutoffTime },
      };

      if (data.tenantId) {
        whereClause.tenantId = data.tenantId;
      }

      const appointments = await this.prisma.appointment.findMany({
        where: whereClause,
        select: { id: true, tenantId: true, scheduledAt: true },
      });

      // Filtrar apenas os que já passaram do horário de tolerância
      const noShowAppointments = appointments.filter((apt) =>
        isBefore(apt.scheduledAt, cutoffTime),
      );

      if (noShowAppointments.length === 0) {
        this.logger.debug('No appointments to mark as no-show');
        return;
      }

      const ids = noShowAppointments.map((a) => a.id);

      await this.prisma.appointment.updateMany({
        where: { id: { in: ids } },
        data: {
          status: AppointmentStatus.NO_SHOW,
          noShowAt: new Date(),
        },
      });

      this.logger.log(
        `Marked ${noShowAppointments.length} appointments as no-show`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-mark no-show: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Job de limpeza de agendamentos antigos (para manutenção)
   */
  @Process('cleanup-old-appointments')
  async handleCleanupOldAppointments(
    job: Job<{ tenantId?: string; olderThanDays: number }>,
  ): Promise<void> {
    const { data } = job;
    const olderThanDays = data.olderThanDays ?? 365;

    this.logger.log(`Cleaning up appointments older than ${olderThanDays} days`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const whereClause: any = {
        scheduledAt: { lt: cutoffDate },
        status: {
          in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      };

      if (data.tenantId) {
        whereClause.tenantId = data.tenantId;
      }

      // Arquivar em vez de deletar (soft delete)
      const result = await this.prisma.appointment.updateMany({
        where: whereClause,
        data: {
          archivedAt: new Date(),
        },
      });

      this.logger.log(`Archived ${result.count} old appointments`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old appointments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
