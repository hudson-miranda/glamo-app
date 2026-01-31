/**
 * GLAMO - Base Types
 * Foundational types used across all modules
 * 
 * @version 1.0.0
 */

// ============================================================================
// IDENTIFICATION & REFERENCES
// ============================================================================

/** UUID type for all entity identifiers */
export type UUID = string;

/** Decimal type for monetary values (stored as string to prevent floating point issues) */
export type Decimal = string;

/** ISO 8601 date string */
export type ISODate = string;

/** ISO 8601 datetime string */
export type ISODateTime = string;

/** Time string in HH:mm format */
export type TimeString = string;

// ============================================================================
// COMMON ENUMS
// ============================================================================

/** Entity status across the system */
export type EntityStatus = 'active' | 'inactive' | 'blocked' | 'deleted';

/** Contact channels supported by the platform */
export type ContactChannel = 'whatsapp' | 'sms' | 'email' | 'phone' | 'push';

/** Gender options */
export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

/** Days of the week (0 = Sunday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Payment methods supported */
export type PaymentMethod = 
  | 'cash' 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'voucher' 
  | 'bank_transfer' 
  | 'boleto'
  | 'loyalty_points'
  | 'credit';

/** Payment status */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

/** Transaction types */
export type TransactionType = 'sale' | 'refund' | 'adjustment' | 'credit';

// ============================================================================
// ADDRESS
// ============================================================================

/** Complete address structure */
export interface Address {
  id?: UUID;
  type: 'home' | 'work' | 'billing' | 'other';
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
}

// ============================================================================
// CONTACT INFO
// ============================================================================

/** Phone number with type */
export interface PhoneNumber {
  type: 'mobile' | 'landline' | 'whatsapp' | 'work';
  number: string;
  isPrimary: boolean;
  isWhatsApp: boolean;
}

/** Contact information structure */
export interface ContactInfo {
  phones: PhoneNumber[];
  email?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}

// ============================================================================
// AUDIT FIELDS
// ============================================================================

/** Standard audit fields for all entities */
export interface AuditFields {
  createdAt: ISODateTime;
  createdBy?: UUID;
  updatedAt: ISODateTime;
  updatedBy?: UUID;
  deletedAt?: ISODateTime;
  deletedBy?: UUID;
}

// ============================================================================
// TENANT & USER CONTEXT
// ============================================================================

/** Tenant context for multi-tenancy */
export interface TenantContext {
  tenantId: UUID;
  tenantSlug: string;
  tenantName: string;
  segment: BusinessSegment;
  plan: TenantPlan;
  settings: TenantSettings;
}

/** Business segment types */
export type BusinessSegment = 
  | 'beauty'      // Salões de beleza
  | 'aesthetics'  // Clínicas de estética
  | 'health'      // Clínicas de saúde
  | 'wellness'    // Spas e bem-estar
  | 'tattoo'      // Estúdios de tatuagem/piercing
  | 'pet'         // Pet shops e veterinárias
  | 'general';    // Serviços gerais

/** Subscription plans */
export type TenantPlan = 'starter' | 'professional' | 'business' | 'enterprise';

/** Tenant-level settings */
export interface TenantSettings {
  timezone: string;
  currency: string;
  locale: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: DayOfWeek;
  appointmentReminders: {
    enabled: boolean;
    channels: ContactChannel[];
    timingMinutes: number[];
  };
  workingHours: {
    dayOfWeek: DayOfWeek;
    isOpen: boolean;
    openTime?: TimeString;
    closeTime?: TimeString;
    breakStart?: TimeString;
    breakEnd?: TimeString;
  }[];
  cancellationPolicy: {
    allowCancellation: boolean;
    minimumHours: number;
    fee?: Decimal;
    feeType?: 'percentage' | 'fixed';
  };
  onlineBooking: {
    enabled: boolean;
    maxAdvanceDays: number;
    minAdvanceHours: number;
    requireConfirmation: boolean;
    allowAnyProfessional: boolean;
  };
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  links: {
    first: string;
    previous?: string;
    next?: string;
    last: string;
  };
}

/** Generic filter options */
export interface FilterOptions {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  dateFrom?: ISODate;
  dateTo?: ISODate;
  [key: string]: unknown;
}

// ============================================================================
// FILE & MEDIA
// ============================================================================

/** File/image reference */
export interface FileReference {
  id: UUID;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: ISODateTime;
  uploadedBy?: UUID;
}

/** Image with metadata */
export interface ImageFile extends FileReference {
  width: number;
  height: number;
  altText?: string;
}

// ============================================================================
// TAGS & METADATA
// ============================================================================

/** Tag structure */
export interface Tag {
  id: UUID;
  name: string;
  color: string;
  description?: string;
}

/** Key-value metadata */
export type Metadata = Record<string, string | number | boolean | null>;

// ============================================================================
// FORM & VALIDATION
// ============================================================================

/** Field error structure */
export interface FieldError {
  field: string;
  message: string;
  code: string;
}

/** Form state */
export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/** Notification types */
export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'payment_received'
  | 'marketing'
  | 'system';

/** Notification structure */
export interface Notification {
  id: UUID;
  type: NotificationType;
  channel: ContactChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: ISODateTime;
  deliveredAt?: ISODateTime;
  readAt?: ISODateTime;
  errorMessage?: string;
  metadata?: Metadata;
}

// ============================================================================
// DYNAMIC FIELDS
// ============================================================================

/** Dynamic field definition */
export interface DynamicFieldDefinition {
  id: UUID;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  segment?: BusinessSegment | BusinessSegment[];
  entityType: 'customer' | 'professional' | 'service' | 'product';
  order: number;
  isActive: boolean;
}

/** Dynamic field value */
export interface DynamicFieldValue {
  fieldId: UUID;
  value: unknown;
}

// ============================================================================
// OPERATION RESULT
// ============================================================================

/** Generic operation result */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}
