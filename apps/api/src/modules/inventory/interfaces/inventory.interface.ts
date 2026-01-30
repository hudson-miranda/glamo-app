/**
 * Inventory Module Interfaces
 * Handles products, stock, movements, alerts, and suppliers
 */

// ========================
// ENUMS
// ========================

export enum ProductType {
  RETAIL = 'RETAIL',          // Venda direta
  PROFESSIONAL = 'PROFESSIONAL', // Uso profissional
  BOTH = 'BOTH',              // Ambos
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum MovementType {
  IN = 'IN',                    // Entrada
  OUT = 'OUT',                  // Saída
  ADJUSTMENT = 'ADJUSTMENT',     // Ajuste
  TRANSFER = 'TRANSFER',         // Transferência
  RETURN = 'RETURN',             // Devolução
  LOSS = 'LOSS',                 // Perda/quebra
  EXPIRED = 'EXPIRED',           // Vencido
}

export enum MovementReason {
  PURCHASE = 'PURCHASE',         // Compra
  SALE = 'SALE',                 // Venda
  SERVICE_USE = 'SERVICE_USE',   // Uso em serviço
  INVENTORY_COUNT = 'INVENTORY_COUNT', // Contagem
  CORRECTION = 'CORRECTION',     // Correção
  DAMAGE = 'DAMAGE',             // Dano
  THEFT = 'THEFT',               // Furto
  SUPPLIER_RETURN = 'SUPPLIER_RETURN', // Devolução fornecedor
  CUSTOMER_RETURN = 'CUSTOMER_RETURN', // Devolução cliente
  OTHER = 'OTHER',
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
  REORDER_POINT = 'REORDER_POINT',
}

export enum AlertStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum UnitOfMeasure {
  UNIT = 'UNIT',
  GRAM = 'GRAM',
  KILOGRAM = 'KILOGRAM',
  MILLILITER = 'MILLILITER',
  LITER = 'LITER',
  BOX = 'BOX',
  PACK = 'PACK',
}

// ========================
// PRODUCT INTERFACES
// ========================

export interface ProductDimensions {
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
}

export interface ProductPricing {
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  markup?: number;
  minPrice?: number;
}

export interface ProductStock {
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  receivedAt: Date;
  supplierId?: string;
}

export interface ProductEntity {
  id: string;
  tenantId: string;
  
  // Identificação
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  
  // Categorização
  type: ProductType;
  status: ProductStatus;
  categoryId?: string;
  brandId?: string;
  
  // Preços
  pricing: ProductPricing;
  
  // Estoque
  stock: ProductStock;
  
  // Lotes (para produtos com validade)
  batches?: ProductBatch[];
  
  // Unidade
  unit: UnitOfMeasure;
  unitsPerPackage?: number;
  
  // Dimensões
  dimensions?: ProductDimensions;
  
  // Mídia
  images?: string[];
  
  // Relacionamentos
  supplierId?: string;
  
  // Flags
  trackInventory: boolean;
  trackBatches: boolean;
  allowNegativeStock: boolean;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Metadados
  metadata?: Record<string, any>;
}

// ========================
// CATEGORY INTERFACES
// ========================

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
}

// ========================
// BRAND INTERFACES
// ========================

export interface ProductBrand {
  id: string;
  tenantId: string;
  name: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
}

// ========================
// SUPPLIER INTERFACES
// ========================

export interface SupplierContact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface SupplierPaymentTerms {
  paymentMethod?: string;
  paymentDays?: number;
  creditLimit?: number;
  discountPercentage?: number;
}

export interface SupplierEntity {
  id: string;
  tenantId: string;
  
  // Identificação
  name: string;
  tradeName?: string;
  document?: string;
  
  // Contato
  email?: string;
  phone?: string;
  website?: string;
  contacts?: SupplierContact[];
  
  // Endereço
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Condições
  paymentTerms?: SupplierPaymentTerms;
  leadTimeDays?: number;
  minOrderValue?: number;
  
  // Status
  isActive: boolean;
  rating?: number;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// STOCK MOVEMENT INTERFACES
// ========================

export interface StockMovement {
  id: string;
  tenantId: string;
  
  productId: string;
  type: MovementType;
  reason: MovementReason;
  
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  
  unitCost?: number;
  totalCost?: number;
  
  // Referências
  batchId?: string;
  purchaseOrderId?: string;
  saleId?: string;
  appointmentId?: string;
  userId: string;
  
  notes?: string;
  
  createdAt: Date;
}

// ========================
// ALERT INTERFACES
// ========================

export interface StockAlert {
  id: string;
  tenantId: string;
  
  type: AlertType;
  status: AlertStatus;
  
  productId: string;
  productName: string;
  
  message: string;
  data?: {
    currentQuantity?: number;
    minStock?: number;
    expiryDate?: Date;
  };
  
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  
  createdAt: Date;
}

// ========================
// PURCHASE ORDER INTERFACES
// ========================

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  
  quantity: number;
  receivedQuantity: number;
  
  unitCost: number;
  totalCost: number;
  
  notes?: string;
}

export interface PurchaseOrderEntity {
  id: string;
  tenantId: string;
  
  number: string;
  status: PurchaseOrderStatus;
  
  supplierId: string;
  supplierName: string;
  
  items: PurchaseOrderItem[];
  
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  
  expectedDeliveryDate?: Date;
  receivedAt?: Date;
  
  notes?: string;
  
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// INVENTORY COUNT INTERFACES
// ========================

export interface InventoryCountItem {
  productId: string;
  productName: string;
  sku: string;
  
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  
  notes?: string;
}

export interface InventoryCount {
  id: string;
  tenantId: string;
  
  date: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  items: InventoryCountItem[];
  
  totalDifference: number;
  differenceCost: number;
  
  startedBy: string;
  completedBy?: string;
  completedAt?: Date;
  
  notes?: string;
  
  createdAt: Date;
}

// ========================
// REPORTING INTERFACES
// ========================

export interface InventoryReport {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  
  totalValue: number;
  costValue: number;
  potentialRevenue: number;
  
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    soldQuantity: number;
    revenue: number;
  }>;
  
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    lastSoldAt?: Date;
    quantity: number;
  }>;
  
  expiringProducts: Array<{
    productId: string;
    productName: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
  }>;
}
