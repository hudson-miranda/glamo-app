/**
 * GLAMO - Professional Types
 * Complete professional/staff type definitions per RF-EQUIPE-001 to RF-EQUIPE-004
 * 
 * @version 1.0.0
 * @description Supports all business segments with schedules, commissions, specialties
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  EntityStatus,
  Gender,
  Address,
  AuditFields,
  ImageFile,
  Metadata,
} from './base';

// ============================================================================
// PROFESSIONAL ROLE & LEVEL
// ============================================================================

/** Professional role */
export type ProfessionalRole = 
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'professional'
  | 'assistant'
  | 'trainee'
  | 'external';

/** Professional level */
export type ProfessionalLevel = 
  | 'trainee'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'specialist'
  | 'master';

/** Employment type */
export type EmploymentType = 
  | 'employee'      // CLT
  | 'contractor'    // PJ
  | 'commission'    // Apenas comissão
  | 'partner'       // Sócio
  | 'freelancer';   // Eventual

// ============================================================================
// PROFESSIONAL SCHEDULE (RF-EQUIPE-002)
// ============================================================================

/** Time slot */
export interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
}

/** Day schedule */
export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isWorkDay: boolean;
  slots: TimeSlot[];
}

/** Week schedule template */
export interface WeekSchedule {
  id: UUID;
  name: string;
  isDefault: boolean;
  validFrom?: ISODate;
  validUntil?: ISODate;
  days: DaySchedule[];
}

/** Schedule exception type */
export type ScheduleExceptionType = 
  | 'vacation'
  | 'holiday'
  | 'sick_leave'
  | 'personal'
  | 'training'
  | 'extra_hours'
  | 'other';

/** Schedule exception */
export interface ScheduleException {
  id: UUID;
  professionalId: UUID;
  type: ScheduleExceptionType;
  title: string;
  description?: string;
  startDate: ISODate;
  endDate: ISODate;
  startTime?: string; // HH:mm - if partial day
  endTime?: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurringPattern?: string; // RRULE format
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: UUID;
  approvedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Break configuration */
export interface BreakConfig {
  id: UUID;
  name: string;
  durationMinutes: number;
  isRequired: boolean;
  defaultTime?: string; // HH:mm
  flexibleWindow?: number; // minutes before/after default
  daysApplicable: number[]; // 0-6
}

// ============================================================================
// PROFESSIONAL COMMISSION (RF-COM-001)
// ============================================================================

/** Commission model */
export type CommissionModel = 
  | 'fixed_percentage'
  | 'tiered_percentage'
  | 'fixed_amount'
  | 'hybrid'
  | 'custom';

/** Commission tier */
export interface CommissionTier {
  minAmount: Decimal;
  maxAmount?: Decimal;
  percentage: Decimal;
  fixedBonus?: Decimal;
}

/** Service-specific commission */
export interface ServiceCommissionOverride {
  serviceId: UUID;
  serviceName: string;
  commissionType: 'percentage' | 'fixed';
  value: Decimal;
}

/** Product-specific commission */
export interface ProductCommissionOverride {
  productId: UUID;
  productName: string;
  commissionType: 'percentage' | 'fixed';
  value: Decimal;
}

/** Professional commission configuration */
export interface ProfessionalCommission {
  model: CommissionModel;
  serviceDefaultPercentage: Decimal;
  productDefaultPercentage: Decimal;
  tiers?: CommissionTier[];
  serviceOverrides: ServiceCommissionOverride[];
  productOverrides: ProductCommissionOverride[];
  /** Minimum guaranteed amount per month */
  minimumGuarantee?: Decimal;
  /** Deduct stock costs */
  deductStockCosts: boolean;
  /** Advance payment policy */
  advancePaymentAllowed: boolean;
  maxAdvanceAmount?: Decimal;
  /** Commission payment day */
  paymentDay: number; // 1-31
  /** Split commission between professionals */
  allowSplit: boolean;
}

// ============================================================================
// PROFESSIONAL GOALS
// ============================================================================

/** Goal type */
export type GoalType = 
  | 'revenue'
  | 'services_count'
  | 'new_clients'
  | 'product_sales'
  | 'retention_rate'
  | 'average_ticket'
  | 'reviews'
  | 'custom';

/** Goal period */
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/** Professional goal */
export interface ProfessionalGoal {
  id: UUID;
  professionalId: UUID;
  type: GoalType;
  name: string;
  description?: string;
  period: GoalPeriod;
  target: Decimal;
  current: Decimal;
  progress: Decimal; // Percentage
  bonus?: Decimal;
  startDate: ISODate;
  endDate: ISODate;
  status: 'active' | 'achieved' | 'failed' | 'cancelled';
  achievedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// PROFESSIONAL SKILLS & CERTIFICATIONS
// ============================================================================

/** Skill proficiency */
export type SkillProficiency = 'learning' | 'competent' | 'proficient' | 'expert';

/** Professional skill */
export interface ProfessionalSkill {
  id: UUID;
  name: string;
  category?: string;
  proficiency: SkillProficiency;
  certifiedAt?: ISODate;
  expiresAt?: ISODate;
  notes?: string;
}

/** Certification */
export interface ProfessionalCertification {
  id: UUID;
  name: string;
  issuingOrganization: string;
  issueDate: ISODate;
  expirationDate?: ISODate;
  certificateNumber?: string;
  certificateUrl?: string;
  verificationUrl?: string;
  isVerified: boolean;
}

// ============================================================================
// PROFESSIONAL DOCUMENTS
// ============================================================================

/** Document type */
export type ProfessionalDocumentType = 
  | 'identity'
  | 'cpf'
  | 'address_proof'
  | 'contract'
  | 'certification'
  | 'license'
  | 'photo'
  | 'other';

/** Professional document */
export interface ProfessionalDocument {
  id: UUID;
  professionalId: UUID;
  type: ProfessionalDocumentType;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiresAt?: ISODate;
  isVerified: boolean;
  verifiedBy?: UUID;
  verifiedAt?: ISODateTime;
  uploadedAt: ISODateTime;
}

// ============================================================================
// PROFESSIONAL METRICS
// ============================================================================

/** Professional performance metrics */
export interface ProfessionalMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: Decimal;
  
  totalRevenue: Decimal;
  totalCommission: Decimal;
  averageTicket: Decimal;
  
  totalClients: number;
  newClients: number;
  returnClients: number;
  retentionRate: Decimal;
  
  averageRating: Decimal;
  reviewCount: number;
  recommendationRate: Decimal;
  
  productSalesRevenue: Decimal;
  productSalesCount: number;
  
  averageServiceDuration: number; // minutes
  utilizationRate: Decimal; // actual time working vs available
  
  // Time-based
  periodStart: ISODate;
  periodEnd: ISODate;
}

// ============================================================================
// PROFESSIONAL AVAILABILITY
// ============================================================================

/** Available time slot for booking */
export interface AvailableSlot {
  date: ISODate;
  startTime: string; // HH:mm
  endTime: string;
  professionalId: UUID;
  professionalName: string;
  isPreferred?: boolean;
}

// ============================================================================
// MAIN PROFESSIONAL INTERFACE
// ============================================================================

/** Complete professional entity */
export interface Professional extends AuditFields {
  id: UUID;
  tenantId: UUID;
  userId?: UUID; // Linked user account
  
  // Basic info
  code: string; // Unique per tenant (e.g., PRO-00001)
  firstName: string;
  lastName: string;
  displayName?: string; // Professional name
  fullName: string;
  
  // Avatar & photo
  avatarUrl?: string;
  photoUrl?: string;
  
  // Contact
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Documents
  cpf: string; // Encrypted
  rg?: string;
  
  // Personal
  birthDate: ISODate;
  gender: Gender;
  
  // Address
  address?: Address;
  
  // Role & employment
  role: ProfessionalRole;
  level: ProfessionalLevel;
  employmentType: EmploymentType;
  hireDate: ISODate;
  terminationDate?: ISODate;
  department?: string;
  position?: string;
  
  // Specialties & services
  specialties: string[];
  bio?: string;
  serviceIds: UUID[];
  allowAllServices: boolean;
  
  // Skills & certifications
  skills: ProfessionalSkill[];
  certifications: ProfessionalCertification[];
  
  // Schedule
  schedules: WeekSchedule[];
  activeScheduleId: UUID;
  exceptions: ScheduleException[];
  breaks: BreakConfig[];
  
  // Commission
  commission: ProfessionalCommission;
  
  // Goals
  goals: ProfessionalGoal[];
  
  // Documents
  documents: ProfessionalDocument[];
  
  // Online booking
  onlineBooking: {
    isVisible: boolean;
    showPhoto: boolean;
    showBio: boolean;
    showRating: boolean;
    acceptsNewClients: boolean;
  };
  
  // Metrics
  metrics: ProfessionalMetrics;
  
  // Color for calendar
  calendarColor: string;
  
  // Units/locations where they work
  unitIds: UUID[];
  primaryUnitId?: UUID;
  
  // Permissions override
  permissions?: string[];
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Status
  status: EntityStatus;
  statusReason?: string;
  
  // Soft delete
  deletedAt?: ISODateTime;
}

// ============================================================================
// PROFESSIONAL LIST ITEM
// ============================================================================

/** Simplified professional for list views */
export interface ProfessionalListItem {
  id: UUID;
  code: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  role: ProfessionalRole;
  level: ProfessionalLevel;
  employmentType: EmploymentType;
  specialties: string[];
  serviceCount: number;
  averageRating: Decimal;
  reviewCount: number;
  calendarColor: string;
  status: EntityStatus;
}

// ============================================================================
// PROFESSIONAL FILTERS
// ============================================================================

/** Professional filter options */
export interface ProfessionalFilters {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  role?: ProfessionalRole | ProfessionalRole[];
  level?: ProfessionalLevel | ProfessionalLevel[];
  employmentType?: EmploymentType | EmploymentType[];
  specialty?: string[];
  serviceId?: UUID;
  unitId?: UUID;
  hasActiveSchedule?: boolean;
  onlineBookingVisible?: boolean;
  hireDateFrom?: ISODate;
  hireDateTo?: ISODate;
}

// ============================================================================
// PROFESSIONAL FORM DATA
// ============================================================================

/** Data for creating a professional */
export interface CreateProfessionalData {
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  phone: string;
  cpf: string;
  rg?: string;
  birthDate: ISODate;
  gender: Gender;
  address?: Omit<Address, 'id'>;
  
  role: ProfessionalRole;
  level?: ProfessionalLevel;
  employmentType: EmploymentType;
  hireDate: ISODate;
  department?: string;
  position?: string;
  
  specialties?: string[];
  bio?: string;
  serviceIds?: UUID[];
  allowAllServices?: boolean;
  
  // Commission
  commissionModel?: CommissionModel;
  serviceCommissionPercentage?: Decimal;
  productCommissionPercentage?: Decimal;
  
  // Schedule
  defaultSchedule?: Omit<WeekSchedule, 'id'>[];
  
  // Online booking
  onlineBookingVisible?: boolean;
  acceptsNewClients?: boolean;
  
  calendarColor?: string;
  unitIds?: UUID[];
  primaryUnitId?: UUID;
  
  customFields?: Record<string, unknown>;
}

/** Data for updating a professional */
export interface UpdateProfessionalData extends Partial<CreateProfessionalData> {
  status?: EntityStatus;
  statusReason?: string;
  terminationDate?: ISODate;
  avatarUrl?: string;
}

// ============================================================================
// SCHEDULE MANAGEMENT
// ============================================================================

/** Create schedule exception */
export interface CreateScheduleExceptionData {
  professionalId: UUID;
  type: ScheduleExceptionType;
  title: string;
  description?: string;
  startDate: ISODate;
  endDate: ISODate;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  isRecurring?: boolean;
  recurringPattern?: string;
}

/** Available slots request */
export interface AvailableSlotsRequest {
  professionalId?: UUID;
  serviceId: UUID;
  startDate: ISODate;
  endDate: ISODate;
  unitId?: UUID;
  excludeAppointmentId?: UUID;
}
