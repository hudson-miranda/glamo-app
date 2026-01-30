// ============================================
// APP CONSTANTS
// ============================================

export const APP_NAME = 'Glamo';
export const APP_DESCRIPTION = 'Plataforma de gestão para salões de beleza e clínicas de estética';
export const APP_URL = 'https://glamo.app';

// ============================================
// APPOINTMENT CONSTANTS
// ============================================

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  WAITING: 'Aguardando',
  IN_PROGRESS: 'Em Atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#fbbf24',
  CONFIRMED: '#3b82f6',
  WAITING: '#a855f7',
  IN_PROGRESS: '#f97316',
  COMPLETED: '#22c55e',
  CANCELLED: '#6b7280',
  NO_SHOW: '#ef4444',
};

// ============================================
// USER ROLE CONSTANTS
// ============================================

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  PROFESSIONAL: 'PROFESSIONAL',
  RECEPTIONIST: 'RECEPTIONIST',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  PROFESSIONAL: 'Profissional',
  RECEPTIONIST: 'Recepcionista',
};

// ============================================
// PAYMENT CONSTANTS
// ============================================

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  PIX: 'PIX',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência Bancária',
};

// ============================================
// PLAN CONSTANTS
// ============================================

export const PLANS = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

export const PLAN_LIMITS = {
  STARTER: {
    maxUsers: 3,
    maxCustomers: 500,
    maxAppointmentsPerMonth: 300,
  },
  PROFESSIONAL: {
    maxUsers: 10,
    maxCustomers: 2000,
    maxAppointmentsPerMonth: 1000,
  },
  BUSINESS: {
    maxUsers: 25,
    maxCustomers: 10000,
    maxAppointmentsPerMonth: 5000,
  },
  ENTERPRISE: {
    maxUsers: -1,
    maxCustomers: -1,
    maxAppointmentsPerMonth: -1,
  },
} as const;

// ============================================
// TIME CONSTANTS
// ============================================

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
] as const;

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

// ============================================
// LOCALE CONSTANTS
// ============================================

export const DEFAULT_LOCALE = 'pt-BR';
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
export const DEFAULT_CURRENCY = 'BRL';

// ============================================
// PAGINATION CONSTANTS
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const NOTES_MAX_LENGTH = 2000;

// ============================================
// LOYALTY TIERS
// ============================================

export const LOYALTY_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  DIAMOND: 'DIAMOND',
} as const;

export const LOYALTY_TIER_POINTS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  DIAMOND: 15000,
};

export const LOYALTY_TIER_COLORS: Record<string, string> = {
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  DIAMOND: '#b9f2ff',
};
