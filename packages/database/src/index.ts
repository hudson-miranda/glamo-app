/**
 * GLAMO Database Package
 * 
 * Este pacote fornece:
 * - PrismaClient configurado para multi-tenant com RLS
 * - PrismaService para NestJS
 * - Tipos gerados pelo Prisma
 * - Utilitários de banco de dados
 */

// =====================================================
// PRISMA CLIENT & TYPES
// =====================================================

export * from '@prisma/client';
export { Prisma, PrismaClient } from '@prisma/client';

// Aliases para compatibilidade com código legado
export { TenantPlan as PlanType } from '@prisma/client';
export { TenantStatus as SubscriptionStatus } from '@prisma/client';

// =====================================================
// PRISMA SERVICE
// =====================================================

export {
  PrismaService,
  createPrismaService,
  createLoggingMiddleware,
  type TenantContext,
  type PrismaServiceOptions,
} from './prisma.service';

export { PrismaService as default } from './prisma.service';

// =====================================================
// HELPERS & UTILITIES
// =====================================================

/**
 * Gera um slug a partir de um nome
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata CEP para exibição
 */
export function formatZipCode(zipCode: string): string {
  if (!zipCode || zipCode.length !== 8) return zipCode;
  return zipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata moeda BRL
 */
export function formatCurrency(value: number | string, currency = 'BRL'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(numValue);
}

/**
 * Formata data para pt-BR
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions: Record<'short' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
  };

  return new Intl.DateTimeFormat('pt-BR', formatOptions[format]).format(dateObj);
}

/**
 * Formata hora para pt-BR
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[13])) return false;
  
  return true;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

// =====================================================
// DATABASE CONSTANTS
// =====================================================

export const DB_CONSTANTS = {
  MAX_VARCHAR_SHORT: 50,
  MAX_VARCHAR_MEDIUM: 100,
  MAX_VARCHAR_LONG: 255,
  MAX_VARCHAR_TEXT: 500,
  MAX_VARCHAR_URL: 500,
  MAX_PHONE_LENGTH: 20,
  MAX_CPF_LENGTH: 11,
  MAX_CNPJ_LENGTH: 14,
  MAX_CEP_LENGTH: 8,
  MAX_STATE_LENGTH: 2,
  MAX_COLOR_LENGTH: 7,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const TENANT_PLANS = {
  FREE: {
    name: 'Gratuito',
    maxProfessionals: 1,
    maxCustomers: 50,
    maxAppointmentsPerMonth: 30,
    features: ['basic_scheduling', 'customer_management'],
  },
  STARTER: {
    name: 'Inicial',
    maxProfessionals: 3,
    maxCustomers: 200,
    maxAppointmentsPerMonth: 150,
    features: ['basic_scheduling', 'customer_management', 'online_booking', 'whatsapp_notifications'],
  },
  PROFESSIONAL: {
    name: 'Profissional',
    maxProfessionals: 10,
    maxCustomers: 1000,
    maxAppointmentsPerMonth: 500,
    features: ['basic_scheduling', 'customer_management', 'online_booking', 'whatsapp_notifications', 'financial', 'reports', 'loyalty_program'],
  },
  BUSINESS: {
    name: 'Empresarial',
    maxProfessionals: 25,
    maxCustomers: 5000,
    maxAppointmentsPerMonth: 2000,
    features: ['all'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxProfessionals: -1, // Unlimited
    maxCustomers: -1,
    maxAppointmentsPerMonth: -1,
    features: ['all', 'api_access', 'custom_integrations', 'dedicated_support'],
  },
} as const;
