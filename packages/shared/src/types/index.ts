// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'PROFESSIONAL'
  | 'RECEPTIONIST';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// ============================================
// TENANT TYPES
// ============================================

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED';
export type PlanType = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  plan: PlanType;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  locale: string;
  businessHours: BusinessHours;
  appointmentSettings: AppointmentSettings;
}

export interface BusinessHours {
  [key: number]: { start: string; end: string } | null;
}

export interface AppointmentSettings {
  slotDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  allowOnlineBooking: boolean;
  requireConfirmation: boolean;
  cancellationPolicyHours: number;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  professionalId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  services: AppointmentService[];
  totalDuration: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentService {
  id: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  professionalId?: string;
}

// ============================================
// CUSTOMER TYPES
// ============================================

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  birthDate?: Date;
  gender?: 'M' | 'F' | 'OTHER';
  address?: Address;
  acceptsMarketing: boolean;
  tags: string[];
  notes?: string;
  metrics: CustomerMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  totalSpent: number;
  averageTicket: number;
  lastVisitAt?: Date;
}

// ============================================
// SERVICE TYPES
// ============================================

export interface Service {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PROFESSIONAL TYPES
// ============================================

export interface Professional {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  specialties: string[];
  services: string[];
  workingHours: BusinessHours;
  commissionRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethodType = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_TRANSFER';

export interface Transaction {
  id: string;
  tenantId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  paymentMethod: PaymentMethodType;
  customerId?: string;
  appointmentId?: string;
  description?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
