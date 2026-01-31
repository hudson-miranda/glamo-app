/**
 * GLAMO - Customer Types
 * Complete customer/client type definitions per RF-CRM-001 to RF-CRM-008
 * 
 * @version 1.0.0
 * @description Supports all business segments with dynamic fields
 */

import {
  UUID,
  Decimal,
  ISODate,
  ISODateTime,
  EntityStatus,
  ContactChannel,
  Gender,
  Address,
  Tag,
  AuditFields,
  FileReference,
  ImageFile,
  Metadata,
  BusinessSegment,
} from './base';
import { SegmentCustomerFields } from './segments';

// ============================================================================
// CUSTOMER SOURCE & ORIGIN
// ============================================================================

/** How the customer found the business */
export type CustomerSource =
  | 'website'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'referral'
  | 'walk_in'
  | 'event'
  | 'partnership'
  | 'advertising'
  | 'other';

// ============================================================================
// CUSTOMER LOYALTY
// ============================================================================

/** Loyalty tier levels */
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';

/** Customer loyalty information */
export interface CustomerLoyalty {
  tier: LoyaltyTier;
  pointsBalance: number;
  pointsLifetime: number;
  tierAchievedAt: ISODateTime;
  tierExpiresAt?: ISODateTime;
  referralCode: string;
  referralCount: number;
  referralConversions: number;
}

// ============================================================================
// CUSTOMER METRICS
// ============================================================================

/** Customer behavioral metrics */
export interface CustomerMetrics {
  totalVisits: number;
  totalSpent: Decimal;
  averageTicket: Decimal;
  firstVisitAt?: ISODateTime;
  lastVisitAt?: ISODateTime;
  daysSinceLastVisit?: number;
  noShowCount: number;
  noShowRate: Decimal;
  cancellationCount: number;
  cancellationRate: Decimal;
  ltvScore: Decimal;
  churnRiskScore: number; // 0-100
  npsScore?: number; // -100 to 100
  averageRating?: Decimal;
  reviewCount: number;
}

// ============================================================================
// CUSTOMER PREFERENCES
// ============================================================================

/** Customer notification preferences */
export interface CustomerNotificationPreferences {
  channels: {
    channel: ContactChannel;
    enabled: boolean;
    types: ('transactional' | 'marketing' | 'reminder')[];
  }[];
  quietHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  frequency: 'all' | 'important_only' | 'minimal';
}

/** Customer preferences */
export interface CustomerPreferences {
  preferredProfessionalId?: UUID;
  preferredUnitId?: UUID;
  preferredContactChannel: ContactChannel;
  preferredDays?: number[]; // 0-6
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  notifications: CustomerNotificationPreferences;
  language: string;
}

// ============================================================================
// ANAMNESIS
// ============================================================================

/** Anamnesis response structure */
export interface AnamnesisResponse {
  questionId: UUID;
  question: string;
  answer: string | boolean | string[] | number;
  notes?: string;
}

/** Anamnesis record */
export interface Anamnesis {
  id: UUID;
  customerId: UUID;
  templateId: UUID;
  templateName: string;
  type: 'hair' | 'skin' | 'health' | 'wellness' | 'tattoo' | 'pet' | 'general';
  responses: AnamnesisResponse[];
  signatureUrl?: string;
  signedAt?: ISODateTime;
  signatureIp?: string;
  consentGiven: boolean;
  consentText: string;
  version: number;
  createdAt: ISODateTime;
  createdBy: UUID;
  updatedAt: ISODateTime;
}

// ============================================================================
// CUSTOMER PHOTOS
// ============================================================================

/** Photo category */
export type PhotoCategory = 'before' | 'during' | 'after' | 'reference' | 'document';

/** Customer photo record */
export interface CustomerPhoto extends ImageFile {
  customerId: UUID;
  appointmentId?: UUID;
  serviceId?: UUID;
  category: PhotoCategory;
  tags: string[];
  isPublic: boolean;
  portfolioConsent: boolean;
  takenAt: ISODateTime;
  takenBy?: UUID;
  notes?: string;
}

// ============================================================================
// CUSTOMER COMMUNICATION
// ============================================================================

/** Communication direction */
export type CommunicationDirection = 'inbound' | 'outbound';

/** Communication type */
export type CommunicationType = 'reminder' | 'marketing' | 'transactional' | 'manual' | 'automated';

/** Communication status */
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'replied';

/** Communication record */
export interface CustomerCommunication {
  id: UUID;
  customerId: UUID;
  channel: ContactChannel;
  direction: CommunicationDirection;
  type: CommunicationType;
  templateId?: UUID;
  subject?: string;
  content: string;
  status: CommunicationStatus;
  sentAt?: ISODateTime;
  deliveredAt?: ISODateTime;
  readAt?: ISODateTime;
  repliedAt?: ISODateTime;
  errorMessage?: string;
  metadata?: Metadata;
}

// ============================================================================
// CUSTOMER NOTES
// ============================================================================

/** Note type */
export type NoteType = 'general' | 'service' | 'preference' | 'alert' | 'internal';

/** Customer note */
export interface CustomerNote {
  id: UUID;
  customerId: UUID;
  type: NoteType;
  content: string;
  isPinned: boolean;
  isPrivate: boolean;
  appointmentId?: UUID;
  createdAt: ISODateTime;
  createdBy: UUID;
  createdByName: string;
  updatedAt?: ISODateTime;
}

// ============================================================================
// LEAD MANAGEMENT (RF-CRM-006)
// ============================================================================

/** Lead status */
export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'scheduled'
  | 'converted'
  | 'lost';

/** Lead information */
export interface LeadInfo {
  status: LeadStatus;
  source: CustomerSource;
  sourceDetail?: string;
  assignedTo?: UUID;
  score: number; // 0-100
  interest: string[];
  nextFollowUp?: ISODateTime;
  lostReason?: string;
  convertedAt?: ISODateTime;
  notes: string;
}

// ============================================================================
// REFERRAL (RF-CRM-008)
// ============================================================================

/** Referral record */
export interface CustomerReferral {
  id: UUID;
  referrerId: UUID;
  referrerName: string;
  referredId: UUID;
  referredName: string;
  status: 'pending' | 'validated' | 'rewarded' | 'expired';
  referralCode: string;
  referredAt: ISODateTime;
  validatedAt?: ISODateTime;
  validatedByAppointmentId?: UUID;
  rewardType?: 'points' | 'credit' | 'discount' | 'free_service';
  rewardValue?: Decimal;
  rewardedAt?: ISODateTime;
}

// ============================================================================
// MAIN CUSTOMER INTERFACE
// ============================================================================

/** Complete customer entity (RF-CRM-001) */
export interface Customer extends AuditFields {
  id: UUID;
  tenantId: UUID;
  
  // Identification
  code: string; // Unique per tenant (e.g., CLI-00001)
  firstName: string;
  lastName: string;
  displayName?: string; // Nickname
  fullName: string; // Computed: firstName + lastName
  
  // Avatar
  avatarUrl?: string;
  
  // Contact
  email?: string;
  emailVerified: boolean;
  phonePrimary: string;
  phonePrimaryVerified: boolean;
  phoneSecondary?: string;
  preferredContactChannel: ContactChannel;
  
  // Documents
  cpf?: string; // Encrypted at rest
  rg?: string;
  
  // Personal
  birthDate?: ISODate;
  gender: Gender;
  
  // Address
  addresses: Address[];
  
  // Origin & Marketing
  source: CustomerSource;
  sourceDetail?: string;
  referredById?: UUID;
  referredByName?: string;
  acceptsMarketing: boolean;
  lgpdConsentAt?: ISODateTime;
  lgpdConsentVersion?: string;
  
  // Preferences
  preferences: CustomerPreferences;
  
  // Tags
  tags: Tag[];
  
  // Notes
  notes?: string;
  alertNotes?: string; // Important alerts shown on appointments
  
  // Segment-specific fields
  segment: BusinessSegment;
  segmentFields: SegmentCustomerFields;
  
  // Custom fields (tenant-defined)
  customFields: Record<string, unknown>;
  
  // Loyalty
  loyalty: CustomerLoyalty;
  
  // Metrics
  metrics: CustomerMetrics;
  
  // Lead (if not yet a customer)
  lead?: LeadInfo;
  
  // Status
  status: EntityStatus;
  blockedReason?: string;
  
  // Relations (IDs for lazy loading)
  appointmentIds?: UUID[];
  transactionIds?: UUID[];
  anamnesisIds?: UUID[];
  photoIds?: UUID[];
  communicationIds?: UUID[];
  noteIds?: UUID[];
}

// ============================================================================
// CUSTOMER LIST ITEM (Optimized for lists)
// ============================================================================

/** Simplified customer for list views */
export interface CustomerListItem {
  id: UUID;
  code: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  phonePrimary: string;
  totalVisits: number;
  lastVisitAt?: ISODateTime;
  totalSpent: Decimal;
  loyaltyTier: LoyaltyTier;
  tags: Tag[];
  status: EntityStatus;
}

// ============================================================================
// CUSTOMER FILTERS
// ============================================================================

/** Customer filter options */
export interface CustomerFilters {
  search?: string;
  status?: EntityStatus | EntityStatus[];
  tags?: string[];
  loyaltyTier?: LoyaltyTier | LoyaltyTier[];
  source?: CustomerSource | CustomerSource[];
  gender?: Gender | Gender[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  acceptsMarketing?: boolean;
  
  // Date filters
  birthDateFrom?: ISODate;
  birthDateTo?: ISODate;
  createdAtFrom?: ISODateTime;
  createdAtTo?: ISODateTime;
  lastVisitFrom?: ISODateTime;
  lastVisitTo?: ISODateTime;
  
  // Behavioral filters
  minVisits?: number;
  maxVisits?: number;
  minSpent?: Decimal;
  maxSpent?: Decimal;
  daysSinceLastVisit?: number;
  churnRiskMin?: number;
  churnRiskMax?: number;
  
  // Professional preference
  preferredProfessionalId?: UUID;
  
  // Segment filters
  segment?: BusinessSegment;
}

// ============================================================================
// CUSTOMER SEGMENTS (RF-CRM-005)
// ============================================================================

/** Segment operator */
export type SegmentOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

/** Segment condition */
export interface SegmentCondition {
  field: string;
  operator: SegmentOperator;
  value: unknown;
  logicalOperator?: 'and' | 'or';
}

/** Customer segment definition */
export interface CustomerSegment {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isSystem: boolean; // Pre-defined by system
  isActive: boolean;
  conditions: SegmentCondition[];
  customerCount: number;
  lastCalculatedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Pre-defined system segments */
export const SYSTEM_SEGMENTS: Omit<CustomerSegment, 'id' | 'tenantId' | 'customerCount' | 'lastCalculatedAt' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'VIP',
    description: 'Top 10% clientes por valor gasto',
    color: '#FFD700',
    icon: 'Crown',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'metrics.totalSpent', operator: 'greater_than', value: 'percentile:90' },
    ],
  },
  {
    name: 'Em Risco',
    description: 'Clientes sem visita há mais de 60 dias',
    color: '#FF6B6B',
    icon: 'AlertTriangle',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'metrics.daysSinceLastVisit', operator: 'greater_than', value: 60 },
    ],
  },
  {
    name: 'Novos',
    description: 'Clientes do primeiro mês',
    color: '#4ECDC4',
    icon: 'UserPlus',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'createdAt', operator: 'greater_than', value: 'days:-30' },
    ],
  },
  {
    name: 'Aniversariantes',
    description: 'Aniversariantes da semana',
    color: '#FF69B4',
    icon: 'Cake',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'birthDate', operator: 'between', value: ['days:0', 'days:7'] },
    ],
  },
  {
    name: 'Dormentes',
    description: 'Clientes sem visita há mais de 90 dias',
    color: '#95A5A6',
    icon: 'Moon',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'metrics.daysSinceLastVisit', operator: 'greater_than', value: 90 },
    ],
  },
  {
    name: 'Frequentes',
    description: 'Clientes com 4+ visitas no último mês',
    color: '#27AE60',
    icon: 'TrendingUp',
    isSystem: true,
    isActive: true,
    conditions: [
      { field: 'metrics.visitsLast30Days', operator: 'greater_than', value: 3 },
    ],
  },
];

// ============================================================================
// DUPLICATE DETECTION (RF-CRM-007)
// ============================================================================

/** Duplicate match reason */
export type DuplicateMatchReason = 'phone' | 'email' | 'cpf' | 'similar_name';

/** Potential duplicate */
export interface PotentialDuplicate {
  customerId1: UUID;
  customerId2: UUID;
  matchReasons: DuplicateMatchReason[];
  matchScore: number; // 0-100
  customer1Summary: CustomerListItem;
  customer2Summary: CustomerListItem;
  detectedAt: ISODateTime;
  resolvedAt?: ISODateTime;
  resolution?: 'merged' | 'not_duplicate' | 'ignored';
  resolvedBy?: UUID;
}

/** Merge request */
export interface CustomerMergeRequest {
  primaryCustomerId: UUID;
  secondaryCustomerId: UUID;
  fieldsToKeepFromSecondary: string[];
  mergeHistory: boolean;
  mergePhotos: boolean;
  mergeAnamnesis: boolean;
  mergeCommunications: boolean;
}

// ============================================================================
// CUSTOMER FORM DATA
// ============================================================================

/** Data for creating a customer */
export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  preferredContactChannel?: ContactChannel;
  cpf?: string;
  rg?: string;
  birthDate?: ISODate;
  gender?: Gender;
  addresses?: Omit<Address, 'id'>[];
  source?: CustomerSource;
  sourceDetail?: string;
  referredById?: UUID;
  acceptsMarketing?: boolean;
  preferredProfessionalId?: UUID;
  tags?: string[];
  notes?: string;
  segmentFields?: SegmentCustomerFields;
  customFields?: Record<string, unknown>;
}

/** Data for updating a customer */
export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  status?: EntityStatus;
  blockedReason?: string;
  alertNotes?: string;
}
