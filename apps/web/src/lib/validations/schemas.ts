/**
 * GLAMO - Zod Validation Schemas
 * Comprehensive validation schemas for all entities
 * 
 * @version 1.0.0
 * @description Type-safe validation with detailed error messages
 */

import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

/** UUID v4 pattern */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** CPF pattern (000.000.000-00 or 00000000000) */
const CPF_PATTERN = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/;

/** CNPJ pattern (00.000.000/0000-00 or 00000000000000) */
const CNPJ_PATTERN = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})$/;

/** Phone pattern (Brazilian) */
const PHONE_PATTERN = /^(\+55)?[\s.-]?\(?[1-9]{2}\)?[\s.-]?9?[0-9]{4}[\s.-]?[0-9]{4}$/;

/** Email pattern */
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** CEP pattern (00000-000 or 00000000) */
const CEP_PATTERN = /^[0-9]{5}-?[0-9]{3}$/;

/** Hex color pattern */
const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/** Time pattern (HH:mm) */
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/** UUID schema */
export const uuidSchema = z.string()
  .regex(UUID_PATTERN, 'UUID inválido')
  .describe('Identificador único');

/** Decimal schema (string for precision) */
export const decimalSchema = z.string()
  .refine((val) => !isNaN(parseFloat(val)), 'Valor numérico inválido')
  .transform((val) => parseFloat(val).toFixed(2))
  .describe('Valor decimal');

/** Positive decimal */
export const positiveDecimalSchema = z.string()
  .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Valor deve ser positivo')
  .transform((val) => parseFloat(val).toFixed(2));

/** Non-zero positive decimal */
export const nonZeroDecimalSchema = z.string()
  .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Valor deve ser maior que zero')
  .transform((val) => parseFloat(val).toFixed(2));

/** Date string (ISO format) */
export const dateSchema = z.string()
  .refine((val) => !isNaN(Date.parse(val)), 'Data inválida')
  .describe('Data no formato ISO');

/** Optional date */
export const optionalDateSchema = z.string()
  .refine((val) => !val || !isNaN(Date.parse(val)), 'Data inválida')
  .optional()
  .nullable();

/** Time string (HH:mm) */
export const timeSchema = z.string()
  .regex(TIME_PATTERN, 'Horário inválido (use HH:mm)')
  .describe('Horário no formato HH:mm');

/** CPF schema with validation */
export const cpfSchema = z.string()
  .regex(CPF_PATTERN, 'CPF inválido')
  .refine((cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cleaned[9]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cleaned[10]) !== digit) return false;
    
    return true;
  }, 'CPF inválido')
  .describe('CPF válido');

/** CNPJ schema with validation */
export const cnpjSchema = z.string()
  .regex(CNPJ_PATTERN, 'CNPJ inválido')
  .refine((cnpj) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i];
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(cleaned[12]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i];
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(cleaned[13]) !== digit) return false;
    
    return true;
  }, 'CNPJ inválido')
  .describe('CNPJ válido');

/** Phone schema */
export const phoneSchema = z.string()
  .regex(PHONE_PATTERN, 'Telefone inválido')
  .transform((phone) => phone.replace(/\D/g, ''))
  .describe('Telefone no formato brasileiro');

/** Email schema */
export const emailSchema = z.string()
  .regex(EMAIL_PATTERN, 'E-mail inválido')
  .toLowerCase()
  .describe('E-mail válido');

/** CEP schema */
export const cepSchema = z.string()
  .regex(CEP_PATTERN, 'CEP inválido')
  .transform((cep) => cep.replace(/\D/g, ''))
  .describe('CEP válido');

/** Hex color schema */
export const hexColorSchema = z.string()
  .regex(HEX_COLOR_PATTERN, 'Cor hexadecimal inválida')
  .describe('Cor em formato hexadecimal');

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/** Entity status */
export const entityStatusSchema = z.enum(['active', 'inactive', 'blocked', 'deleted']);

/** Contact channel */
export const contactChannelSchema = z.enum([
  'whatsapp', 'phone', 'sms', 'email', 'app', 'instagram', 'telegram', 'other'
]);

/** Gender */
export const genderSchema = z.enum(['male', 'female', 'non_binary', 'other', 'not_informed']);

/** Payment method */
export const paymentMethodSchema = z.enum([
  'cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 
  'voucher', 'loyalty_points', 'installment', 'other'
]);

/** Payment status */
export const paymentStatusSchema = z.enum([
  'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled', 'overdue'
]);

/** Business segment */
export const businessSegmentSchema = z.enum([
  'beauty', 'aesthetics', 'health', 'wellness', 'tattoo_piercing', 'pet', 'general'
]);

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

/** Address schema */
export const addressSchema = z.object({
  id: uuidSchema.optional(),
  label: z.string().max(50, 'Rótulo muito longo').optional(),
  street: z.string().min(1, 'Rua é obrigatória').max(200, 'Rua muito longa'),
  number: z.string().min(1, 'Número é obrigatório').max(20, 'Número muito longo'),
  complement: z.string().max(100, 'Complemento muito longo').optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório').max(100, 'Bairro muito longo'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Cidade muito longa'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  country: z.string().default('BR'),
  zipCode: cepSchema,
  isDefault: z.boolean().default(false),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/** Phone number schema */
export const phoneNumberSchema = z.object({
  number: phoneSchema,
  type: z.enum(['mobile', 'landline', 'whatsapp', 'work', 'home', 'other']),
  isVerified: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
});

/** Tag schema */
export const tagSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(1, 'Nome da tag é obrigatório').max(50, 'Nome muito longo'),
  color: hexColorSchema,
});

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

/** Customer source */
export const customerSourceSchema = z.enum([
  'website', 'google', 'instagram', 'facebook', 'whatsapp',
  'referral', 'walk_in', 'event', 'partnership', 'advertising', 'other'
]);

/** Loyalty tier */
export const loyaltyTierSchema = z.enum(['bronze', 'silver', 'gold', 'diamond']);

/** Create customer schema - aligned with Prisma schema */
export const createCustomerSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform((name) => name.trim()),
  
  email: emailSchema.optional().nullable().or(z.literal('')),
  
  phone: phoneSchema,
  
  birthDate: optionalDateSchema,
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED']).optional().default('NOT_INFORMED'),
  
  cpf: cpfSchema.optional().nullable().or(z.literal('')),
  
  rg: z.string().max(20, 'RG muito longo').optional().nullable(),
  
  street: z.string().max(200).optional().nullable(),
  
  number: z.string().max(20).optional().nullable(),
  
  complement: z.string().max(100).optional().nullable(),
  
  neighborhood: z.string().max(100).optional().nullable(),
  
  city: z.string().max(100).optional().nullable(),
  
  state: z.string().max(2).optional().nullable(),
  
  zipCode: z.string().max(10).optional().nullable(),
  
  notes: z.string().max(2000, 'Notas muito longas').optional().nullable(),
  
  tags: z.array(z.string()).optional().default([]),
  
  acceptsMarketing: z.boolean().optional().default(true),
  
  source: customerSourceSchema.optional().nullable(),
});

/** Alias for API compatibility */
export const customerCreateSchema = createCustomerSchema;

/** Update customer schema */
export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/** Alias for API compatibility */
export const customerUpdateSchema = updateCustomerSchema;

// ============================================================================
// SERVICE SCHEMAS
// ============================================================================

/** Pricing type */
export const pricingTypeSchema = z.enum(['fixed', 'starting_from', 'variable', 'on_quote']);

/** Commission type */
export const commissionTypeSchema = z.enum(['percentage', 'fixed', 'tiered', 'custom']);

/** Create service schema */
export const createServiceSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  
  shortName: z.string().max(30, 'Nome curto muito longo').optional(),
  
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  
  instructions: z.string().max(2000, 'Instruções muito longas').optional(),
  
  internalNotes: z.string().max(2000, 'Notas muito longas').optional(),
  
  categoryId: uuidSchema,
  
  tags: z.array(z.string()).optional().default([]),
  
  // Duration
  durationMinutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(5, 'Duração mínima é 5 minutos')
    .max(480, 'Duração máxima é 8 horas'),
  
  preparationMinutes: z.number().int().min(0).max(60).optional().default(0),
  
  finalizationMinutes: z.number().int().min(0).max(60).optional().default(0),
  
  bufferMinutes: z.number().int().min(0).max(60).optional().default(0),
  
  allowVariableDuration: z.boolean().optional().default(false),
  
  minDurationMinutes: z.number().int().min(5).optional(),
  
  maxDurationMinutes: z.number().int().max(480).optional(),
  
  // Pricing
  pricingType: pricingTypeSchema.optional().default('fixed'),
  
  basePrice: nonZeroDecimalSchema,
  
  promotionalPrice: positiveDecimalSchema.optional(),
  
  promotionalValidUntil: optionalDateSchema,
  
  minPrice: positiveDecimalSchema.optional(),
  
  maxPrice: positiveDecimalSchema.optional(),
  
  estimatedCost: positiveDecimalSchema.optional(),
  
  allowPriceAdjustment: z.boolean().optional().default(false),
  
  maxDiscountPercent: z.number().min(0).max(100).optional(),
  
  // Commission
  commissionType: commissionTypeSchema.optional().default('percentage'),
  
  commissionPercentage: z.number().min(0).max(100).optional().default(0),
  
  commissionFixed: positiveDecimalSchema.optional(),
  
  deductProductCosts: z.boolean().optional().default(false),
  
  // Consumables
  consumables: z.array(z.object({
    productId: uuidSchema,
    usageType: z.enum(['fixed', 'variable', 'per_application']).default('fixed'),
    quantity: nonZeroDecimalSchema,
    isOptional: z.boolean().default(false),
    notes: z.string().max(200).optional(),
  })).optional().default([]),
  
  // Images
  images: z.array(z.object({
    url: z.string().url('URL inválida'),
    isPrimary: z.boolean(),
    order: z.number().int().min(0),
    caption: z.string().max(200).optional(),
  })).optional().default([]),
  
  // Online booking
  onlineBookingAvailable: z.boolean().optional().default(true),
  
  requiresApproval: z.boolean().optional().default(false),
  
  advanceBookingDays: z.number().int().min(1).max(365).optional().default(30),
  
  minAdvanceHours: z.number().int().min(0).max(168).optional().default(2),
  
  requiresDeposit: z.boolean().optional().default(false),
  
  depositAmount: positiveDecimalSchema.optional(),
  
  // Professionals
  professionalIds: z.array(uuidSchema).optional().default([]),
  
  allowAllProfessionals: z.boolean().optional().default(true),
  
  // Segment fields
  segmentFields: z.record(z.unknown()).optional().default({}),
  
  // Custom fields
  customFields: z.record(z.unknown()).optional().default({}),
});

/** Service validation refinements */
const serviceRefinements = <T extends z.ZodTypeAny>(schema: T) => {
  return schema;
};

/** Alias for API compatibility */
export const serviceCreateSchema = createServiceSchema;

/** Update service schema */
export const updateServiceSchema = createServiceSchema.partial().extend({
  status: entityStatusSchema.optional(),
  isPopular: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  seasonalStart: z.string().regex(/^\d{2}-\d{2}$/, 'Formato inválido (MM-DD)').optional(),
  seasonalEnd: z.string().regex(/^\d{2}-\d{2}$/, 'Formato inválido (MM-DD)').optional(),
  relatedServiceIds: z.array(uuidSchema).optional(),
});

// ============================================================================
// PROFESSIONAL SCHEMAS
// ============================================================================

/** Professional role */
export const professionalRoleSchema = z.enum([
  'owner', 'manager', 'receptionist', 'professional', 'assistant', 'trainee', 'external'
]);

/** Professional level */
export const professionalLevelSchema = z.enum([
  'trainee', 'junior', 'mid', 'senior', 'specialist', 'master'
]);

/** Employment type */
export const employmentTypeSchema = z.enum([
  'employee', 'contractor', 'commission', 'partner', 'freelancer'
]);

/** Commission model */
export const commissionModelSchema = z.enum([
  'fixed_percentage', 'tiered_percentage', 'fixed_amount', 'hybrid', 'custom'
]);

/** Day schedule schema */
export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isWorkDay: z.boolean(),
  slots: z.array(z.object({
    start: timeSchema,
    end: timeSchema,
  })).default([]),
});

/** Create professional schema */
export const createProfessionalSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome muito longo'),
  
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome muito longo'),
  
  displayName: z.string().max(50, 'Nome profissional muito longo').optional(),
  
  email: emailSchema,
  
  phone: phoneSchema,
  
  cpf: cpfSchema,
  
  rg: z.string().max(20, 'RG muito longo').optional(),
  
  birthDate: dateSchema,
  
  gender: genderSchema,
  
  address: addressSchema.optional(),
  
  role: professionalRoleSchema,
  
  level: professionalLevelSchema.optional().default('mid'),
  
  employmentType: employmentTypeSchema,
  
  hireDate: dateSchema,
  
  department: z.string().max(50, 'Departamento muito longo').optional(),
  
  position: z.string().max(50, 'Cargo muito longo').optional(),
  
  specialties: z.array(z.string()).optional().default([]),
  
  bio: z.string().max(2000, 'Bio muito longa').optional(),
  
  serviceIds: z.array(uuidSchema).optional().default([]),
  
  allowAllServices: z.boolean().optional().default(false),
  
  // Commission
  commissionModel: commissionModelSchema.optional().default('fixed_percentage'),
  
  serviceCommissionPercentage: z.number().min(0).max(100).optional().default(0),
  
  productCommissionPercentage: z.number().min(0).max(100).optional().default(0),
  
  // Schedule
  defaultSchedule: z.array(dayScheduleSchema).length(7).optional(),
  
  // Online booking
  onlineBookingVisible: z.boolean().optional().default(true),
  
  acceptsNewClients: z.boolean().optional().default(true),
  
  calendarColor: hexColorSchema.optional().default('#8B5CF6'),
  
  unitIds: z.array(uuidSchema).optional().default([]),
  
  primaryUnitId: uuidSchema.optional(),
  
  customFields: z.record(z.unknown()).optional().default({}),
});

/** Update professional schema */
export const updateProfessionalSchema = createProfessionalSchema.partial().extend({
  status: entityStatusSchema.optional(),
  statusReason: z.string().max(500, 'Motivo muito longo').optional(),
  terminationDate: optionalDateSchema,
  avatarUrl: z.string().url('URL inválida').optional(),
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

/** Product type */
export const productTypeSchema = z.enum(['sellable', 'consumable', 'both']);

/** Stock tracking method */
export const stockTrackingSchema = z.enum(['none', 'quantity', 'lot', 'serial']);

/** Create product schema */
export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  
  shortName: z.string().max(30, 'Nome curto muito longo').optional(),
  
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  
  sku: z.string()
    .min(1, 'SKU é obrigatório')
    .max(50, 'SKU muito longo')
    .transform((sku) => sku.toUpperCase()),
  
  barcode: z.string().max(50, 'Código de barras muito longo').optional(),
  
  type: productTypeSchema,
  
  categoryId: uuidSchema,
  
  brandId: uuidSchema.optional(),
  
  stockTracking: stockTrackingSchema.optional().default('quantity'),
  
  trackExpiration: z.boolean().optional().default(false),
  
  expirationAlertDays: z.number().int().min(0).max(365).optional().default(30),
  
  // Pricing
  costPrice: positiveDecimalSchema,
  
  sellingPrice: nonZeroDecimalSchema,
  
  promotionalPrice: positiveDecimalSchema.optional(),
  
  promotionalStart: optionalDateSchema,
  
  promotionalEnd: optionalDateSchema,
  
  commissionPercentage: z.number().min(0).max(100).optional().default(0),
  
  allowDiscount: z.boolean().optional().default(true),
  
  maxDiscountPercent: z.number().min(0).max(100).optional(),
  
  // Stock levels
  minimumStock: z.number().min(0).optional().default(0),
  
  idealStock: z.number().min(0).optional(),
  
  maximumStock: z.number().min(0).optional(),
  
  reorderPoint: z.number().min(0).optional(),
  
  reorderQuantity: z.number().min(0).optional(),
  
  // Physical
  weight: z.number().min(0).optional(),
  
  weightUnit: z.enum(['g', 'kg', 'oz', 'lb']).optional(),
  
  unit: z.string().max(20).optional().default('un'),
  
  // Supplier
  primarySupplierId: uuidSchema.optional(),
  
  supplierCode: z.string().max(50, 'Código muito longo').optional(),
  
  // Consumable
  consumableFor: z.array(uuidSchema).optional().default([]),
  
  defaultConsumptionQuantity: positiveDecimalSchema.optional(),
  
  // Sale
  isAvailableForSale: z.boolean().optional().default(true),
  
  isAvailableOnline: z.boolean().optional().default(false),
  
  requiresPrescription: z.boolean().optional().default(false),
  
  ageRestricted: z.boolean().optional().default(false),
  
  minAge: z.number().int().min(0).max(100).optional(),
  
  // Images
  images: z.array(z.object({
    url: z.string().url('URL inválida'),
    isPrimary: z.boolean(),
    order: z.number().int().min(0),
    caption: z.string().max(200).optional(),
  })).optional().default([]),
  
  tags: z.array(z.string()).optional().default([]),
  
  customFields: z.record(z.unknown()).optional().default({}),
});

/** Alias for API compatibility */
export const productCreateSchema = createProductSchema;

/** Update product schema */
export const updateProductSchema = createProductSchema.partial().extend({
  status: entityStatusSchema.optional(),
});

// ============================================================================
// SUPPLIER SCHEMAS
// ============================================================================

/** Supplier type */
export const supplierTypeSchema = z.enum([
  'manufacturer', 'distributor', 'wholesaler', 'retailer', 'importer', 'service_provider', 'other'
]);

/** Payment terms */
export const paymentTermsSchema = z.enum([
  'cash', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'installments', 'custom'
]);

/** Supplier contact schema */
export const supplierContactSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: z.string().max(50, 'Cargo muito longo'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  mobile: phoneSchema.optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(500, 'Notas muito longas').optional(),
});

/** Create supplier schema */
export const createSupplierSchema = z.object({
  companyName: z.string()
    .min(2, 'Nome da empresa é obrigatório')
    .max(200, 'Nome muito longo'),
  
  tradeName: z.string().max(200, 'Nome fantasia muito longo').optional(),
  
  cnpj: cnpjSchema.optional().or(z.literal('')),
  
  stateRegistration: z.string().max(20, 'IE muito longa').optional(),
  
  type: supplierTypeSchema,
  
  email: emailSchema.optional().or(z.literal('')),
  
  phone: phoneSchema.optional().or(z.literal('')),
  
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  
  address: addressSchema.optional(),
  
  contacts: z.array(supplierContactSchema).optional().default([]),
  
  paymentTerms: paymentTermsSchema.optional().default('net_30'),
  
  paymentTermsCustom: z.string().max(200, 'Condição muito longa').optional(),
  
  minimumOrderType: z.enum(['quantity', 'value', 'both']).optional(),
  
  minimumOrderQuantity: z.number().min(0).optional(),
  
  minimumOrderValue: positiveDecimalSchema.optional(),
  
  freeShippingThreshold: positiveDecimalSchema.optional(),
  
  leadTimeStandardDays: z.number().int().min(1).max(365).optional().default(7),
  
  leadTimeExpressDays: z.number().int().min(1).max(30).optional(),
  
  shippingPolicy: z.string().max(2000, 'Política muito longa').optional(),
  
  returnPolicy: z.string().max(2000, 'Política muito longa').optional(),
  
  categoryIds: z.array(uuidSchema).optional().default([]),
  
  tags: z.array(z.string()).optional().default([]),
  
  notes: z.string().max(2000, 'Notas muito longas').optional(),
  
  internalNotes: z.string().max(2000, 'Notas muito longas').optional(),
  
  customFields: z.record(z.unknown()).optional().default({}),
});

/** Update supplier schema */
export const updateSupplierSchema = createSupplierSchema.partial().extend({
  status: entityStatusSchema.optional(),
  blockedReason: z.string().max(500, 'Motivo muito longo').optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Inferred types from schemas */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
