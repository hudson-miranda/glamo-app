import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';

/**
 * Dados do evento de reagendamento
 */
export interface AppointmentRescheduledEventData extends AppointmentEventData {
  rescheduledAt: Date;
  rescheduledBy: string;
  previousScheduledAt: Date;
  previousProfessionalId?: string;
  reason?: string;
  rescheduledByClient: boolean;
}

/**
 * Evento emitido quando um agendamento é reagendado
 */
export class AppointmentRescheduledEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.rescheduled';

  constructor(
    public readonly data: AppointmentRescheduledEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get rescheduledAt(): Date {
    return this.data.rescheduledAt;
  }

  get previousScheduledAt(): Date {
    return this.data.previousScheduledAt;
  }

  get previousProfessionalId(): string | undefined {
    return this.data.previousProfessionalId;
  }

  get reason(): string | undefined {
    return this.data.reason;
  }

  get wasChangedProfessional(): boolean {
    return (
      this.data.previousProfessionalId !== undefined &&
      this.data.previousProfessionalId !== this.data.professionalId
    );
  }
}
