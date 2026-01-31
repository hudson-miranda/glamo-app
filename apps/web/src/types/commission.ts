/**
 * GLAMO - Commission Types
 * Complete commission type definitions per RF-COM-001 to RF-COM-005
 * 
 * @version 1.0.0
 * @description Commission calculation, tracking, and payment
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  PaymentStatus,
  PaymentMethod,
  AuditFields,
} from './base';

// ============================================================================
// COMMISSION CALCULATION TYPES
// ============================================================================

/** Commission origin */
export type CommissionOrigin = 
  | 'service'          // Serviço
  | 'product'          // Produto
  | 'package'          // Pacote
  | 'bonus'            // Bônus
  | 'goal_achievement' // Meta atingida
  | 'referral';        // Indicação

/** Commission calculation method */
export type CommissionCalculationMethod = 
  | 'gross_value'      // Sobre valor bruto
  | 'net_value'        // Sobre valor líquido (descontando custos)
  | 'profit_margin';   // Sobre margem de lucro

/** Commission status */
export type CommissionStatus = 
  | 'pending'          // Aguardando (serviço não concluído)
  | 'calculated'       // Calculada
  | 'approved'         // Aprovada
  | 'paid'             // Paga
  | 'cancelled';       // Cancelada

// ============================================================================
// COMMISSION RULE
// ============================================================================

/** Commission rule type */
export type CommissionRuleType = 
  | 'default'          // Regra padrão
  | 'service'          // Por serviço
  | 'category'         // Por categoria
  | 'professional'     // Por profissional
  | 'goal_based'       // Baseada em meta
  | 'tiered';          // Escalonada

/** Commission tier for tiered rules */
export interface CommissionTier {
  minValue: Decimal;
  maxValue?: Decimal;
  percentage: Decimal;
  fixedBonus?: Decimal;
}

/** Commission rule */
export interface CommissionRule {
  id: UUID;
  tenantId: UUID;
  
  name: string;
  description?: string;
  type: CommissionRuleType;
  
  // Scope
  appliesToAllProfessionals: boolean;
  professionalIds: UUID[];
  
  appliesToAllServices: boolean;
  serviceIds: UUID[];
  categoryIds: UUID[];
  
  // Calculation
  calculationMethod: CommissionCalculationMethod;
  percentage: Decimal;
  fixedAmount?: Decimal;
  tiers?: CommissionTier[];
  
  // Deductions
  deductProductCosts: boolean;
  deductTaxes: boolean;
  deductFees: boolean;
  
  // Validity
  validFrom: ISODate;
  validUntil?: ISODate;
  
  // Priority (higher = applied first)
  priority: number;
  
  isActive: boolean;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// COMMISSION SPLIT
// ============================================================================

/** Split between professionals */
export interface CommissionSplit {
  professionalId: UUID;
  professionalName: string;
  percentage: Decimal;
  amount: Decimal;
}

// ============================================================================
// MAIN COMMISSION INTERFACE
// ============================================================================

/** Commission entry */
export interface Commission extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  // Professional
  professionalId: UUID;
  professionalName: string;
  professionalCode: string;
  
  // Reference
  origin: CommissionOrigin;
  appointmentId?: UUID;
  appointmentCode?: string;
  serviceId?: UUID;
  serviceName?: string;
  productId?: UUID;
  productName?: string;
  packageId?: UUID;
  packageName?: string;
  goalId?: UUID;
  goalName?: string;
  
  // Customer
  customerId?: UUID;
  customerName?: string;
  
  // Date
  referenceDate: ISODate;
  periodStart: ISODate;
  periodEnd: ISODate;
  
  // Values
  grossValue: Decimal;
  deductions: {
    productCosts: Decimal;
    taxes: Decimal;
    fees: Decimal;
    other: Decimal;
    description?: string;
  };
  netValue: Decimal;
  
  // Commission calculation
  ruleId: UUID;
  ruleName: string;
  calculationMethod: CommissionCalculationMethod;
  percentage: Decimal;
  commissionAmount: Decimal;
  fixedBonus: Decimal;
  totalAmount: Decimal;
  
  // Adjustments
  adjustments: {
    id: UUID;
    type: 'bonus' | 'deduction';
    reason: string;
    amount: Decimal;
    createdBy: UUID;
    createdAt: ISODateTime;
  }[];
  finalAmount: Decimal;
  
  // Split (if multiple professionals)
  isSplit: boolean;
  splits?: CommissionSplit[];
  
  // Status
  status: CommissionStatus;
  
  // Approval
  approvedBy?: UUID;
  approvedByName?: string;
  approvedAt?: ISODateTime;
  
  // Payment
  paymentId?: UUID;
  paidAt?: ISODateTime;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  
  // Cancellation
  cancelledBy?: UUID;
  cancelledAt?: ISODateTime;
  cancellationReason?: string;
  
  // Notes
  notes?: string;
  internalNotes?: string;
}

// ============================================================================
// COMMISSION LIST ITEM
// ============================================================================

/** Simplified commission for list views */
export interface CommissionListItem {
  id: UUID;
  professionalId: UUID;
  professionalName: string;
  origin: CommissionOrigin;
  serviceName?: string;
  productName?: string;
  customerName?: string;
  referenceDate: ISODate;
  grossValue: Decimal;
  commissionAmount: Decimal;
  finalAmount: Decimal;
  status: CommissionStatus;
}

// ============================================================================
// COMMISSION SUMMARY
// ============================================================================

/** Professional commission summary */
export interface ProfessionalCommissionSummary {
  professionalId: UUID;
  professionalName: string;
  periodStart: ISODate;
  periodEnd: ISODate;
  
  // Totals
  totalGrossValue: Decimal;
  totalDeductions: Decimal;
  totalNetValue: Decimal;
  totalCommission: Decimal;
  totalBonuses: Decimal;
  totalAdjustments: Decimal;
  finalTotal: Decimal;
  
  // By origin
  byOrigin: {
    origin: CommissionOrigin;
    count: number;
    grossValue: Decimal;
    commission: Decimal;
  }[];
  
  // By status
  pending: Decimal;
  calculated: Decimal;
  approved: Decimal;
  paid: Decimal;
  
  // Count
  totalEntries: number;
}

/** General commission summary */
export interface CommissionSummary {
  periodStart: ISODate;
  periodEnd: ISODate;
  
  totalGrossValue: Decimal;
  totalCommissions: Decimal;
  totalPaid: Decimal;
  totalPending: Decimal;
  
  byProfessional: ProfessionalCommissionSummary[];
  
  // Comparison
  previousPeriod?: {
    totalGrossValue: Decimal;
    totalCommissions: Decimal;
    variation: {
      grossValue: Decimal;
      commissions: Decimal;
    };
  };
}

// ============================================================================
// COMMISSION FILTERS
// ============================================================================

/** Commission filter options */
export interface CommissionFilters {
  search?: string;
  professionalId?: UUID | UUID[];
  origin?: CommissionOrigin | CommissionOrigin[];
  status?: CommissionStatus | CommissionStatus[];
  serviceId?: UUID;
  categoryId?: UUID;
  customerId?: UUID;
  dateFrom?: ISODate;
  dateTo?: ISODate;
  amountMin?: Decimal;
  amountMax?: Decimal;
}

// ============================================================================
// COMMISSION PAYMENT
// ============================================================================

/** Commission payment batch */
export interface CommissionPayment extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  code: string;
  
  // Period
  periodStart: ISODate;
  periodEnd: ISODate;
  paymentDate: ISODate;
  
  // Professionals
  professionals: {
    professionalId: UUID;
    professionalName: string;
    commissionIds: UUID[];
    totalAmount: Decimal;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    status: 'pending' | 'paid' | 'failed';
    paidAt?: ISODateTime;
    errorMessage?: string;
  }[];
  
  // Totals
  totalAmount: Decimal;
  totalProfessionals: number;
  totalCommissions: number;
  
  // Status
  status: 'draft' | 'processing' | 'completed' | 'partial';
  
  processedAt?: ISODateTime;
  processedBy?: UUID;
  
  notes?: string;
}

// ============================================================================
// COMMISSION FORM DATA
// ============================================================================

/** Data for manual commission creation */
export interface CreateCommissionData {
  professionalId: UUID;
  origin: CommissionOrigin;
  referenceDate: ISODate;
  description: string;
  
  grossValue: Decimal;
  productCosts?: Decimal;
  
  percentage?: Decimal;
  fixedAmount?: Decimal;
  
  appointmentId?: UUID;
  serviceId?: UUID;
  productId?: UUID;
  customerId?: UUID;
  
  notes?: string;
}

/** Data for commission adjustment */
export interface CreateCommissionAdjustmentData {
  commissionId: UUID;
  type: 'bonus' | 'deduction';
  reason: string;
  amount: Decimal;
}

/** Data for bulk commission approval */
export interface BulkApproveCommissionsData {
  commissionIds: UUID[];
  notes?: string;
}

/** Data for commission payment */
export interface CreateCommissionPaymentData {
  periodStart: ISODate;
  periodEnd: ISODate;
  paymentDate: ISODate;
  professionals: {
    professionalId: UUID;
    commissionIds: UUID[];
    paymentMethod: PaymentMethod;
    paymentReference?: string;
  }[];
  notes?: string;
}

// ============================================================================
// GOAL CONFIGURATION
// ============================================================================

/** Goal metric */
export type GoalMetric = 
  | 'revenue'
  | 'services_count'
  | 'products_sold'
  | 'new_clients'
  | 'return_clients'
  | 'average_ticket'
  | 'custom';

/** Commission goal */
export interface CommissionGoal {
  id: UUID;
  tenantId: UUID;
  
  name: string;
  description?: string;
  
  // Scope
  appliesToAllProfessionals: boolean;
  professionalIds: UUID[];
  
  // Metric
  metric: GoalMetric;
  customMetricFormula?: string;
  
  // Target
  targetValue: Decimal;
  
  // Bonus
  bonusType: 'percentage' | 'fixed';
  bonusValue: Decimal;
  
  // Period
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  // Validity
  validFrom: ISODate;
  validUntil?: ISODate;
  
  isActive: boolean;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Goal progress */
export interface GoalProgress {
  goalId: UUID;
  goalName: string;
  professionalId: UUID;
  professionalName: string;
  
  periodStart: ISODate;
  periodEnd: ISODate;
  
  targetValue: Decimal;
  currentValue: Decimal;
  progress: Decimal; // Percentage
  remaining: Decimal;
  
  isAchieved: boolean;
  achievedAt?: ISODateTime;
  
  bonusAmount?: Decimal;
  bonusPaid: boolean;
}
