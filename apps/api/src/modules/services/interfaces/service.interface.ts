/**
 * Interfaces do Módulo de Serviços
 * @module services/interfaces
 */

/**
 * Tipo de serviço
 */
export enum ServiceType {
  SINGLE = 'SINGLE',           // Serviço individual
  COMBO = 'COMBO',             // Combo de serviços
  PACKAGE = 'PACKAGE',         // Pacote (múltiplas sessões)
}

/**
 * Status do serviço
 */
export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

/**
 * Tipo de duração
 */
export enum DurationType {
  FIXED = 'FIXED',             // Duração fixa
  VARIABLE = 'VARIABLE',       // Duração variável (range)
  BY_OPTION = 'BY_OPTION',     // Duração depende da opção escolhida
}

/**
 * Tipo de precificação
 */
export enum PricingType {
  FIXED = 'FIXED',             // Preço fixo
  VARIABLE = 'VARIABLE',       // Preço por opção
  STARTING_AT = 'STARTING_AT', // A partir de
  BY_PROFESSIONAL = 'BY_PROFESSIONAL', // Por profissional
  DYNAMIC = 'DYNAMIC',         // Dinâmico (horário, demanda)
}

/**
 * Regra de preço dinâmico
 */
export interface DynamicPricingRule {
  id: string;
  name: string;
  type: 'TIME_BASED' | 'DEMAND_BASED' | 'DAY_BASED' | 'SEASON_BASED';
  conditions: {
    daysOfWeek?: number[];       // 0-6
    startTime?: string;          // HH:mm
    endTime?: string;            // HH:mm
    startDate?: Date;            // Para sazonalidade
    endDate?: Date;
    occupancyThreshold?: number; // % ocupação para demand
  };
  adjustment: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;               // +20% ou +50
  };
  priority: number;              // Ordem de aplicação
  isActive: boolean;
}

/**
 * Opção de serviço (variações)
 */
export interface ServiceOption {
  id: string;
  name: string;
  description?: string;
  duration: number;              // Em minutos
  priceAdjustment: number;       // Ajuste sobre preço base
  isDefault: boolean;
}

/**
 * Preço por profissional
 */
export interface ProfessionalPrice {
  professionalId: string;
  price: number;
  duration?: number;             // Override de duração
}

/**
 * Item do combo
 */
export interface ComboItem {
  serviceId: string;
  quantity: number;
  isOptional: boolean;
  priceOverride?: number;
}

/**
 * Configuração do pacote
 */
export interface PackageConfig {
  sessionsTotal: number;
  sessionsUsed: number;
  validityDays: number;
  pricePerSession: number;
  totalPrice: number;
  discount: number;
}

/**
 * Disponibilidade do serviço
 */
export interface ServiceAvailability {
  daysOfWeek: number[];          // 0-6
  startTime: string;             // HH:mm
  endTime: string;               // HH:mm
  excludeDates?: Date[];
}

/**
 * Requisitos do serviço
 */
export interface ServiceRequirements {
  minAge?: number;
  maxAge?: number;
  genderRestriction?: 'M' | 'F' | null;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPercentage?: number;
  cancellationHours?: number;
  notes?: string;
}

/**
 * Serviço completo
 */
export interface ServiceEntity {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type: ServiceType;
  status: ServiceStatus;
  
  // Duração
  durationType: DurationType;
  duration: number;              // Duração principal em minutos
  durationMin?: number;          // Para variável
  durationMax?: number;
  bufferTimeBefore: number;      // Tempo de preparação
  bufferTimeAfter: number;       // Tempo de limpeza
  
  // Precificação
  pricingType: PricingType;
  price: number;                 // Preço base
  priceMin?: number;             // Para "a partir de"
  priceMax?: number;
  options: ServiceOption[];
  professionalPrices: ProfessionalPrice[];
  dynamicPricingRules: DynamicPricingRule[];
  
  // Combo/Pacote
  comboItems?: ComboItem[];
  packageConfig?: PackageConfig;
  comboDiscount?: number;
  
  // Disponibilidade
  availability?: ServiceAvailability;
  maxDailyBookings?: number;
  maxConcurrentBookings?: number;
  
  // Requisitos
  requirements?: ServiceRequirements;
  
  // Profissionais
  professionalIds: string[];
  
  // SEO e Marketing
  images: string[];
  tags: string[];
  color?: string;
  icon?: string;
  displayOrder: number;
  
  // Fidelidade
  loyaltyPointsEarned: number;
  loyaltyPointsRequired: number;
  
  // Flags
  isOnlineBookingEnabled: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  requiresConfirmation: boolean;
  
  // Métricas
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Categoria de serviço
 */
export interface ServiceCategory {
  id: string;
  tenantId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  color?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  servicesCount: number;
  children?: ServiceCategory[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cálculo de preço
 */
export interface PriceCalculation {
  basePrice: number;
  optionAdjustment: number;
  professionalAdjustment: number;
  dynamicAdjustment: number;
  comboDiscount: number;
  packageDiscount: number;
  finalPrice: number;
  appliedRules: string[];
}

/**
 * Cálculo de duração
 */
export interface DurationCalculation {
  baseDuration: number;
  optionDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  totalDuration: number;
  blockDuration: number;        // Duração para bloqueio de agenda
}
