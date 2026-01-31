/**
 * GLAMO - Financial Transaction Types
 * Complete financial type definitions
 * 
 * @version 1.0.0
 * @description Cash flow, transactions, receivables, payables
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  PaymentMethod,
  PaymentStatus,
  AuditFields,
  Metadata,
} from './base';

// ============================================================================
// TRANSACTION TYPES & CATEGORIES
// ============================================================================

/** Transaction type */
export type TransactionType = 
  | 'income'           // Receita
  | 'expense';         // Despesa

/** Transaction nature */
export type TransactionNature = 
  | 'service'          // Serviço prestado
  | 'product_sale'     // Venda de produto
  | 'subscription'     // Assinatura/mensalidade
  | 'package'          // Pacote
  | 'commission'       // Comissão
  | 'salary'           // Salário
  | 'rent'             // Aluguel
  | 'utilities'        // Água, luz, etc.
  | 'supplies'         // Insumos
  | 'maintenance'      // Manutenção
  | 'marketing'        // Marketing
  | 'tax'              // Impostos
  | 'fee'              // Taxas
  | 'transfer'         // Transferência
  | 'refund'           // Reembolso
  | 'other';           // Outros

/** Transaction recurrence */
export type TransactionRecurrence = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

// ============================================================================
// FINANCIAL CATEGORY
// ============================================================================

/** Financial category */
export interface FinancialCategory {
  id: UUID;
  tenantId: UUID;
  parentId?: UUID;
  
  name: string;
  description?: string;
  type: TransactionType;
  color: string;
  icon?: string;
  
  isSystem: boolean;
  isActive: boolean;
  
  children?: FinancialCategory[];
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Default financial categories */
export const DEFAULT_FINANCIAL_CATEGORIES: Omit<FinancialCategory, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
  // Income
  { name: 'Serviços', type: 'income', color: '#22C55E', isSystem: true, isActive: true },
  { name: 'Vendas de Produtos', type: 'income', color: '#10B981', isSystem: true, isActive: true },
  { name: 'Pacotes', type: 'income', color: '#06B6D4', isSystem: true, isActive: true },
  { name: 'Assinaturas', type: 'income', color: '#0EA5E9', isSystem: true, isActive: true },
  { name: 'Outros Recebimentos', type: 'income', color: '#8B5CF6', isSystem: true, isActive: true },
  
  // Expense
  { name: 'Comissões', type: 'expense', color: '#F59E0B', isSystem: true, isActive: true },
  { name: 'Salários', type: 'expense', color: '#EF4444', isSystem: true, isActive: true },
  { name: 'Aluguel', type: 'expense', color: '#DC2626', isSystem: true, isActive: true },
  { name: 'Água/Luz/Internet', type: 'expense', color: '#B91C1C', isSystem: true, isActive: true },
  { name: 'Insumos', type: 'expense', color: '#EA580C', isSystem: true, isActive: true },
  { name: 'Marketing', type: 'expense', color: '#D946EF', isSystem: true, isActive: true },
  { name: 'Impostos', type: 'expense', color: '#7C3AED', isSystem: true, isActive: true },
  { name: 'Taxas Bancárias', type: 'expense', color: '#6366F1', isSystem: true, isActive: true },
  { name: 'Manutenção', type: 'expense', color: '#6B7280', isSystem: true, isActive: true },
  { name: 'Outras Despesas', type: 'expense', color: '#9CA3AF', isSystem: true, isActive: true },
];

// ============================================================================
// CASH REGISTER
// ============================================================================

/** Cash register status */
export type CashRegisterStatus = 'open' | 'closed' | 'suspended';

/** Cash register movement type */
export type CashMovementType = 
  | 'opening'          // Abertura
  | 'sale'             // Venda
  | 'withdrawal'       // Sangria
  | 'deposit'          // Suprimento
  | 'closing';         // Fechamento

/** Cash register movement */
export interface CashMovement {
  id: UUID;
  registerId: UUID;
  type: CashMovementType;
  amount: Decimal;
  method: PaymentMethod;
  description?: string;
  referenceType?: 'appointment' | 'sale' | 'manual';
  referenceId?: UUID;
  performedBy: UUID;
  performedByName: string;
  performedAt: ISODateTime;
}

/** Cash register */
export interface CashRegister {
  id: UUID;
  tenantId: UUID;
  unitId: UUID;
  unitName: string;
  
  name: string;
  status: CashRegisterStatus;
  
  // Opening
  openedAt?: ISODateTime;
  openedBy?: UUID;
  openedByName?: string;
  openingBalance: Decimal;
  
  // Current state
  currentBalance: Decimal;
  expectedBalance: Decimal;
  
  // By payment method
  cashBalance: Decimal;
  cardBalance: Decimal;
  pixBalance: Decimal;
  otherBalance: Decimal;
  
  // Movements
  movements: CashMovement[];
  
  // Closing
  closedAt?: ISODateTime;
  closedBy?: UUID;
  closedByName?: string;
  closingBalance?: Decimal;
  difference?: Decimal;
  closingNotes?: string;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// BANK ACCOUNT
// ============================================================================

/** Bank account type */
export type BankAccountType = 'checking' | 'savings' | 'investment' | 'cash';

/** Bank account */
export interface BankAccount {
  id: UUID;
  tenantId: UUID;
  
  name: string;
  type: BankAccountType;
  
  bankCode?: string;
  bankName?: string;
  branch?: string;
  accountNumber?: string;
  
  currentBalance: Decimal;
  initialBalance: Decimal;
  
  isDefault: boolean;
  isActive: boolean;
  
  // Integration
  integrationProvider?: 'open_banking' | 'manual';
  integrationId?: string;
  lastSyncAt?: ISODateTime;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// MAIN TRANSACTION INTERFACE
// ============================================================================

/** Installment */
export interface TransactionInstallment {
  id: UUID;
  transactionId: UUID;
  number: number;
  amount: Decimal;
  dueDate: ISODate;
  paidAmount: Decimal;
  paidAt?: ISODateTime;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

/** Complete transaction entity */
export interface Transaction extends AuditFields {
  id: UUID;
  tenantId: UUID;
  unitId?: UUID;
  
  // Identification
  code: string; // Unique per tenant (e.g., TRX-00001)
  
  // Type & category
  type: TransactionType;
  nature: TransactionNature;
  categoryId: UUID;
  categoryName: string;
  
  // Description
  description: string;
  notes?: string;
  
  // Amount
  amount: Decimal;
  discountAmount: Decimal;
  feeAmount: Decimal;
  netAmount: Decimal;
  
  // Payment
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  
  // Dates
  transactionDate: ISODate;
  dueDate?: ISODate;
  paidAt?: ISODateTime;
  
  // Installments
  hasInstallments: boolean;
  installmentCount: number;
  installments: TransactionInstallment[];
  
  // Bank account
  accountId?: UUID;
  accountName?: string;
  
  // Recurrence
  isRecurring: boolean;
  recurrence?: TransactionRecurrence;
  recurrenceEndDate?: ISODate;
  parentTransactionId?: UUID;
  
  // References
  referenceType?: 'appointment' | 'purchase_order' | 'commission' | 'salary' | 'manual';
  referenceId?: UUID;
  
  // For income from services/products
  appointmentId?: UUID;
  customerId?: UUID;
  customerName?: string;
  
  // For expenses
  supplierId?: UUID;
  supplierName?: string;
  professionalId?: UUID;
  professionalName?: string;
  
  // Invoice
  invoiceNumber?: string;
  invoiceUrl?: string;
  
  // Attachments
  attachments: string[];
  
  // Reconciliation
  isReconciled: boolean;
  reconciledAt?: ISODateTime;
  reconciledBy?: UUID;
  
  // Tags
  tags: string[];
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Soft delete
  deletedAt?: ISODateTime;
}

// ============================================================================
// TRANSACTION LIST ITEM
// ============================================================================

/** Simplified transaction for list views */
export interface TransactionListItem {
  id: UUID;
  code: string;
  type: TransactionType;
  nature: TransactionNature;
  categoryName: string;
  categoryColor: string;
  description: string;
  amount: Decimal;
  netAmount: Decimal;
  transactionDate: ISODate;
  dueDate?: ISODate;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName?: string;
  supplierName?: string;
  isRecurring: boolean;
  isReconciled: boolean;
}

// ============================================================================
// TRANSACTION FILTERS
// ============================================================================

/** Transaction filter options */
export interface TransactionFilters {
  search?: string;
  type?: TransactionType | TransactionType[];
  nature?: TransactionNature | TransactionNature[];
  categoryId?: UUID | UUID[];
  status?: PaymentStatus | PaymentStatus[];
  paymentMethod?: PaymentMethod | PaymentMethod[];
  accountId?: UUID;
  unitId?: UUID;
  dateFrom?: ISODate;
  dateTo?: ISODate;
  dueDateFrom?: ISODate;
  dueDateTo?: ISODate;
  amountMin?: Decimal;
  amountMax?: Decimal;
  customerId?: UUID;
  supplierId?: UUID;
  professionalId?: UUID;
  isRecurring?: boolean;
  isReconciled?: boolean;
  tags?: string[];
}

// ============================================================================
// TRANSACTION FORM DATA
// ============================================================================

/** Data for creating a transaction */
export interface CreateTransactionData {
  type: TransactionType;
  categoryId: UUID;
  description: string;
  notes?: string;
  
  amount: Decimal;
  discountAmount?: Decimal;
  feeAmount?: Decimal;
  
  paymentMethod: PaymentMethod;
  transactionDate: ISODate;
  dueDate?: ISODate;
  
  // Installments
  hasInstallments?: boolean;
  installmentCount?: number;
  
  accountId?: UUID;
  
  // Recurrence
  isRecurring?: boolean;
  recurrence?: TransactionRecurrence;
  recurrenceEndDate?: ISODate;
  
  // References
  referenceType?: 'appointment' | 'purchase_order' | 'commission' | 'salary' | 'manual';
  referenceId?: UUID;
  customerId?: UUID;
  supplierId?: UUID;
  professionalId?: UUID;
  
  invoiceNumber?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/** Data for updating a transaction */
export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  status?: PaymentStatus;
  paidAt?: ISODateTime;
}

/** Data for recording payment */
export interface RecordPaymentData {
  transactionId: UUID;
  installmentId?: UUID;
  amount: Decimal;
  paidAt: ISODateTime;
  paymentMethod?: PaymentMethod;
  accountId?: UUID;
  notes?: string;
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

/** Cash flow summary */
export interface CashFlowSummary {
  period: {
    start: ISODate;
    end: ISODate;
  };
  
  income: {
    total: Decimal;
    realized: Decimal;
    pending: Decimal;
    byCategory: { categoryId: UUID; categoryName: string; amount: Decimal }[];
    byMethod: { method: PaymentMethod; amount: Decimal }[];
  };
  
  expense: {
    total: Decimal;
    realized: Decimal;
    pending: Decimal;
    byCategory: { categoryId: UUID; categoryName: string; amount: Decimal }[];
    byMethod: { method: PaymentMethod; amount: Decimal }[];
  };
  
  balance: Decimal;
  realizedBalance: Decimal;
  
  comparison?: {
    previousPeriod: {
      income: Decimal;
      expense: Decimal;
      balance: Decimal;
    };
    variation: {
      income: Decimal;
      expense: Decimal;
      balance: Decimal;
    };
  };
}

/** Receivables/Payables summary */
export interface AccountsSummary {
  receivables: {
    total: Decimal;
    overdue: Decimal;
    dueToday: Decimal;
    dueThisWeek: Decimal;
    dueThisMonth: Decimal;
    items: TransactionListItem[];
  };
  
  payables: {
    total: Decimal;
    overdue: Decimal;
    dueToday: Decimal;
    dueThisWeek: Decimal;
    dueThisMonth: Decimal;
    items: TransactionListItem[];
  };
}
