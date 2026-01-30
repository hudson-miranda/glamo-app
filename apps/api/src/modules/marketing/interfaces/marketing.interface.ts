// ========================
// ENUMS
// ========================

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  MULTI_CHANNEL = 'MULTI_CHANNEL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CampaignTrigger {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  EVENT = 'EVENT',
  AUTOMATED = 'AUTOMATED',
}

export enum AutomationTrigger {
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  FIRST_APPOINTMENT = 'FIRST_APPOINTMENT',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  INACTIVE_CUSTOMER = 'INACTIVE_CUSTOMER',
  ABANDONED_CART = 'ABANDONED_CART',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  LOYALTY_MILESTONE = 'LOYALTY_MILESTONE',
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_SERVICE = 'FREE_SERVICE',
  FREE_PRODUCT = 'FREE_PRODUCT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  DEPLETED = 'DEPLETED',
}

export enum LoyaltyTierType {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export enum LoyaltyTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  BONUS = 'BONUS',
  EXPIRE = 'EXPIRE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REWARDED = 'REWARDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ========================
// INTERFACES
// ========================

export interface CampaignAudience {
  type: 'ALL' | 'SEGMENT' | 'CUSTOM' | 'IMPORT';
  segmentId?: string;
  customerIds?: string[];
  filters?: AudienceFilter[];
  excludeIds?: string[];
  estimatedSize?: number;
}

export interface AudienceFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
}

export interface CampaignContent {
  subject?: string;
  body: string;
  htmlBody?: string;
  templateId?: string;
  variables?: Record<string, string>;
  attachments?: string[];
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignSchedule {
  sendAt?: Date;
  timezone?: string;
  sendByBatches?: boolean;
  batchSize?: number;
  batchIntervalMinutes?: number;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  trigger: CampaignTrigger;
  audience: CampaignAudience;
  content: CampaignContent;
  schedule?: CampaignSchedule;
  automation?: AutomationConfig;
  stats: CampaignStats;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AutomationConfig {
  trigger: AutomationTrigger;
  delayMinutes?: number;
  conditions?: AudienceFilter[];
  followUpEnabled?: boolean;
  followUpDelayDays?: number;
  maxSendsPerCustomer?: number;
}

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'CONVERTED' | 'BOUNCED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  failureReason?: string;
}

export interface CouponUsageLimit {
  totalUses?: number;
  usesPerCustomer?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
}

export interface CouponApplicability {
  serviceIds?: string[];
  serviceCategoryIds?: string[];
  productIds?: string[];
  productCategoryIds?: string[];
  professionalIds?: string[];
  excludeServiceIds?: string[];
  excludeProductIds?: string[];
  newCustomersOnly?: boolean;
  firstPurchaseOnly?: boolean;
}

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  status: CouponStatus;
  value: number;
  buyQuantity?: number;
  getQuantity?: number;
  freeServiceId?: string;
  freeProductId?: string;
  usageLimits: CouponUsageLimit;
  applicability: CouponApplicability;
  validFrom: Date;
  validTo: Date;
  usedCount: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  campaignId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponRedemption {
  id: string;
  tenantId: string;
  couponId: string;
  couponCode: string;
  customerId: string;
  appointmentId?: string;
  saleId?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  redeemedAt: Date;
}

export interface LoyaltyProgram {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  pointsPerCurrency: number;
  currencyPerPoint: number;
  minPointsRedemption: number;
  pointsExpireDays?: number;
  tiers: LoyaltyTier[];
  earnRules: LoyaltyEarnRule[];
  bonusRules: LoyaltyBonusRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTier {
  id: string;
  type: LoyaltyTierType;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  pointsMultiplier: number;
  discountPercentage?: number;
  exclusiveServices?: string[];
  priorityBooking?: boolean;
}

export interface LoyaltyEarnRule {
  id: string;
  name: string;
  trigger: 'PURCHASE' | 'SERVICE' | 'PRODUCT' | 'REFERRAL' | 'REVIEW';
  pointsAmount?: number;
  pointsPercentage?: number;
  serviceIds?: string[];
  productIds?: string[];
  isActive: boolean;
}

export interface LoyaltyBonusRule {
  id: string;
  name: string;
  trigger: 'BIRTHDAY' | 'ANNIVERSARY' | 'FIRST_PURCHASE' | 'MILESTONE' | 'PROMOTION';
  bonusPoints: number;
  milestoneValue?: number;
  isActive: boolean;
}

export interface CustomerLoyalty {
  id: string;
  tenantId: string;
  customerId: string;
  programId: string;
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  currentTier: LoyaltyTierType;
  tierProgress: number;
  nextTier?: LoyaltyTierType;
  pointsToNextTier?: number;
  memberSince: Date;
  lastActivityAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  tenantId: string;
  customerId: string;
  type: LoyaltyTransactionType;
  points: number;
  balance: number;
  description: string;
  referenceType?: 'APPOINTMENT' | 'SALE' | 'REFERRAL' | 'BONUS';
  referenceId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReferralProgram {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  referrerReward: ReferralReward;
  refereeReward: ReferralReward;
  minPurchaseAmount?: number;
  maxReferralsPerCustomer?: number;
  validDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralReward {
  type: 'POINTS' | 'DISCOUNT' | 'CREDIT' | 'FREE_SERVICE';
  value: number;
  serviceId?: string;
}

export interface Referral {
  id: string;
  tenantId: string;
  programId: string;
  referrerCustomerId: string;
  refereeCustomerId?: string;
  refereeEmail?: string;
  refereePhone?: string;
  referralCode: string;
  status: ReferralStatus;
  referrerRewardGiven: boolean;
  refereeRewardGiven: boolean;
  conversionAppointmentId?: string;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

export interface CustomerSegment {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  filters: AudienceFilter[];
  isDynamic: boolean;
  customerCount: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface MarketingStats {
  campaigns: {
    total: number;
    active: number;
    completed: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  coupons: {
    active: number;
    totalRedemptions: number;
    totalDiscount: number;
  };
  loyalty: {
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    avgPointsPerMember: number;
  };
  referrals: {
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
  };
}
