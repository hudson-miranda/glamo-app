import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';

/**
 * Evento emitido quando clientes são mesclados
 */
export class CustomersMergedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.merged';

  constructor(
    customer: CustomerEventData, // Cliente principal
    public readonly mergedCustomerIds: string[],
    public readonly appointmentsTransferred: number,
    public readonly loyaltyPointsConsolidated: number,
    public readonly mergedBy?: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }

  /**
   * Quantidade de clientes mesclados
   */
  get mergedCount(): number {
    return this.mergedCustomerIds.length;
  }
}
