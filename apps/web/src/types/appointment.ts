/**
 * GLAMO - Appointment Types
 * Complete appointment/scheduling type definitions
 * 
 * @version 1.0.0
 * @description Full appointment lifecycle with dependencies
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
// APPOINTMENT STATUS
// ============================================================================

/** Appointment status */
export type AppointmentStatus = 
  | 'scheduled'        // Agendado
  | 'confirmed'        // Confirmado
  | 'waiting'          // Aguardando (no local)
  | 'in_progress'      // Em atendimento
  | 'completed'        // Concluído
  | 'cancelled'        // Cancelado
  | 'no_show'          // Não compareceu
  | 'rescheduled';     // Reagendado

/** Appointment origin */
export type AppointmentOrigin = 
  | 'online'           // Agendamento online
  | 'phone'            // Telefone
  | 'whatsapp'         // WhatsApp
  | 'walk_in'          // Sem agendamento
  | 'app'              // App do cliente
  | 'internal';        // Agendamento interno

// ============================================================================
// APPOINTMENT SERVICE
// ============================================================================

/** Service within an appointment */
export interface AppointmentService {
  id: UUID;
  appointmentId: UUID;
  serviceId: UUID;
  serviceName: string;
  serviceCode: string;
  
  professionalId: UUID;
  professionalName: string;
  
  // Time
  startTime: ISODateTime;
  endTime: ISODateTime;
  durationMinutes: number;
  
  // Pricing
  originalPrice: Decimal;
  discount: Decimal;
  discountReason?: string;
  finalPrice: Decimal;
  
  // Commission
  commissionPercentage: Decimal;
  commissionAmount: Decimal;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Consumables used
  consumables: AppointmentConsumable[];
  
  // Rating
  rating?: number;
  reviewId?: UUID;
  
  order: number;
}

// ============================================================================
// APPOINTMENT CONSUMABLE
// ============================================================================

/** Consumable used in appointment */
export interface AppointmentConsumable {
  id: UUID;
  appointmentServiceId: UUID;
  productId: UUID;
  productName: string;
  productSku: string;
  
  quantity: Decimal;
  unitCost: Decimal;
  totalCost: Decimal;
  
  lotId?: UUID;
  lotNumber?: string;
  
  // For tracking stock movement
  stockMovementId?: UUID;
}

// ============================================================================
// APPOINTMENT PRODUCT SALE
// ============================================================================

/** Product sold during appointment */
export interface AppointmentProduct {
  id: UUID;
  appointmentId: UUID;
  productId: UUID;
  variantId?: UUID;
  productName: string;
  productSku: string;
  
  quantity: Decimal;
  originalPrice: Decimal;
  discount: Decimal;
  finalPrice: Decimal;
  
  // Commission
  professionalId?: UUID;
  professionalName?: string;
  commissionPercentage: Decimal;
  commissionAmount: Decimal;
  
  lotId?: UUID;
  stockMovementId?: UUID;
}

// ============================================================================
// APPOINTMENT PAYMENT
// ============================================================================

/** Payment applied to appointment */
export interface AppointmentPayment {
  id: UUID;
  appointmentId: UUID;
  transactionId: UUID;
  
  method: PaymentMethod;
  amount: Decimal;
  
  // For split payments
  installments?: number;
  installmentNumber?: number;
  
  // Card details (if applicable)
  cardBrand?: string;
  cardLastDigits?: string;
  authorizationCode?: string;
  
  // Pix details
  pixTransactionId?: string;
  
  status: PaymentStatus;
  paidAt?: ISODateTime;
  
  notes?: string;
}

// ============================================================================
// APPOINTMENT RECURRENCE
// ============================================================================

/** Recurrence pattern */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/** Recurrence configuration */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number; // Every X frequency
  daysOfWeek?: number[]; // For weekly
  dayOfMonth?: number; // For monthly
  endType: 'never' | 'after' | 'on_date';
  endAfterOccurrences?: number;
  endDate?: ISODate;
}

/** Recurring appointment series */
export interface AppointmentSeries {
  id: UUID;
  tenantId: UUID;
  customerId: UUID;
  
  recurrence: RecurrenceConfig;
  
  templateServiceIds: UUID[];
  templateProfessionalId: UUID;
  templateUnitId?: UUID;
  templateTime: string; // HH:mm
  
  appointmentIds: UUID[];
  
  startDate: ISODate;
  endDate?: ISODate;
  
  isActive: boolean;
  cancelledAt?: ISODateTime;
  cancelledBy?: UUID;
  
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// CANCELLATION
// ============================================================================

/** Cancellation reason type */
export type CancellationReasonType = 
  | 'customer_request'
  | 'professional_unavailable'
  | 'no_show'
  | 'rescheduled'
  | 'duplicate'
  | 'business_closed'
  | 'other';

/** Cancellation details */
export interface CancellationDetails {
  reason: CancellationReasonType;
  reasonDetails?: string;
  cancelledBy: 'customer' | 'professional' | 'system' | 'admin';
  cancelledById: UUID;
  cancelledAt: ISODateTime;
  
  // Penalty
  penaltyApplied: boolean;
  penaltyAmount?: Decimal;
  
  // Refund
  refundRequired: boolean;
  refundAmount?: Decimal;
  refundStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  refundedAt?: ISODateTime;
}

// ============================================================================
// APPOINTMENT REMINDER
// ============================================================================

/** Reminder type */
export type ReminderType = 'confirmation' | 'reminder' | 'followup' | 'review_request';

/** Reminder channel */
export type ReminderChannel = 'sms' | 'whatsapp' | 'email' | 'push';

/** Appointment reminder */
export interface AppointmentReminder {
  id: UUID;
  appointmentId: UUID;
  type: ReminderType;
  channel: ReminderChannel;
  scheduledFor: ISODateTime;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sentAt?: ISODateTime;
  deliveredAt?: ISODateTime;
  errorMessage?: string;
  response?: string;
  respondedAt?: ISODateTime;
}

// ============================================================================
// MAIN APPOINTMENT INTERFACE
// ============================================================================

/** Complete appointment entity */
export interface Appointment extends AuditFields {
  id: UUID;
  tenantId: UUID;
  unitId?: UUID;
  unitName?: string;
  
  // Identification
  code: string; // Unique per tenant (e.g., APT-00001)
  
  // Customer
  customerId: UUID;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatarUrl?: string;
  
  // Origin
  origin: AppointmentOrigin;
  bookedBy: 'customer' | 'professional' | 'admin';
  bookedById: UUID;
  
  // Schedule
  date: ISODate;
  startTime: ISODateTime;
  endTime: ISODateTime;
  totalDurationMinutes: number;
  
  // Services
  services: AppointmentService[];
  primaryServiceId: UUID;
  primaryServiceName: string;
  primaryProfessionalId: UUID;
  primaryProfessionalName: string;
  
  // Products sold
  products: AppointmentProduct[];
  
  // Pricing
  servicesTotal: Decimal;
  productsTotal: Decimal;
  subtotal: Decimal;
  discountTotal: Decimal;
  discountReason?: string;
  tipAmount: Decimal;
  total: Decimal;
  
  // Payment
  payments: AppointmentPayment[];
  paidAmount: Decimal;
  pendingAmount: Decimal;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  // Deposit
  depositRequired: boolean;
  depositAmount?: Decimal;
  depositPaidAt?: ISODateTime;
  depositPaymentId?: UUID;
  
  // Status
  status: AppointmentStatus;
  statusHistory: {
    status: AppointmentStatus;
    changedAt: ISODateTime;
    changedBy: UUID;
    notes?: string;
  }[];
  
  // Confirmation
  confirmationSentAt?: ISODateTime;
  confirmedAt?: ISODateTime;
  confirmedBy?: 'customer' | 'professional' | 'auto';
  
  // Arrival
  checkInAt?: ISODateTime;
  checkInBy?: UUID;
  
  // Completion
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
  
  // Cancellation
  cancellation?: CancellationDetails;
  
  // Recurrence
  isRecurring: boolean;
  seriesId?: UUID;
  recurrenceIndex?: number;
  
  // Related appointments
  originalAppointmentId?: UUID; // If rescheduled
  rescheduledToId?: UUID;
  
  // Reminders
  reminders: AppointmentReminder[];
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Custom fields
  customFields: Record<string, unknown>;
  
  // Rating & feedback
  overallRating?: number;
  feedbackSubmittedAt?: ISODateTime;
  reviewId?: UUID;
  
  // External references
  externalBookingId?: string;
  
  // Soft delete
  deletedAt?: ISODateTime;
}

// ============================================================================
// APPOINTMENT LIST ITEM
// ============================================================================

/** Simplified appointment for list/calendar views */
export interface AppointmentListItem {
  id: UUID;
  code: string;
  date: ISODate;
  startTime: ISODateTime;
  endTime: ISODateTime;
  
  customerId: UUID;
  customerName: string;
  customerPhone: string;
  customerAvatarUrl?: string;
  
  primaryServiceName: string;
  primaryProfessionalId: UUID;
  primaryProfessionalName: string;
  professionalColor: string;
  
  serviceCount: number;
  
  total: Decimal;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  status: AppointmentStatus;
  origin: AppointmentOrigin;
  
  isRecurring: boolean;
  hasNotes: boolean;
}

// ============================================================================
// APPOINTMENT FILTERS
// ============================================================================

/** Appointment filter options */
export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  dateFrom?: ISODate;
  dateTo?: ISODate;
  customerId?: UUID;
  professionalId?: UUID;
  serviceId?: UUID;
  unitId?: UUID;
  origin?: AppointmentOrigin | AppointmentOrigin[];
  paymentStatus?: ('pending' | 'partial' | 'paid' | 'refunded')[];
  isRecurring?: boolean;
}

// ============================================================================
// APPOINTMENT FORM DATA
// ============================================================================

/** Service data for booking */
export interface BookingServiceData {
  serviceId: UUID;
  professionalId: UUID;
  startTime?: ISODateTime;
  duration?: number;
  price?: Decimal;
  discount?: Decimal;
  discountReason?: string;
  notes?: string;
}

/** Data for creating an appointment */
export interface CreateAppointmentData {
  customerId: UUID;
  unitId?: UUID;
  date: ISODate;
  startTime: string; // HH:mm
  services: BookingServiceData[];
  notes?: string;
  internalNotes?: string;
  origin?: AppointmentOrigin;
  
  // Recurrence
  recurrence?: RecurrenceConfig;
  
  // Custom fields
  customFields?: Record<string, unknown>;
}

/** Data for updating an appointment */
export interface UpdateAppointmentData {
  date?: ISODate;
  startTime?: string;
  services?: BookingServiceData[];
  notes?: string;
  internalNotes?: string;
  customFields?: Record<string, unknown>;
}

/** Data for rescheduling */
export interface RescheduleAppointmentData {
  appointmentId: UUID;
  newDate: ISODate;
  newStartTime: string;
  newProfessionalId?: UUID;
  reason?: string;
  notifyCustomer?: boolean;
}

/** Data for cancellation */
export interface CancelAppointmentData {
  appointmentId: UUID;
  reason: CancellationReasonType;
  reasonDetails?: string;
  applyPenalty?: boolean;
  notifyCustomer?: boolean;
}

/** Data for completing appointment */
export interface CompleteAppointmentData {
  appointmentId: UUID;
  services: {
    serviceId: UUID;
    consumables: {
      productId: UUID;
      quantity: Decimal;
      lotId?: UUID;
    }[];
    notes?: string;
  }[];
  products?: {
    productId: UUID;
    variantId?: UUID;
    quantity: Decimal;
    discount?: Decimal;
    professionalId?: UUID;
  }[];
  tipAmount?: Decimal;
  discountTotal?: Decimal;
  discountReason?: string;
  payments: {
    method: PaymentMethod;
    amount: Decimal;
    installments?: number;
  }[];
  notes?: string;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

/** Calendar view type */
export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';

/** Calendar event */
export interface CalendarEvent {
  id: UUID;
  type: 'appointment' | 'block' | 'break' | 'exception';
  title: string;
  start: ISODateTime;
  end: ISODateTime;
  allDay: boolean;
  
  // For appointments
  appointment?: AppointmentListItem;
  
  // For blocks/exceptions
  blockReason?: string;
  
  // Display
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  
  // Permissions
  isEditable: boolean;
  isDeletable: boolean;
}
