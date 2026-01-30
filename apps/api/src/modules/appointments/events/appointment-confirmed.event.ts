import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';

/**
 * Dados do evento de confirmação
 */
export interface AppointmentConfirmedEventData extends AppointmentEventData {
  confirmedAt: Date;
  confirmedBy: string;
  confirmationMethod: 'MANUAL' | 'AUTOMATIC' | 'CLIENT_RESPONSE';
}

/**
 * Evento emitido quando um agendamento é confirmado
 */
export class AppointmentConfirmedEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.confirmed';

  constructor(
    public readonly data: AppointmentConfirmedEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get confirmedAt(): Date {
    return this.data.confirmedAt;
  }

  get confirmedBy(): string {
    return this.data.confirmedBy;
  }

  get confirmationMethod(): string {
    return this.data.confirmationMethod;
  }
}
