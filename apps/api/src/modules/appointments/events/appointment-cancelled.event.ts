import { BaseAppointmentEvent, AppointmentEventData } from './base-appointment.event';
import { CancellationReason } from '../dto/cancel-appointment.dto';

/**
 * Dados do evento de cancelamento
 */
export interface AppointmentCancelledEventData extends AppointmentEventData {
  cancelledAt: Date;
  cancelledBy: string;
  cancelledByClient: boolean;
  reason: CancellationReason;
  description?: string;
  wasConfirmed: boolean;
  hoursBeforeScheduled: number;
}

/**
 * Evento emitido quando um agendamento é cancelado
 */
export class AppointmentCancelledEvent extends BaseAppointmentEvent {
  static readonly eventName = 'appointment.cancelled';

  constructor(
    public readonly data: AppointmentCancelledEventData,
    triggeredBy?: string,
  ) {
    super(data, new Date(), triggeredBy);
  }

  get cancelledAt(): Date {
    return this.data.cancelledAt;
  }

  get cancelledBy(): string {
    return this.data.cancelledBy;
  }

  get cancelledByClient(): boolean {
    return this.data.cancelledByClient;
  }

  get reason(): CancellationReason {
    return this.data.reason;
  }

  get wasConfirmed(): boolean {
    return this.data.wasConfirmed;
  }

  /**
   * Verifica se foi um cancelamento tardio (menos de X horas antes)
   */
  isLateCancellation(minHours: number = 24): boolean {
    return this.data.hoursBeforeScheduled < minHours;
  }
}
