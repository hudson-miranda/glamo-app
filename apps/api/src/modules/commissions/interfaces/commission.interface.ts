// ========================
// ENUMS
// ========================

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED',
  MIXED = 'MIXED',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum CommissionTrigger {
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  CUSTOMER_REFERRED = 'CUSTOMER_REFERRED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
}

export enum GoalType {
  REVENUE = 'REVENUE',
  APPOINTMENTS = 'APPOINTMENTS',
  NEW_CUSTOMERS = 'NEW_CUSTOMERS',
  PRODUCT_SALES = 'PRODUCT_SALES',
  SERVICE_COUNT = 'SERVICE_COUNT',
  CUSTOMER_RETENTION = 'CUSTOMER_RETENTION',
}

export enum GoalPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum BonusType {
  GOAL_BONUS = 'GOAL_BONUS',
  PERFORMANCE_BONUS = 'PERFORMANCE_BONUS',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  LOYALTY_BONUS = 'LOYALTY_BONUS',
  SEASONAL_BONUS = 'SEASONAL_BONUS',
}

// ========================
// INTERFACES
// ========================

export interface TierConfig {
  minValue: number;
  maxValue?: number;
  percentage?: number;
  fixedAmount?: number;
}

export interface CommissionRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: CommissionType;
  trigger: CommissionTrigger;
  percentage?: number;
  fixedAmount?: number;
  tiers?: TierConfig[];
  conditions?: CommissionCondition;
  isDefault: boolean;
  isActive: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionCondition {
  serviceIds?: string[];
  serviceCategoryIds?: string[];
  productIds?: string[];
  productCategoryIds?: string[];
  professionalIds?: string[];
  minTransactionValue?: number;
  maxTransactionValue?: number;
  dayOfWeek?: number[];
  timeRange?: { start: string; end: string };
  customerTypes?: string[];
}

export interface ProfessionalCommissionConfig {
  id: string;
  tenantId: string;
  professionalId: string;
  professionalName: string;
  ruleId?: string;
  customRules?: CommissionRule[];
  defaultPercentage: number;
  serviceOverrides: ServiceCommissionOverride[];
  productOverrides: ProductCommissionOverride[];
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface ServiceCommissionOverride {
  serviceId: string;
  serviceName: string;
  type: CommissionType;
  percentage?: number;
  fixedAmount?: number;
}

export interface ProductCommissionOverride {
  productId: string;
  productName: string;
  type: CommissionType;
  percentage?: number;
  fixedAmount?: number;
}

export interface CommissionEntry {
  id: string;
  tenantId: string;
  professionalId: string;
  professionalName: string;
  referenceType: 'APPOINTMENT' | 'SALE' | 'REFERRAL' | 'BONUS';
  referenceId: string;
  ruleId?: string;
  ruleName?: string;
  baseValue: number;
  commissionType: CommissionType;
  percentage?: number;
  fixedAmount?: number;
  calculatedAmount: number;
  adjustments: CommissionAdjustment[];
  finalAmount: number;
  status: CommissionStatus;
  notes?: string;
  serviceId?: string;
  serviceName?: string;
  productId?: string;
  productName?: string;
  customerId?: string;
  customerName?: string;
  referenceDate: Date;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionAdjustment {
  type: 'BONUS' | 'DEDUCTION' | 'CORRECTION';
  amount: number;
  reason: string;
  appliedBy: string;
  appliedAt: Date;
}

export interface CommissionPayment {
  id: string;
  tenantId: string;
  professionalId: string;
  professionalName: string;
  periodStart: Date;
  periodEnd: Date;
  entries: string[];
  entryCount: number;
  grossAmount: number;
  deductions: PaymentDeduction[];
  bonuses: PaymentBonus[];
  netAmount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  processedAt?: Date;
  processedBy?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDeduction {
  type: string;
  description: string;
  amount: number;
}

export interface PaymentBonus {
  type: BonusType;
  description: string;
  amount: number;
  goalId?: string;
}

export interface Goal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: GoalType;
  period: GoalPeriod;
  target: number;
  bonusAmount?: number;
  bonusPercentage?: number;
  professionalId?: string;
  teamId?: string;
  isGlobal: boolean;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  type: GoalType;
  target: number;
  current: number;
  percentage: number;
  isAchieved: boolean;
  remainingDays: number;
  projectedValue?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface CommissionSummary {
  professionalId: string;
  professionalName: string;
  period: { start: Date; end: Date };
  totalEntries: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  totalAmount: number;
  averageCommission: number;
  topServices: { serviceId: string; serviceName: string; amount: number }[];
  topProducts: { productId: string; productName: string; amount: number }[];
  goalProgress: GoalProgress[];
}

export interface CommissionReport {
  period: { start: Date; end: Date };
  totals: {
    grossRevenue: number;
    totalCommissions: number;
    commissionRate: number;
    entriesCount: number;
    professionalsCount: number;
  };
  byProfessional: {
    professionalId: string;
    professionalName: string;
    revenue: number;
    commissions: number;
    entries: number;
    averageTicket: number;
  }[];
  byService: {
    serviceId: string;
    serviceName: string;
    revenue: number;
    commissions: number;
    count: number;
  }[];
  byProduct: {
    productId: string;
    productName: string;
    revenue: number;
    commissions: number;
    count: number;
  }[];
  trends: {
    date: string;
    revenue: number;
    commissions: number;
  }[];
}
