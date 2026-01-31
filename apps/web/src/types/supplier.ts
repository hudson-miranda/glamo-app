/**
 * GLAMO - Supplier Types
 * Complete supplier type definitions for inventory management
 * 
 * @version 1.0.0
 * @description Supplier management with purchasing and evaluation
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  EntityStatus,
  Address,
  AuditFields,
  Metadata,
} from './base';

// ============================================================================
// SUPPLIER TYPES & CATEGORIES
// ============================================================================

/** Supplier type */
export type SupplierType = 
  | 'manufacturer'     // Fabricante
  | 'distributor'      // Distribuidor
  | 'wholesaler'       // Atacadista
  | 'retailer'         // Varejista
  | 'importer'         // Importador
  | 'service_provider' // Prestador de serviço
  | 'other';

/** Payment terms */
export type PaymentTerms = 
  | 'cash'             // À vista
  | 'net_7'            // 7 dias
  | 'net_15'           // 15 dias
  | 'net_30'           // 30 dias
  | 'net_45'           // 45 dias
  | 'net_60'           // 60 dias
  | 'net_90'           // 90 dias
  | 'installments'     // Parcelado
  | 'custom';          // Personalizado

// ============================================================================
// SUPPLIER CONTACT
// ============================================================================

/** Supplier contact person */
export interface SupplierContact {
  id: UUID;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  notes?: string;
}

// ============================================================================
// SUPPLIER BANK INFO
// ============================================================================

/** Bank account info */
export interface SupplierBankAccount {
  id: UUID;
  bankCode: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  holderName: string;
  holderDocument: string;
  isPrimary: boolean;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
}

// ============================================================================
// SUPPLIER EVALUATION
// ============================================================================

/** Supplier rating */
export interface SupplierRating {
  id: UUID;
  supplierId: UUID;
  purchaseOrderId?: UUID;
  
  // Ratings 1-5
  qualityRating: number;
  priceRating: number;
  deliveryRating: number;
  serviceRating: number;
  overallRating: number;
  
  comments?: string;
  ratedBy: UUID;
  ratedByName: string;
  ratedAt: ISODateTime;
}

/** Supplier metrics */
export interface SupplierMetrics {
  totalPurchases: number;
  totalSpent: Decimal;
  averageOrderValue: Decimal;
  averageDeliveryDays: number;
  onTimeDeliveryRate: Decimal;
  returnRate: Decimal;
  averageRating: Decimal;
  ratingCount: number;
  activeProductCount: number;
  lastPurchaseAt?: ISODateTime;
  lastDeliveryAt?: ISODateTime;
}

// ============================================================================
// PURCHASE CONFIGURATION
// ============================================================================

/** Minimum order configuration */
export interface MinimumOrderConfig {
  type: 'quantity' | 'value' | 'both';
  minimumQuantity?: Decimal;
  minimumValue?: Decimal;
  freeShippingThreshold?: Decimal;
}

/** Lead time configuration */
export interface LeadTimeConfig {
  standardDays: number;
  expressDays?: number;
  expressAdditionalCost?: Decimal;
}

// ============================================================================
// SUPPLIER PRODUCTS
// ============================================================================

/** Product from supplier */
export interface SupplierProduct {
  id: UUID;
  supplierId: UUID;
  productId: UUID;
  productName: string;
  productSku: string;
  
  supplierCode: string; // Código do fornecedor
  supplierName?: string; // Nome no fornecedor
  
  unitPrice: Decimal;
  minimumQuantity: Decimal;
  leadTimeDays: number;
  
  lastPurchasePrice?: Decimal;
  lastPurchaseDate?: ISODate;
  
  isActive: boolean;
  isPrimary: boolean; // Is this the primary supplier for this product
  
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// PURCHASE ORDER
// ============================================================================

/** Purchase order status */
export type PurchaseOrderStatus = 
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partial'
  | 'received'
  | 'cancelled';

/** Purchase order item */
export interface PurchaseOrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  variantId?: UUID;
  
  productName: string;
  productSku: string;
  supplierCode?: string;
  
  quantity: Decimal;
  receivedQuantity: Decimal;
  unitPrice: Decimal;
  discount?: Decimal;
  taxAmount?: Decimal;
  totalPrice: Decimal;
  
  notes?: string;
}

/** Purchase order */
export interface PurchaseOrder {
  id: UUID;
  tenantId: UUID;
  
  orderNumber: string;
  supplierId: UUID;
  supplierName: string;
  unitId: UUID;
  unitName: string;
  
  status: PurchaseOrderStatus;
  
  items: PurchaseOrderItem[];
  
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  shippingCost: Decimal;
  total: Decimal;
  
  paymentTerms: PaymentTerms;
  paymentTermsCustom?: string;
  dueDate?: ISODate;
  
  expectedDeliveryDate?: ISODate;
  actualDeliveryDate?: ISODate;
  
  shippingAddress?: Address;
  billingAddress?: Address;
  
  notes?: string;
  internalNotes?: string;
  
  sentAt?: ISODateTime;
  sentBy?: UUID;
  confirmedAt?: ISODateTime;
  confirmedBy?: UUID;
  receivedAt?: ISODateTime;
  receivedBy?: UUID;
  cancelledAt?: ISODateTime;
  cancelledBy?: UUID;
  cancelledReason?: string;
  
  attachments?: string[];
  
  createdBy: UUID;
  createdByName: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// MAIN SUPPLIER INTERFACE
// ============================================================================

/** Complete supplier entity */
export interface Supplier extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  // Basic info
  code: string; // Unique per tenant (e.g., SUP-00001)
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  stateRegistration?: string;
  
  // Type
  type: SupplierType;
  
  // Contact
  email?: string;
  phone?: string;
  website?: string;
  contacts: SupplierContact[];
  
  // Address
  address?: Address;
  
  // Bank
  bankAccounts: SupplierBankAccount[];
  
  // Purchasing
  paymentTerms: PaymentTerms;
  paymentTermsCustom?: string;
  minimumOrder: MinimumOrderConfig;
  leadTime: LeadTimeConfig;
  shippingPolicy?: string;
  returnPolicy?: string;
  
  // Products
  products: SupplierProduct[];
  productCount: number;
  
  // Categories supplied
  categoryIds: UUID[];
  
  // Metrics
  metrics: SupplierMetrics;
  
  // Tags
  tags: string[];
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Status
  status: EntityStatus;
  blockedReason?: string;
  
  // Soft delete
  deletedAt?: ISODateTime;
}

// ============================================================================
// SUPPLIER LIST ITEM
// ============================================================================

/** Simplified supplier for list views */
export interface SupplierListItem {
  id: UUID;
  code: string;
  companyName: string;
  tradeName?: string;
  type: SupplierType;
  email?: string;
  phone?: string;
  primaryContactName?: string;
  productCount: number;
  totalSpent: Decimal;
  averageRating: Decimal;
  onTimeDeliveryRate: Decimal;
  lastPurchaseAt?: ISODateTime;
  status: EntityStatus;
}

// ============================================================================
// SUPPLIER FILTERS
// ============================================================================

/** Supplier filter options */
export interface SupplierFilters {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  type?: SupplierType | SupplierType[];
  categoryId?: UUID;
  productId?: UUID;
  hasMinimumOrder?: boolean;
  tags?: string[];
  ratingMin?: number;
  ratingMax?: number;
}

// ============================================================================
// SUPPLIER FORM DATA
// ============================================================================

/** Data for creating a supplier */
export interface CreateSupplierData {
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  stateRegistration?: string;
  type: SupplierType;
  
  email?: string;
  phone?: string;
  website?: string;
  
  address?: Omit<Address, 'id'>;
  
  contacts?: Omit<SupplierContact, 'id'>[];
  bankAccounts?: Omit<SupplierBankAccount, 'id'>[];
  
  paymentTerms?: PaymentTerms;
  paymentTermsCustom?: string;
  
  minimumOrderType?: 'quantity' | 'value' | 'both';
  minimumOrderQuantity?: Decimal;
  minimumOrderValue?: Decimal;
  freeShippingThreshold?: Decimal;
  
  leadTimeStandardDays?: number;
  leadTimeExpressDays?: number;
  
  shippingPolicy?: string;
  returnPolicy?: string;
  
  categoryIds?: UUID[];
  tags?: string[];
  notes?: string;
  internalNotes?: string;
  customFields?: Record<string, unknown>;
}

/** Data for updating a supplier */
export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  status?: EntityStatus;
  blockedReason?: string;
}

// ============================================================================
// PURCHASE ORDER FORM DATA
// ============================================================================

/** Purchase order item data */
export interface CreatePurchaseOrderItemData {
  productId: UUID;
  variantId?: UUID;
  quantity: Decimal;
  unitPrice: Decimal;
  discount?: Decimal;
  notes?: string;
}

/** Data for creating a purchase order */
export interface CreatePurchaseOrderData {
  supplierId: UUID;
  unitId: UUID;
  items: CreatePurchaseOrderItemData[];
  paymentTerms?: PaymentTerms;
  paymentTermsCustom?: string;
  dueDate?: ISODate;
  expectedDeliveryDate?: ISODate;
  shippingCost?: Decimal;
  shippingAddress?: Omit<Address, 'id'>;
  billingAddress?: Omit<Address, 'id'>;
  notes?: string;
  internalNotes?: string;
}

/** Data for receiving a purchase order */
export interface ReceivePurchaseOrderData {
  orderId: UUID;
  receivedItems: {
    itemId: UUID;
    receivedQuantity: Decimal;
    lotNumber?: string;
    expirationDate?: ISODate;
    location?: string;
    notes?: string;
  }[];
  invoiceNumber?: string;
  receivedAt?: ISODateTime;
  notes?: string;
}
