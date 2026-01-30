import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';

/**
 * Tipo do lembrete
 */
export enum ReminderType {
  FIRST_REMINDER = 'FIRST_REMINDER',     // 24h antes
  SECOND_REMINDER = 'SECOND_REMINDER',   // 2h antes
  CONFIRMATION_REQUEST = 'CONFIRMATION_REQUEST',
}

/**
 * Canal do lembrete
 */
export enum ReminderChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

/**
 * Dados do evento de lembrete
 */
export interface AppointmentReminderEventData extends AppointmentEventData {
  reminderType: ReminderType;
  channels: ReminderChannel[];
  hoursBeforeScheduled: number;
}

/**
 * Evento emitido quando um lembrete deve ser enviado
 */
export class AppointmentReminderEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.reminder';

  constructor(
    public readonly data: AppointmentReminderEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get reminderType(): ReminderType {
    return this.data.reminderType;
  }

  get channels(): ReminderChannel[] {
    return this.data.channels;
  }

  get hoursBeforeScheduled(): number {
    return this.data.hoursBeforeScheduled;
  }
}
