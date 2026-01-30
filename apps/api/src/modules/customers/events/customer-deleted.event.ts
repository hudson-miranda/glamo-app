import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';

/**
 * Evento emitido quando um cliente é deletado (soft delete)
 */
export class CustomerDeletedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.deleted';

  constructor(
    customer: CustomerEventData,
    public readonly deletedBy?: string,
    public readonly reason?: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }
}
