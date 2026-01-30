import { TenantPlan } from '@glamo/database';

/**
 * Features habilitadas por plano
 */
export interface TenantPlanFeatures {
  onlineBooking: boolean;
  marketing: boolean;
  loyalty: boolean;
  multiLocation: boolean;
  api: boolean;
  whatsapp: boolean;
  advancedReports: boolean;
  customBranding: boolean;
  smsNotifications: boolean;
  emailMarketing: boolean;
  inventory: boolean;
  commissions: boolean;
  financialReports: boolean;
  exportData: boolean;
  prioritySupport: boolean;
}

/**
 * Limites do plano
 */
export interface TenantPlanLimits {
  maxUsers: number;
  maxProfessionals: number;
  maxClients: number;
  maxAppointmentsPerMonth: number;
  maxServicesPerCategory: number;
  maxCategories: number;
  maxProducts: number;
  maxCampaignsPerMonth: number;
  maxStorageMB: number;
  maxLocations: number;
}

/**
 * Configuração completa do plano
 */
export interface TenantPlanConfig {
  limits: TenantPlanLimits;
  features: TenantPlanFeatures;
}

/**
 * Configurações padrão por tipo de plano
 */
export const PLAN_CONFIGS: Record<TenantPlan, TenantPlanConfig> = {
  [TenantPlan.FREE]: {
    limits: {
      maxUsers: 1,
      maxProfessionals: 1,
      maxClients: 50,
      maxAppointmentsPerMonth: 100,
      maxServicesPerCategory: 5,
      maxCategories: 3,
      maxProducts: 10,
      maxCampaignsPerMonth: 0,
      maxStorageMB: 100,
      maxLocations: 1,
    },
    features: {
      onlineBooking: true,
      marketing: false,
      loyalty: false,
      multiLocation: false,
      api: false,
      whatsapp: false,
      advancedReports: false,
      customBranding: false,
      smsNotifications: false,
      emailMarketing: false,
      inventory: false,
      commissions: false,
      financialReports: false,
      exportData: false,
      prioritySupport: false,
    },
  },

  [TenantPlan.STARTER]: {
    limits: {
      maxUsers: 3,
      maxProfessionals: 3,
      maxClients: 500,
      maxAppointmentsPerMonth: 500,
      maxServicesPerCategory: 15,
      maxCategories: 10,
      maxProducts: 50,
      maxCampaignsPerMonth: 2,
      maxStorageMB: 500,
      maxLocations: 1,
    },
    features: {
      onlineBooking: true,
      marketing: false,
      loyalty: false,
      multiLocation: false,
      api: false,
      whatsapp: true,
      advancedReports: false,
      customBranding: false,
      smsNotifications: false,
      emailMarketing: true,
      inventory: true,
      commissions: true,
      financialReports: true,
      exportData: false,
      prioritySupport: false,
    },
  },

  [TenantPlan.PROFESSIONAL]: {
    limits: {
      maxUsers: 10,
      maxProfessionals: 10,
      maxClients: 2000,
      maxAppointmentsPerMonth: 2000,
      maxServicesPerCategory: 50,
      maxCategories: 30,
      maxProducts: 200,
      maxCampaignsPerMonth: 10,
      maxStorageMB: 2000,
      maxLocations: 1,
    },
    features: {
      onlineBooking: true,
      marketing: true,
      loyalty: true,
      multiLocation: false,
      api: false,
      whatsapp: true,
      advancedReports: true,
      customBranding: true,
      smsNotifications: true,
      emailMarketing: true,
      inventory: true,
      commissions: true,
      financialReports: true,
      exportData: true,
      prioritySupport: false,
    },
  },

  [TenantPlan.BUSINESS]: {
    limits: {
      maxUsers: 30,
      maxProfessionals: 30,
      maxClients: 10000,
      maxAppointmentsPerMonth: 10000,
      maxServicesPerCategory: 100,
      maxCategories: 50,
      maxProducts: 1000,
      maxCampaignsPerMonth: 50,
      maxStorageMB: 10000,
      maxLocations: 5,
    },
    features: {
      onlineBooking: true,
      marketing: true,
      loyalty: true,
      multiLocation: true,
      api: true,
      whatsapp: true,
      advancedReports: true,
      customBranding: true,
      smsNotifications: true,
      emailMarketing: true,
      inventory: true,
      commissions: true,
      financialReports: true,
      exportData: true,
      prioritySupport: true,
    },
  },

  [TenantPlan.ENTERPRISE]: {
    limits: {
      maxUsers: -1, // Ilimitado
      maxProfessionals: -1,
      maxClients: -1,
      maxAppointmentsPerMonth: -1,
      maxServicesPerCategory: -1,
      maxCategories: -1,
      maxProducts: -1,
      maxCampaignsPerMonth: -1,
      maxStorageMB: -1,
      maxLocations: -1,
    },
    features: {
      onlineBooking: true,
      marketing: true,
      loyalty: true,
      multiLocation: true,
      api: true,
      whatsapp: true,
      advancedReports: true,
      customBranding: true,
      smsNotifications: true,
      emailMarketing: true,
      inventory: true,
      commissions: true,
      financialReports: true,
      exportData: true,
      prioritySupport: true,
    },
  },
};

/**
 * Nomes amigáveis dos planos
 */
export const PLAN_NAMES: Record<TenantPlan, string> = {
  [TenantPlan.FREE]: 'Gratuito',
  [TenantPlan.STARTER]: 'Inicial',
  [TenantPlan.PROFESSIONAL]: 'Profissional',
  [TenantPlan.BUSINESS]: 'Empresarial',
  [TenantPlan.ENTERPRISE]: 'Enterprise',
};

/**
 * Preços mensais dos planos (em centavos BRL)
 */
export const PLAN_PRICES: Record<TenantPlan, number> = {
  [TenantPlan.FREE]: 0,
  [TenantPlan.STARTER]: 4990, // R$ 49,90
  [TenantPlan.PROFESSIONAL]: 9990, // R$ 99,90
  [TenantPlan.BUSINESS]: 19990, // R$ 199,90
  [TenantPlan.ENTERPRISE]: 49990, // R$ 499,90
};

/**
 * Helper para verificar se um limite é ilimitado
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Helper para obter configuração do plano
 */
export function getPlanConfig(planType: TenantPlan): TenantPlanConfig {
  return PLAN_CONFIGS[planType] || PLAN_CONFIGS[TenantPlan.FREE];
}

/**
 * Helper para verificar se feature está habilitada no plano
 */
export function isPlanFeatureEnabled(
  planType: TenantPlan,
  feature: keyof TenantPlanFeatures,
): boolean {
  const config = getPlanConfig(planType);
  return config.features[feature] ?? false;
}

/**
 * Helper para obter limite do plano
 */
export function getPlanLimit(
  planType: TenantPlan,
  limit: keyof TenantPlanLimits,
): number {
  const config = getPlanConfig(planType);
  return config.limits[limit] ?? 0;
}
