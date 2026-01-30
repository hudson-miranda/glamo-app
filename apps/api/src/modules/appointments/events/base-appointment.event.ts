import { AppointmentStatus } from '@glamo/database';

/**
 * Dados base do evento de agendamento
 */
export interface AppointmentEventData {
  id: string;
  tenantId: string;
  clientId: string;
  professionalId: string;
  scheduledAt: Date;
  endTime: Date;
  status: AppointmentStatus;
  totalDuration: number;
  totalPrice: number;
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
    quantity: number;
  }[];
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  professional?: {
    id: string;
    name: string;
    email?: string;
  };
}

/**
 * Evento base de agendamento
 */
export abstract class BaseAppointmentEvent {
  constructor(
    public readonly data: AppointmentEventData,
    public readonly timestamp: Date = new Date(),
    public readonly triggeredBy?: string,
  ) {}

  get appointmentId(): string {
    return this.data.id;
  }

  get tenantId(): string {
    return this.data.tenantId;
  }
}
