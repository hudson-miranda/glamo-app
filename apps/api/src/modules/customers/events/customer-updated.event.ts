import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';

/**
 * Campos que foram alterados
 */
export interface CustomerChangedFields {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Evento emitido quando um cliente é atualizado
 */
export class CustomerUpdatedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.updated';

  constructor(
    customer: CustomerEventData,
    public readonly changedFields: CustomerChangedFields[],
    public readonly updatedBy?: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }

  /**
   * Verifica se um campo específico foi alterado
   */
  hasFieldChanged(fieldName: string): boolean {
    return this.changedFields.some((f) => f.field === fieldName);
  }

  /**
   * Obtém o valor anterior de um campo
   */
  getOldValue(fieldName: string): any {
    const field = this.changedFields.find((f) => f.field === fieldName);
    return field?.oldValue;
  }

  /**
   * Obtém o novo valor de um campo
   */
  getNewValue(fieldName: string): any {
    const field = this.changedFields.find((f) => f.field === fieldName);
    return field?.newValue;
  }

  /**
   * Verifica se dados de contato foram alterados
   */
  hasContactChanged(): boolean {
    return this.changedFields.some((f) =>
      ['email', 'phone'].includes(f.field),
    );
  }

  /**
   * Verifica se preferências de marketing foram alteradas
   */
  hasMarketingPreferencesChanged(): boolean {
    return this.changedFields.some((f) =>
      ['acceptsMarketing', 'preferences.receivePromotions'].includes(f.field),
    );
  }
}
