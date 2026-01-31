/**
 * GLAMO - Product & Stock Types
 * Complete product and inventory type definitions per RF-EST-001 to RF-EST-006
 * 
 * @version 1.0.0
 * @description Supports multi-unit inventory, lots, expiration tracking
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  EntityStatus,
  AuditFields,
  ImageFile,
  Metadata,
} from './base';

// ============================================================================
// PRODUCT TYPES & CATEGORIES
// ============================================================================

/** Product type */
export type ProductType = 
  | 'sellable'       // Produto para venda
  | 'consumable'     // Insumo/consumível
  | 'both';          // Ambos

/** Stock tracking method */
export type StockTrackingMethod = 
  | 'none'           // Não controla estoque
  | 'quantity'       // Controla por quantidade
  | 'lot'            // Controla por lote
  | 'serial';        // Controla por número de série

/** Inventory valuation method */
export type InventoryValuation = 'fifo' | 'lifo' | 'average';

// ============================================================================
// PRODUCT CATEGORY
// ============================================================================

/** Product category */
export interface ProductCategory {
  id: UUID;
  tenantId: UUID;
  parentId?: UUID;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color: string;
  imageUrl?: string;
  order: number;
  level: number;
  path: string;
  isActive: boolean;
  productCount: number;
  children?: ProductCategory[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// PRODUCT PRICING
// ============================================================================

/** Price tier for quantity discounts */
export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: Decimal;
  discount?: Decimal;
}

/** Product pricing configuration */
export interface ProductPricing {
  costPrice: Decimal;
  sellingPrice: Decimal;
  promotionalPrice?: Decimal;
  promotionalStart?: ISODateTime;
  promotionalEnd?: ISODateTime;
  
  /** Markup percentage */
  markupPercentage: Decimal;
  /** Profit margin percentage */
  profitMargin: Decimal;
  
  /** Quantity-based pricing */
  priceTiers: PriceTier[];
  
  /** Commission for sales */
  commissionPercentage: Decimal;
  
  /** Tax configuration */
  taxRate?: Decimal;
  ncm?: string; // Brazilian tax code
  
  /** Allow discount */
  allowDiscount: boolean;
  maxDiscountPercent?: Decimal;
}

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

/** Variant attribute */
export interface VariantAttribute {
  name: string; // e.g., "Cor", "Tamanho"
  value: string; // e.g., "Vermelho", "100ml"
}

/** Product variant */
export interface ProductVariant {
  id: UUID;
  productId: UUID;
  sku: string;
  barcode?: string;
  name: string; // e.g., "Shampoo 500ml - Cabelos Oleosos"
  attributes: VariantAttribute[];
  pricing: ProductPricing;
  weight?: Decimal;
  dimensions?: {
    length: Decimal;
    width: Decimal;
    height: Decimal;
    unit: 'cm' | 'in';
  };
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// STOCK CONFIGURATION
// ============================================================================

/** Stock level configuration */
export interface StockLevels {
  /** Quantity below which to trigger low stock alert */
  minimumStock: Decimal;
  /** Ideal quantity to maintain */
  idealStock: Decimal;
  /** Maximum allowed quantity */
  maximumStock: Decimal;
  /** When to reorder */
  reorderPoint: Decimal;
  /** How much to reorder */
  reorderQuantity: Decimal;
}

/** Multi-unit stock */
export interface UnitStock {
  unitId: UUID;
  unitName: string;
  quantity: Decimal;
  reservedQuantity: Decimal;
  availableQuantity: Decimal;
  levels: StockLevels;
  lastCountAt?: ISODateTime;
  lastMovementAt?: ISODateTime;
}

// ============================================================================
// STOCK LOT (RF-EST-003)
// ============================================================================

/** Stock lot status */
export type LotStatus = 
  | 'available'
  | 'reserved'
  | 'expired'
  | 'quarantine'
  | 'sold_out';

/** Stock lot */
export interface StockLot {
  id: UUID;
  productId: UUID;
  variantId?: UUID;
  unitId: UUID;
  
  lotNumber: string;
  serialNumber?: string;
  
  quantity: Decimal;
  reservedQuantity: Decimal;
  availableQuantity: Decimal;
  
  manufactureDate?: ISODate;
  expirationDate?: ISODate;
  receivedDate: ISODate;
  
  costPrice: Decimal;
  supplierId?: UUID;
  supplierName?: string;
  purchaseOrderId?: UUID;
  invoiceNumber?: string;
  
  location?: string; // Shelf/bin location
  status: LotStatus;
  
  metadata?: Metadata;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// STOCK MOVEMENT (RF-EST-002)
// ============================================================================

/** Stock movement type */
export type StockMovementType = 
  | 'purchase'        // Compra
  | 'sale'            // Venda
  | 'consumption'     // Consumo em serviço
  | 'transfer'        // Transferência entre unidades
  | 'adjustment_in'   // Ajuste positivo
  | 'adjustment_out'  // Ajuste negativo
  | 'return'          // Devolução
  | 'loss'            // Perda
  | 'donation'        // Doação
  | 'inventory_count';// Contagem de inventário

/** Stock movement status */
export type MovementStatus = 'pending' | 'confirmed' | 'cancelled';

/** Stock movement */
export interface StockMovement {
  id: UUID;
  tenantId: UUID;
  productId: UUID;
  variantId?: UUID;
  lotId?: UUID;
  
  type: StockMovementType;
  status: MovementStatus;
  
  quantity: Decimal;
  unitCost: Decimal;
  totalCost: Decimal;
  
  // Location
  fromUnitId?: UUID;
  fromUnitName?: string;
  toUnitId?: UUID;
  toUnitName?: string;
  
  // References
  referenceType?: 'appointment' | 'sale' | 'purchase_order' | 'transfer' | 'manual';
  referenceId?: UUID;
  
  reason?: string;
  notes?: string;
  
  performedBy: UUID;
  performedByName: string;
  performedAt: ISODateTime;
  
  confirmedBy?: UUID;
  confirmedAt?: ISODateTime;
  
  cancelledBy?: UUID;
  cancelledAt?: ISODateTime;
  cancelledReason?: string;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// STOCK ALERT
// ============================================================================

/** Alert type */
export type StockAlertType = 
  | 'low_stock'
  | 'out_of_stock'
  | 'over_stock'
  | 'expiring_soon'
  | 'expired'
  | 'reorder_point';

/** Stock alert */
export interface StockAlert {
  id: UUID;
  tenantId: UUID;
  productId: UUID;
  variantId?: UUID;
  unitId: UUID;
  lotId?: UUID;
  
  type: StockAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  
  currentQuantity: Decimal;
  threshold: Decimal;
  expirationDate?: ISODate;
  
  isRead: boolean;
  readBy?: UUID;
  readAt?: ISODateTime;
  
  isResolved: boolean;
  resolvedBy?: UUID;
  resolvedAt?: ISODateTime;
  resolutionNotes?: string;
  
  createdAt: ISODateTime;
}

// ============================================================================
// INVENTORY COUNT (RF-EST-004)
// ============================================================================

/** Inventory count status */
export type InventoryCountStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';

/** Inventory count item */
export interface InventoryCountItem {
  id: UUID;
  countId: UUID;
  productId: UUID;
  variantId?: UUID;
  lotId?: UUID;
  
  expectedQuantity: Decimal;
  countedQuantity?: Decimal;
  difference?: Decimal;
  differenceValue?: Decimal;
  
  countedBy?: UUID;
  countedByName?: string;
  countedAt?: ISODateTime;
  notes?: string;
}

/** Inventory count */
export interface InventoryCount {
  id: UUID;
  tenantId: UUID;
  unitId: UUID;
  unitName: string;
  
  code: string;
  name: string;
  description?: string;
  
  status: InventoryCountStatus;
  countType: 'full' | 'partial' | 'spot_check';
  
  categoryIds?: UUID[]; // If partial, which categories
  
  items: InventoryCountItem[];
  totalItems: number;
  countedItems: number;
  discrepancyCount: number;
  totalDiscrepancyValue: Decimal;
  
  startedAt?: ISODateTime;
  startedBy?: UUID;
  
  completedAt?: ISODateTime;
  completedBy?: UUID;
  
  approvedAt?: ISODateTime;
  approvedBy?: UUID;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// PRODUCT IMAGES
// ============================================================================

/** Product image */
export interface ProductImage extends ImageFile {
  productId: UUID;
  variantId?: UUID;
  isPrimary: boolean;
  order: number;
  caption?: string;
}

// ============================================================================
// MAIN PRODUCT INTERFACE (RF-EST-001)
// ============================================================================

/** Complete product entity */
export interface Product extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  // Basic info
  code: string; // Unique per tenant (e.g., PRD-00001)
  sku: string;
  barcode?: string;
  name: string;
  shortName?: string;
  description?: string;
  
  // Type & category
  type: ProductType;
  categoryId: UUID;
  category: ProductCategory;
  brandId?: UUID;
  brandName?: string;
  
  // Stock configuration
  stockTracking: StockTrackingMethod;
  inventoryValuation: InventoryValuation;
  trackExpiration: boolean;
  expirationAlertDays: number; // Days before expiration to alert
  
  // Pricing
  pricing: ProductPricing;
  
  // Variants
  hasVariants: boolean;
  variantAttributes?: string[]; // e.g., ["Tamanho", "Cor"]
  variants: ProductVariant[];
  
  // Stock levels (aggregated across units for products without variants)
  totalStock: Decimal;
  reservedStock: Decimal;
  availableStock: Decimal;
  
  // Per-unit stock
  unitStocks: UnitStock[];
  
  // Default stock levels
  defaultStockLevels: StockLevels;
  
  // Images
  images: ProductImage[];
  primaryImageUrl?: string;
  
  // Physical attributes
  weight?: Decimal;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb';
  unit: string; // Unit of measure (un, ml, g, etc.)
  
  // Supplier
  primarySupplierId?: UUID;
  primarySupplierName?: string;
  supplierCode?: string; // Supplier's product code
  supplierIds: UUID[];
  
  // Consumable settings
  consumableFor: UUID[]; // Service IDs this product is used in
  defaultConsumptionQuantity?: Decimal;
  
  // Sale settings
  isAvailableForSale: boolean;
  isAvailableOnline: boolean;
  requiresPrescription: boolean;
  ageRestricted: boolean;
  minAge?: number;
  
  // Tags
  tags: string[];
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Metrics
  metrics: {
    totalSold: number;
    totalConsumed: number;
    totalRevenue: Decimal;
    averageMonthlyConsumption: Decimal;
    lastSaleAt?: ISODateTime;
    lastPurchaseAt?: ISODateTime;
  };
  
  // Status
  status: EntityStatus;
  
  // Soft delete
  deletedAt?: ISODateTime;
}

// ============================================================================
// PRODUCT LIST ITEM
// ============================================================================

/** Simplified product for list views */
export interface ProductListItem {
  id: UUID;
  code: string;
  sku: string;
  barcode?: string;
  name: string;
  type: ProductType;
  categoryId: UUID;
  categoryName: string;
  brandName?: string;
  costPrice: Decimal;
  sellingPrice: Decimal;
  promotionalPrice?: Decimal;
  availableStock: Decimal;
  minimumStock: Decimal;
  unit: string;
  primaryImageUrl?: string;
  hasLowStock: boolean;
  hasExpiringLots: boolean;
  status: EntityStatus;
}

// ============================================================================
// PRODUCT FILTERS
// ============================================================================

/** Product filter options */
export interface ProductFilters {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  type?: ProductType | ProductType[];
  categoryId?: UUID | UUID[];
  brandId?: UUID | UUID[];
  supplierId?: UUID;
  unitId?: UUID;
  
  // Stock filters
  hasLowStock?: boolean;
  isOutOfStock?: boolean;
  hasExpiringLots?: boolean;
  expiringInDays?: number;
  
  // Price filters
  priceMin?: Decimal;
  priceMax?: Decimal;
  hasPromotion?: boolean;
  
  // Other
  isAvailableForSale?: boolean;
  isAvailableOnline?: boolean;
  tags?: string[];
}

// ============================================================================
// PRODUCT FORM DATA
// ============================================================================

/** Data for creating a product */
export interface CreateProductData {
  name: string;
  shortName?: string;
  description?: string;
  sku: string;
  barcode?: string;
  
  type: ProductType;
  categoryId: UUID;
  brandId?: UUID;
  
  stockTracking?: StockTrackingMethod;
  inventoryValuation?: InventoryValuation;
  trackExpiration?: boolean;
  expirationAlertDays?: number;
  
  // Pricing
  costPrice: Decimal;
  sellingPrice: Decimal;
  promotionalPrice?: Decimal;
  promotionalStart?: ISODateTime;
  promotionalEnd?: ISODateTime;
  commissionPercentage?: Decimal;
  allowDiscount?: boolean;
  maxDiscountPercent?: Decimal;
  
  // Stock levels
  minimumStock?: Decimal;
  idealStock?: Decimal;
  maximumStock?: Decimal;
  reorderPoint?: Decimal;
  reorderQuantity?: Decimal;
  
  // Physical
  weight?: Decimal;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb';
  unit?: string;
  
  // Supplier
  primarySupplierId?: UUID;
  supplierCode?: string;
  
  // Consumable
  consumableFor?: UUID[];
  defaultConsumptionQuantity?: Decimal;
  
  // Sale
  isAvailableForSale?: boolean;
  isAvailableOnline?: boolean;
  requiresPrescription?: boolean;
  ageRestricted?: boolean;
  minAge?: number;
  
  // Variants
  hasVariants?: boolean;
  variantAttributes?: string[];
  variants?: Omit<CreateProductVariantData, 'productId'>[];
  
  // Images
  images?: { url: string; isPrimary: boolean; order: number; caption?: string }[];
  
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/** Data for creating a product variant */
export interface CreateProductVariantData {
  productId: UUID;
  sku: string;
  barcode?: string;
  name: string;
  attributes: VariantAttribute[];
  costPrice: Decimal;
  sellingPrice: Decimal;
  weight?: Decimal;
}

/** Data for updating a product */
export interface UpdateProductData extends Partial<CreateProductData> {
  status?: EntityStatus;
}

// ============================================================================
// STOCK MOVEMENT FORM DATA
// ============================================================================

/** Data for creating a stock movement */
export interface CreateStockMovementData {
  productId: UUID;
  variantId?: UUID;
  lotId?: UUID;
  type: StockMovementType;
  quantity: Decimal;
  unitCost?: Decimal;
  fromUnitId?: UUID;
  toUnitId?: UUID;
  referenceType?: 'appointment' | 'sale' | 'purchase_order' | 'transfer' | 'manual';
  referenceId?: UUID;
  reason?: string;
  notes?: string;
}

/** Data for stock lot creation */
export interface CreateStockLotData {
  productId: UUID;
  variantId?: UUID;
  unitId: UUID;
  lotNumber: string;
  serialNumber?: string;
  quantity: Decimal;
  manufactureDate?: ISODate;
  expirationDate?: ISODate;
  receivedDate: ISODate;
  costPrice: Decimal;
  supplierId?: UUID;
  purchaseOrderId?: UUID;
  invoiceNumber?: string;
  location?: string;
}
