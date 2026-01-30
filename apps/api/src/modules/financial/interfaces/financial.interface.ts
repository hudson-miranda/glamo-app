/**
 * Financial Module Interfaces
 * Handles payments, invoices, transactions, cash flow, and reconciliation
 */

// ========================
// ENUMS
// ========================

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  VOUCHER = 'VOUCHER',
  CREDIT = 'CREDIT',
  INSTALLMENT = 'INSTALLMENT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
  EXPIRED = 'EXPIRED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  FEE = 'FEE',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  COMMISSION = 'COMMISSION',
  TIP = 'TIP',
}

export enum TransactionCategory {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
  PACKAGE = 'PACKAGE',
  GIFT_CARD = 'GIFT_CARD',
  MEMBERSHIP = 'MEMBERSHIP',
  COMMISSION = 'COMMISSION',
  EXPENSE = 'EXPENSE',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum CashFlowType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  DISCREPANCY = 'DISCREPANCY',
  RESOLVED = 'RESOLVED',
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  ELO = 'ELO',
  HIPERCARD = 'HIPERCARD',
  OTHER = 'OTHER',
}

// ========================
// PAYMENT INTERFACES
// ========================

export interface CardDetails {
  brand: CardBrand;
  lastFour: string;
  holderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDebit?: boolean;
}

export interface PixDetails {
  txId: string;
  qrCode: string;
  qrCodeBase64?: string;
  copyPaste: string;
  expiresAt: Date;
}

export interface InstallmentDetails {
  numberOfInstallments: number;
  installmentAmount: number;
  totalAmount: number;
  interestRate?: number;
  hasInterest: boolean;
}

export interface PaymentGatewayData {
  provider: string;
  transactionId: string;
  authorizationCode?: string;
  nsu?: string;
  acquirer?: string;
  rawResponse?: Record<string, any>;
}

export interface PaymentEntity {
  id: string;
  tenantId: string;
  
  // Valores
  amount: number;
  tip?: number;
  discount?: number;
  fees?: number;
  netAmount: number;
  
  // Método
  method: PaymentMethod;
  status: PaymentStatus;
  
  // Detalhes
  cardDetails?: CardDetails;
  pixDetails?: PixDetails;
  installmentDetails?: InstallmentDetails;
  gatewayData?: PaymentGatewayData;
  
  // Relacionamentos
  appointmentId?: string;
  invoiceId?: string;
  customerId?: string;
  orderId?: string;
  
  // Datas
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Metadados
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// ========================
// TRANSACTION INTERFACES
// ========================

export interface TransactionEntity {
  id: string;
  tenantId: string;
  
  type: TransactionType;
  category: TransactionCategory;
  
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  
  description: string;
  reference?: string;
  
  // Relacionamentos
  paymentId?: string;
  appointmentId?: string;
  customerId?: string;
  professionalId?: string;
  orderId?: string;
  
  // Datas
  transactionDate: Date;
  createdAt: Date;
  
  // Metadados
  metadata?: Record<string, any>;
}

// ========================
// INVOICE INTERFACES
// ========================

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  serviceId?: string;
  productId?: string;
}

export interface InvoiceEntity {
  id: string;
  tenantId: string;
  
  number: string;
  status: InvoiceStatus;
  
  // Cliente
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerDocument?: string;
  
  // Valores
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Itens
  items: InvoiceItem[];
  
  // Datas
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  
  // Pagamentos
  payments?: PaymentEntity[];
  
  // Notas
  notes?: string;
  terms?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// CASH FLOW INTERFACES
// ========================

export interface CashFlowEntry {
  id: string;
  tenantId: string;
  
  type: CashFlowType;
  category: string;
  
  amount: number;
  description: string;
  
  // Relacionamentos
  paymentId?: string;
  transactionId?: string;
  
  // Datas
  entryDate: Date;
  createdAt: Date;
  
  // Projeção
  isProjected?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export interface CashFlowSummary {
  period: string;
  startDate: Date;
  endDate: Date;
  
  openingBalance: number;
  closingBalance: number;
  
  totalInflows: number;
  totalOutflows: number;
  netFlow: number;
  
  inflowsByCategory: Record<string, number>;
  outflowsByCategory: Record<string, number>;
  
  dailyFlow?: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
}

// ========================
// RECONCILIATION INTERFACES
// ========================

export interface ReconciliationItem {
  id: string;
  tenantId: string;
  
  status: ReconciliationStatus;
  
  // Dados internos
  internalTransactionId: string;
  internalAmount: number;
  internalDate: Date;
  
  // Dados externos (banco/gateway)
  externalReference?: string;
  externalAmount?: number;
  externalDate?: Date;
  
  // Discrepância
  discrepancyAmount?: number;
  discrepancyNotes?: string;
  
  // Resolução
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  createdAt: Date;
}

export interface ReconciliationSession {
  id: string;
  tenantId: string;
  
  period: {
    start: Date;
    end: Date;
  };
  
  // Totais
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  discrepancyCount: number;
  
  // Valores
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  
  // Status
  status: ReconciliationStatus;
  completedAt?: Date;
  completedBy?: string;
  
  items: ReconciliationItem[];
  
  createdAt: Date;
}

// ========================
// REPORTING INTERFACES
// ========================

export interface RevenueReport {
  period: string;
  startDate: Date;
  endDate: Date;
  
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  
  byPaymentMethod: Record<PaymentMethod, number>;
  byCategory: Record<TransactionCategory, number>;
  byProfessional: Array<{
    professionalId: string;
    name: string;
    revenue: number;
    percentage: number;
  }>;
  byService: Array<{
    serviceId: string;
    name: string;
    revenue: number;
    count: number;
  }>;
  
  comparison?: {
    previousPeriod: number;
    percentageChange: number;
  };
}

export interface DailyClosing {
  id: string;
  tenantId: string;
  
  date: Date;
  
  // Vendas
  totalSales: number;
  salesCount: number;
  
  // Por método
  cashTotal: number;
  cardTotal: number;
  pixTotal: number;
  otherTotal: number;
  
  // Descontos e gorjetas
  totalDiscounts: number;
  totalTips: number;
  
  // Comissões
  totalCommissions: number;
  
  // Resumo
  netAmount: number;
  
  closedAt?: Date;
  closedBy?: string;
  
  notes?: string;
}
