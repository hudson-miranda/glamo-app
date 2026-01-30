import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';

/**
 * Dados adicionais do evento de criação
 */
export interface AppointmentCreatedEventData extends AppointmentEventData {
  source: string;
  isRecurring: boolean;
  recurrenceGroupId?: string;
}

/**
 * Evento emitido quando um agendamento é criado
 */
export class AppointmentCreatedEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.created';

  constructor(
    public readonly data: AppointmentCreatedEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get source(): string {
    return this.data.source;
  }

  get isRecurring(): boolean {
    return this.data.isRecurring;
  }
}
