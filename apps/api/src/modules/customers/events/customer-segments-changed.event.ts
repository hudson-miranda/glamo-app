import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';

/**
 * Evento emitido quando segmentos de um cliente mudam
 */
export class CustomerSegmentsChangedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.segments_changed';

  constructor(
    customer: CustomerEventData,
    public readonly previousSegments: string[],
    public readonly currentSegments: string[],
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }

  /**
   * Segmentos adicionados
   */
  get addedSegments(): string[] {
    return this.currentSegments.filter((s) => !this.previousSegments.includes(s));
  }

  /**
   * Segmentos removidos
   */
  get removedSegments(): string[] {
    return this.previousSegments.filter((s) => !this.currentSegments.includes(s));
  }

  /**
   * Verifica se entrou em um segmento específico
   */
  enteredSegment(segmentSlug: string): boolean {
    return this.addedSegments.includes(segmentSlug);
  }

  /**
   * Verifica se saiu de um segmento específico
   */
  leftSegment(segmentSlug: string): boolean {
    return this.removedSegments.includes(segmentSlug);
  }
}
