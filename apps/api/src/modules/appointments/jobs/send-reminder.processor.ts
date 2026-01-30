import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReminderService } from '../services/reminder.service';
import { ReminderType, ReminderChannel } from '../events/appointment-reminder.event';

/**
 * Dados do job de envio de lembrete
 */
export interface SendReminderJobData {
  appointmentId: string;
  tenantId: string;
  reminderType: ReminderType;
  channels: ReminderChannel[];
  hoursBeforeScheduled: number;
}

/**
 * Processor para jobs de lembrete de agendamento
 */
@Processor('appointments')
export class SendReminderProcessor {
  private readonly logger = new Logger(SendReminderProcessor.name);

  constructor(private readonly reminderService: ReminderService) {}

  /**
   * Processa job de envio de lembrete
   */
  @Process('send-reminder')
  async handleSendReminder(job: Job<SendReminderJobData>): Promise<void> {
    const { data } = job;

    this.logger.log(
      `Processing reminder job for appointment ${data.appointmentId} - type: ${data.reminderType}`,
    );

    try {
      await this.reminderService.processReminder(data);

      this.logger.log(
        `Successfully processed reminder for appointment ${data.appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process reminder for appointment ${data.appointmentId}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw para que o Bull possa fazer retry
    }
  }
}
