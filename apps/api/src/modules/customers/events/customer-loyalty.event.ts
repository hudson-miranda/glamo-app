import { BaseCustomerEvent, CustomerEventData } from './base-customer.event';
import { LoyaltyTier } from '../interfaces';

/**
 * Evento emitido quando pontos de fidelidade são adicionados
 */
export class CustomerLoyaltyPointsAddedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.loyalty.points_added';

  constructor(
    customer: CustomerEventData,
    public readonly points: number,
    public readonly newBalance: number,
    public readonly description: string,
    public readonly referenceId?: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }
}

/**
 * Evento emitido quando pontos são resgatados
 */
export class CustomerLoyaltyPointsRedeemedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.loyalty.points_redeemed';

  constructor(
    customer: CustomerEventData,
    public readonly points: number,
    public readonly newBalance: number,
    public readonly rewardId: string,
    public readonly rewardName: string,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }
}

/**
 * Evento emitido quando o tier de fidelidade muda
 */
export class CustomerLoyaltyTierChangedEvent extends BaseCustomerEvent {
  readonly eventName = 'customer.loyalty.tier_changed';

  constructor(
    customer: CustomerEventData,
    public readonly previousTier: LoyaltyTier,
    public readonly newTier: LoyaltyTier,
    public readonly currentPoints: number,
    metadata?: Record<string, any>,
  ) {
    super(customer, metadata);
  }

  /**
   * Verifica se foi uma promoção de tier
   */
  isPromotion(): boolean {
    const tierOrder = [
      LoyaltyTier.BRONZE,
      LoyaltyTier.SILVER,
      LoyaltyTier.GOLD,
      LoyaltyTier.PLATINUM,
      LoyaltyTier.DIAMOND,
    ];

    const previousIndex = tierOrder.indexOf(this.previousTier);
    const newIndex = tierOrder.indexOf(this.newTier);

    return newIndex > previousIndex;
  }

  /**
   * Verifica se foi um rebaixamento de tier
   */
  isDemotion(): boolean {
    return !this.isPromotion();
  }
}
