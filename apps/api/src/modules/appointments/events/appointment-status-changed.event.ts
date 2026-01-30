import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';
import { AppointmentStatus } from '@glamo/database';

/**
 * Dados do evento de transição de status
 */
export interface AppointmentStatusChangedEventData extends AppointmentEventData {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

/**
 * Evento emitido quando o status de um agendamento muda
 */
export class AppointmentStatusChangedEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.status_changed';

  constructor(
    public readonly data: AppointmentStatusChangedEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get previousStatus(): AppointmentStatus {
    return this.data.previousStatus;
  }

  get newStatus(): AppointmentStatus {
    return this.data.newStatus;
  }

  get changedAt(): Date {
    return this.data.changedAt;
  }
}
