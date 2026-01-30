import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';

/**
 * Dados do evento de conclusão
 */
export interface AppointmentCompletedEventData extends AppointmentEventData {
  completedAt: Date;
  completedBy: string;
  actualDuration?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL';
  rating?: number;
  feedback?: string;
}

/**
 * Evento emitido quando um agendamento é concluído
 */
export class AppointmentCompletedEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.completed';

  constructor(
    public readonly data: AppointmentCompletedEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get completedAt(): Date {
    return this.data.completedAt;
  }

  get completedBy(): string {
    return this.data.completedBy;
  }

  get actualDuration(): number | undefined {
    return this.data.actualDuration;
  }

  get paymentStatus(): string | undefined {
    return this.data.paymentStatus;
  }
}
