/**
 * Interface para dados do evento de cliente
 */
export interface CustomerEventData {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  tags: string[];
}

/**
 * Evento base de cliente
 */
export abstract class BaseCustomerEvent {
  abstract readonly eventName: string;
  readonly occurredAt: Date;

  constructor(
    public readonly customer: CustomerEventData,
    public readonly metadata?: Record<string, any>,
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Serializa o evento para envio/armazenamento
   */
  toJSON() {
    return {
      eventName: this.eventName,
      customer: this.customer,
      metadata: this.metadata,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
