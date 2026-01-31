/**
 * GLAMO - Service Types
 * Complete service type definitions per documentation
 * 
 * @version 1.0.0
 * @description Supports all business segments with categories, commissions, consumables
 */

import {
  UUID,
  Decimal,
  EntityStatus,
  AuditFields,
  ImageFile,
  BusinessSegment,
  Metadata,
} from './base';
import { SegmentServiceFields } from './segments';

// ============================================================================
// SERVICE DURATION & SCHEDULING
// ============================================================================

/** Duration unit */
export type DurationUnit = 'minutes' | 'hours';

/** Service duration configuration */
export interface ServiceDuration {
  value: number;
  unit: DurationUnit;
  /** Total minutes for easy comparison */
  totalMinutes: number;
  /** Preparation time before service */
  preparationMinutes: number;
  /** Finalization time after service */
  finalizationMinutes: number;
  /** Buffer between appointments */
  bufferMinutes: number;
  /** Allow variable duration */
  allowVariable: boolean;
  minMinutes?: number;
  maxMinutes?: number;
}

// ============================================================================
// SERVICE PRICING
// ============================================================================

/** Pricing type */
export type PricingType = 'fixed' | 'starting_from' | 'variable' | 'on_quote';

/** Price variation condition */
export interface PriceVariation {
  id: UUID;
  name: string;
  description?: string;
  condition: string; // e.g., "cabelo longo", "animal grande"
  priceAdjustment: Decimal; // Can be negative
  percentageAdjustment?: Decimal;
  isActive: boolean;
}

/** Service pricing configuration */
export interface ServicePricing {
  type: PricingType;
  basePrice: Decimal;
  promotionalPrice?: Decimal;
  promotionalValidUntil?: string;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  variations: PriceVariation[];
  /** Cost for internal margin calculation */
  estimatedCost?: Decimal;
  /** Allow professional to adjust price */
  allowPriceAdjustment: boolean;
  maxDiscountPercent?: Decimal;
}

// ============================================================================
// SERVICE COMMISSION
// ============================================================================

/** Commission type */
export type CommissionType = 'percentage' | 'fixed' | 'tiered' | 'custom';

/** Commission tier for tiered commission */
export interface CommissionTier {
  minAmount: Decimal;
  maxAmount?: Decimal;
  percentage: Decimal;
  fixedBonus?: Decimal;
}

/** Service commission configuration */
export interface ServiceCommission {
  type: CommissionType;
  defaultPercentage: Decimal;
  fixedAmount?: Decimal;
  tiers?: CommissionTier[];
  /** Override per professional */
  professionalOverrides: {
    professionalId: UUID;
    type: CommissionType;
    value: Decimal;
    tiers?: CommissionTier[];
  }[];
  /** Apply only after target */
  targetAmount?: Decimal;
  /** Deduct product costs before calculating */
  deductProductCosts: boolean;
}

// ============================================================================
// CONSUMABLES & PRODUCTS
// ============================================================================

/** Consumable usage type */
export type ConsumableUsageType = 'fixed' | 'variable' | 'per_application';

/** Service consumable */
export interface ServiceConsumable {
  id: UUID;
  productId: UUID;
  productName: string;
  productSku: string;
  productUnit: string;
  usageType: ConsumableUsageType;
  quantity: Decimal;
  minQuantity?: Decimal;
  maxQuantity?: Decimal;
  unitCost: Decimal;
  isOptional: boolean;
  notes?: string;
}

// ============================================================================
// SERVICE REQUIREMENTS
// ============================================================================

/** Equipment requirement */
export interface EquipmentRequirement {
  id: UUID;
  equipmentId: UUID;
  equipmentName: string;
  quantity: number;
  isExclusive: boolean; // Cannot be shared during service
  alternativeEquipmentIds?: UUID[];
}

/** Room/space requirement */
export interface RoomRequirement {
  id: UUID;
  roomId: UUID;
  roomName: string;
  isExclusive: boolean;
  alternativeRoomIds?: UUID[];
}

/** Service requirements */
export interface ServiceRequirements {
  equipment: EquipmentRequirement[];
  rooms: RoomRequirement[];
  minProfessionalLevel?: 'junior' | 'mid' | 'senior' | 'specialist';
  certifications?: string[];
  simultaneousServices?: number; // How many can be done at once
}

// ============================================================================
// ONLINE BOOKING SETTINGS
// ============================================================================

/** Online booking configuration */
export interface OnlineBookingSettings {
  isAvailable: boolean;
  requiresApproval: boolean;
  advanceBookingDays: number; // Max days in advance
  minAdvanceHours: number; // Min hours in advance
  allowSameDay: boolean;
  requiresDeposit: boolean;
  depositAmount?: Decimal;
  depositPercentage?: Decimal;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'custom';
  customCancellationHours?: number;
  displayPrice: 'show' | 'hide' | 'starting_from';
  displayDuration: boolean;
  confirmationMessage?: string;
  specialInstructions?: string;
}

// ============================================================================
// SERVICE CATEGORY
// ============================================================================

/** Service category */
export interface ServiceCategory {
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
  path: string; // Full path like "Cabelo/Coloração"
  isActive: boolean;
  serviceCount: number;
  children?: ServiceCategory[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SERVICE IMAGES
// ============================================================================

/** Service image with metadata */
export interface ServiceImage extends ImageFile {
  serviceId: UUID;
  isPrimary: boolean;
  order: number;
  caption?: string;
}

// ============================================================================
// MAIN SERVICE INTERFACE
// ============================================================================

/** Complete service entity */
export interface Service extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  // Basic info
  code: string; // Unique per tenant (e.g., SRV-00001)
  name: string;
  shortName?: string; // For display in tight spaces
  description?: string;
  instructions?: string; // Pre-service instructions for client
  internalNotes?: string; // Notes for professionals
  
  // Categorization
  categoryId: UUID;
  category: ServiceCategory;
  tags: string[];
  
  // Duration
  duration: ServiceDuration;
  
  // Pricing
  pricing: ServicePricing;
  
  // Commission
  commission: ServiceCommission;
  
  // Consumables
  consumables: ServiceConsumable[];
  totalConsumableCost: Decimal;
  
  // Requirements
  requirements: ServiceRequirements;
  
  // Images
  images: ServiceImage[];
  primaryImageUrl?: string;
  
  // Online booking
  onlineBooking: OnlineBookingSettings;
  
  // Segment-specific fields
  segment: BusinessSegment;
  segmentFields: SegmentServiceFields;
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Popularity metrics
  metrics: {
    totalBookings: number;
    totalRevenue: Decimal;
    averageRating: Decimal;
    reviewCount: number;
  };
  
  // Availability
  isActive: boolean;
  isPopular: boolean; // Featured/promoted
  isSeasonal: boolean;
  seasonalStart?: string; // MM-DD
  seasonalEnd?: string; // MM-DD
  
  // Professionals who can perform this service
  professionalIds: UUID[];
  allowAllProfessionals: boolean;
  
  // Related services
  relatedServiceIds: UUID[];
  
  // Package/combo info
  isPackage: boolean;
  packageServices?: {
    serviceId: UUID;
    quantity: number;
    discount: Decimal;
  }[];
  packageDiscount?: Decimal;
  
  // Recurrence
  allowRecurrence: boolean;
  suggestedRecurrenceDays?: number;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  
  // Status
  status: EntityStatus;
  
  // Soft delete
  deletedAt?: string;
}

// ============================================================================
// SERVICE LIST ITEM
// ============================================================================

/** Simplified service for list views */
export interface ServiceListItem {
  id: UUID;
  code: string;
  name: string;
  categoryId: UUID;
  categoryName: string;
  categoryPath: string;
  durationMinutes: number;
  basePrice: Decimal;
  promotionalPrice?: Decimal;
  primaryImageUrl?: string;
  isActive: boolean;
  isPopular: boolean;
  professionalCount: number;
  status: EntityStatus;
}

// ============================================================================
// SERVICE FILTERS
// ============================================================================

/** Service filter options */
export interface ServiceFilters {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  categoryId?: UUID | UUID[];
  professionalId?: UUID;
  isActive?: boolean;
  isPopular?: boolean;
  isPackage?: boolean;
  onlineBookingAvailable?: boolean;
  priceMin?: Decimal;
  priceMax?: Decimal;
  durationMin?: number; // minutes
  durationMax?: number;
  segment?: BusinessSegment;
  tags?: string[];
}

// ============================================================================
// SERVICE FORM DATA
// ============================================================================

/** Data for creating a service */
export interface CreateServiceData {
  name: string;
  shortName?: string;
  description?: string;
  instructions?: string;
  internalNotes?: string;
  categoryId: UUID;
  tags?: string[];
  
  // Duration
  durationMinutes: number;
  preparationMinutes?: number;
  finalizationMinutes?: number;
  bufferMinutes?: number;
  allowVariableDuration?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  
  // Pricing
  pricingType?: PricingType;
  basePrice: Decimal;
  promotionalPrice?: Decimal;
  promotionalValidUntil?: string;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  estimatedCost?: Decimal;
  allowPriceAdjustment?: boolean;
  maxDiscountPercent?: Decimal;
  
  // Commission
  commissionType?: CommissionType;
  commissionPercentage?: Decimal;
  commissionFixed?: Decimal;
  deductProductCosts?: boolean;
  
  // Consumables
  consumables?: Omit<ServiceConsumable, 'id'>[];
  
  // Images
  images?: { url: string; isPrimary: boolean; order: number; caption?: string }[];
  
  // Online booking
  onlineBookingAvailable?: boolean;
  requiresApproval?: boolean;
  advanceBookingDays?: number;
  minAdvanceHours?: number;
  requiresDeposit?: boolean;
  depositAmount?: Decimal;
  
  // Professionals
  professionalIds?: UUID[];
  allowAllProfessionals?: boolean;
  
  // Segment fields
  segmentFields?: SegmentServiceFields;
  
  // Custom fields
  customFields?: Record<string, unknown>;
}

/** Data for updating a service */
export interface UpdateServiceData extends Partial<CreateServiceData> {
  status?: EntityStatus;
  isPopular?: boolean;
  isSeasonal?: boolean;
  seasonalStart?: string;
  seasonalEnd?: string;
  relatedServiceIds?: UUID[];
}

// ============================================================================
// SERVICE CATEGORY FORM DATA
// ============================================================================

/** Data for creating a category */
export interface CreateCategoryData {
  parentId?: UUID;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  imageUrl?: string;
  order?: number;
}

/** Data for updating a category */
export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}
