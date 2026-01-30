import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';

/**
 * Fonte de criação do cliente
 */
export type CustomerCreationSource =
  | 'MANUAL'        // Cadastro manual pelo staff
  | 'SELF_SERVICE'  // Auto-cadastro pelo cliente
  | 'IMPORT'        // Importação em lote
  | 'BOOKING'       // Criado durante agendamento
  | 'REFERRAL'      // Indicação
  | 'API';          // Via API externa

/**
 * Evento emitido quando um cliente é criado
 */
export class CustomerCreatedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.created';

  constructor(
    customer: CustomerEventData,
    public readonly source: CustomerCreationSource,
    public readonly createdBy?: string,
    public readonly referredBy?: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }

  /**
   * Verifica se foi indicado por outro cliente
   */
  isReferral(): boolean {
    return !!this.referredBy;
  }

  /**
   * Verifica se foi auto-cadastro
   */
  isSelfService(): boolean {
    return this.source === 'SELF_SERVICE';
  }
}
