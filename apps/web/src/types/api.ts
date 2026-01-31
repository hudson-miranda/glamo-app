/**
 * GLAMO - API Response Types
 * Standard API response structures and utilities
 * 
 * @version 1.0.0
 * @description Consistent API response handling
 */

import { UUID, PaginatedResponse, PaginationParams } from './base';

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

/** Common HTTP status codes */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Error code categories */
export type ErrorCategory = 
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'INTEGRATION'
  | 'RATE_LIMIT'
  | 'SERVER';

/** Field validation error */
export interface FieldError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/** API error detail */
export interface ApiErrorDetail {
  code: string;
  message: string;
  category: ErrorCategory;
  field?: string;
  details?: Record<string, unknown>;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    statusCode: HttpStatusCode;
    timestamp: string;
    path?: string;
    requestId?: string;
    details?: ApiErrorDetail[];
    fieldErrors?: FieldError[];
  };
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/** Base success response */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/** Paginated success response */
export interface ApiPaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/** List response with optional metadata */
export interface ApiListResponse<T> extends ApiSuccessResponse<T[]> {
  count: number;
}

/** Create response */
export interface ApiCreateResponse<T> extends ApiSuccessResponse<T> {
  created: true;
}

/** Update response */
export interface ApiUpdateResponse<T> extends ApiSuccessResponse<T> {
  updated: true;
}

/** Delete response */
export interface ApiDeleteResponse {
  success: true;
  deleted: true;
  id: UUID;
}

/** Bulk operation response */
export interface ApiBulkResponse {
  success: true;
  results: {
    succeeded: number;
    failed: number;
    items: {
      id: UUID;
      success: boolean;
      error?: string;
    }[];
  };
}

// ============================================================================
// API RESPONSE UNION
// ============================================================================

/** Union type for any API response */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiError;

// ============================================================================
// REQUEST TYPES
// ============================================================================

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort parameter */
export interface SortParam {
  field: string;
  direction: SortDirection;
}

/** Standard list query parameters */
export interface ListQueryParams extends PaginationParams {
  search?: string;
  sort?: SortParam[];
  include?: string[];
  fields?: string[];
}

/** Date range filter */
export interface DateRangeFilter {
  from?: string;
  to?: string;
}

/** Numeric range filter */
export interface NumericRangeFilter {
  min?: number;
  max?: number;
}

// ============================================================================
// MUTATION RESULT
// ============================================================================

/** Mutation result for hooks */
export interface MutationResult<T> {
  data?: T;
  error?: ApiError['error'];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

// ============================================================================
// CACHE TAGS
// ============================================================================

/** Cache tag types for invalidation */
export const CacheTags = {
  CUSTOMERS: 'customers',
  CUSTOMER: (id: UUID) => `customer:${id}`,
  SERVICES: 'services',
  SERVICE: (id: UUID) => `service:${id}`,
  PROFESSIONALS: 'professionals',
  PROFESSIONAL: (id: UUID) => `professional:${id}`,
  PRODUCTS: 'products',
  PRODUCT: (id: UUID) => `product:${id}`,
  SUPPLIERS: 'suppliers',
  SUPPLIER: (id: UUID) => `supplier:${id}`,
  CATEGORIES: 'categories',
  CATEGORY: (id: UUID) => `category:${id}`,
  APPOINTMENTS: 'appointments',
  APPOINTMENT: (id: UUID) => `appointment:${id}`,
  TRANSACTIONS: 'transactions',
  TRANSACTION: (id: UUID) => `transaction:${id}`,
  COMMISSIONS: 'commissions',
  COMMISSION: (id: UUID) => `commission:${id}`,
  STOCK: 'stock',
  STOCK_MOVEMENTS: 'stock-movements',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

/** API endpoint configuration */
export const ApiEndpoints = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    GET: (id: UUID) => `/customers/${id}`,
    UPDATE: (id: UUID) => `/customers/${id}`,
    DELETE: (id: UUID) => `/customers/${id}`,
    SEARCH: '/customers/search',
    SEGMENTS: '/customers/segments',
    DUPLICATES: '/customers/duplicates',
    MERGE: '/customers/merge',
    IMPORT: '/customers/import',
    EXPORT: '/customers/export',
  },
  
  // Services
  SERVICES: {
    LIST: '/services',
    CREATE: '/services',
    GET: (id: UUID) => `/services/${id}`,
    UPDATE: (id: UUID) => `/services/${id}`,
    DELETE: (id: UUID) => `/services/${id}`,
    CATEGORIES: '/services/categories',
    REORDER: '/services/reorder',
  },
  
  // Professionals
  PROFESSIONALS: {
    LIST: '/professionals',
    CREATE: '/professionals',
    GET: (id: UUID) => `/professionals/${id}`,
    UPDATE: (id: UUID) => `/professionals/${id}`,
    DELETE: (id: UUID) => `/professionals/${id}`,
    SCHEDULE: (id: UUID) => `/professionals/${id}/schedule`,
    AVAILABILITY: (id: UUID) => `/professionals/${id}/availability`,
    COMMISSIONS: (id: UUID) => `/professionals/${id}/commissions`,
    GOALS: (id: UUID) => `/professionals/${id}/goals`,
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
    GET: (id: UUID) => `/products/${id}`,
    UPDATE: (id: UUID) => `/products/${id}`,
    DELETE: (id: UUID) => `/products/${id}`,
    CATEGORIES: '/products/categories',
    STOCK: (id: UUID) => `/products/${id}/stock`,
    MOVEMENTS: (id: UUID) => `/products/${id}/movements`,
    ALERTS: '/products/alerts',
  },
  
  // Suppliers
  SUPPLIERS: {
    LIST: '/suppliers',
    CREATE: '/suppliers',
    GET: (id: UUID) => `/suppliers/${id}`,
    UPDATE: (id: UUID) => `/suppliers/${id}`,
    DELETE: (id: UUID) => `/suppliers/${id}`,
    PRODUCTS: (id: UUID) => `/suppliers/${id}/products`,
    ORDERS: (id: UUID) => `/suppliers/${id}/orders`,
  },
  
  // Categories
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    GET: (id: UUID) => `/categories/${id}`,
    UPDATE: (id: UUID) => `/categories/${id}`,
    DELETE: (id: UUID) => `/categories/${id}`,
    REORDER: '/categories/reorder',
    TREE: '/categories/tree',
  },
  
  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    CREATE: '/appointments',
    GET: (id: UUID) => `/appointments/${id}`,
    UPDATE: (id: UUID) => `/appointments/${id}`,
    DELETE: (id: UUID) => `/appointments/${id}`,
    CANCEL: (id: UUID) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id: UUID) => `/appointments/${id}/reschedule`,
    COMPLETE: (id: UUID) => `/appointments/${id}/complete`,
    CHECK_IN: (id: UUID) => `/appointments/${id}/check-in`,
    CALENDAR: '/appointments/calendar',
    AVAILABLE_SLOTS: '/appointments/available-slots',
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    GET: (id: UUID) => `/transactions/${id}`,
    UPDATE: (id: UUID) => `/transactions/${id}`,
    DELETE: (id: UUID) => `/transactions/${id}`,
    PAY: (id: UUID) => `/transactions/${id}/pay`,
    CATEGORIES: '/transactions/categories',
    CASH_REGISTER: '/transactions/cash-register',
    REPORTS: '/transactions/reports',
  },
  
  // Commissions
  COMMISSIONS: {
    LIST: '/commissions',
    CREATE: '/commissions',
    GET: (id: UUID) => `/commissions/${id}`,
    APPROVE: '/commissions/approve',
    PAY: '/commissions/pay',
    RULES: '/commissions/rules',
    SUMMARY: '/commissions/summary',
  },
  
  // Stock
  STOCK: {
    MOVEMENTS: '/stock/movements',
    CREATE_MOVEMENT: '/stock/movements',
    ALERTS: '/stock/alerts',
    COUNTS: '/stock/counts',
    CREATE_COUNT: '/stock/counts',
    LOTS: '/stock/lots',
    TRANSFER: '/stock/transfer',
  },
} as const;

// ============================================================================
// QUERY KEYS
// ============================================================================

/** Query key factory for React Query */
export const QueryKeys = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...QueryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.customers.lists(), filters] as const,
    details: () => [...QueryKeys.customers.all, 'detail'] as const,
    detail: (id: UUID) => [...QueryKeys.customers.details(), id] as const,
  },
  services: {
    all: ['services'] as const,
    lists: () => [...QueryKeys.services.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.services.lists(), filters] as const,
    details: () => [...QueryKeys.services.all, 'detail'] as const,
    detail: (id: UUID) => [...QueryKeys.services.details(), id] as const,
  },
  professionals: {
    all: ['professionals'] as const,
    lists: () => [...QueryKeys.professionals.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.professionals.lists(), filters] as const,
    details: () => [...QueryKeys.professionals.all, 'detail'] as const,
    detail: (id: UUID) => [...QueryKeys.professionals.details(), id] as const,
    schedule: (id: UUID) => [...QueryKeys.professionals.detail(id), 'schedule'] as const,
    availability: (id: UUID, params: Record<string, unknown>) => 
      [...QueryKeys.professionals.detail(id), 'availability', params] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => [...QueryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.products.lists(), filters] as const,
    details: () => [...QueryKeys.products.all, 'detail'] as const,
    detail: (id: UUID) => [...QueryKeys.products.details(), id] as const,
    stock: (id: UUID) => [...QueryKeys.products.detail(id), 'stock'] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...QueryKeys.suppliers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.suppliers.lists(), filters] as const,
    details: () => [...QueryKeys.suppliers.all, 'detail'] as const,
    detail: (id: UUID) => [...QueryKeys.suppliers.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...QueryKeys.categories.all, 'list'] as const,
    list: (domain: string) => [...QueryKeys.categories.lists(), domain] as const,
    tree: (domain: string) => [...QueryKeys.categories.all, 'tree', domain] as const,
    detail: (id: UUID) => [...QueryKeys.categories.all, 'detail', id] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...QueryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.appointments.lists(), filters] as const,
    calendar: (params: Record<string, unknown>) => [...QueryKeys.appointments.all, 'calendar', params] as const,
    detail: (id: UUID) => [...QueryKeys.appointments.all, 'detail', id] as const,
    slots: (params: Record<string, unknown>) => [...QueryKeys.appointments.all, 'slots', params] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...QueryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.transactions.lists(), filters] as const,
    detail: (id: UUID) => [...QueryKeys.transactions.all, 'detail', id] as const,
    cashRegister: () => [...QueryKeys.transactions.all, 'cash-register'] as const,
    reports: (params: Record<string, unknown>) => [...QueryKeys.transactions.all, 'reports', params] as const,
  },
  commissions: {
    all: ['commissions'] as const,
    lists: () => [...QueryKeys.commissions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QueryKeys.commissions.lists(), filters] as const,
    detail: (id: UUID) => [...QueryKeys.commissions.all, 'detail', id] as const,
    summary: (params: Record<string, unknown>) => [...QueryKeys.commissions.all, 'summary', params] as const,
  },
  stock: {
    all: ['stock'] as const,
    movements: (filters: Record<string, unknown>) => [...QueryKeys.stock.all, 'movements', filters] as const,
    alerts: () => [...QueryKeys.stock.all, 'alerts'] as const,
    counts: () => [...QueryKeys.stock.all, 'counts'] as const,
  },
} as const;
