/**
 * Gênero do cliente
 */
export enum CustomerGender {
  MALE = 'M',
  FEMALE = 'F',
  OTHER = 'OTHER',
}

/**
 * Canal de comunicação preferido
 */
export enum CommunicationChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

/**
 * Tier de fidelidade
 */
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

/**
 * Endereço do cliente
 */
export interface CustomerAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Preferências do cliente
 */
export interface CustomerPreferences {
  preferredProfessionalId?: string;
  preferredServices: string[];
  preferredDays: number[]; // 0-6 (domingo-sábado)
  preferredTimes: string[]; // HH:mm format
  communicationChannel: CommunicationChannel;
  receivePromotions: boolean;
  receiveBirthdayMessage: boolean;
  receiveReminders: boolean;
}

/**
 * Métricas calculadas do cliente
 */
export interface CustomerMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  totalSpent: number;
  averageTicket: number;
  visitFrequency: number; // média de dias entre visitas
  lastVisitDaysAgo: number;
  cancellationRate: number;
  noShowRate: number;
}

/**
 * Informações de fidelidade
 */
export interface CustomerLoyalty {
  tier: LoyaltyTier;
  points: number;
  pointsToNextTier: number;
  tierProgress: number; // percentual 0-100
  memberSince: Date;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
}

/**
 * Configuração de tiers de fidelidade
 */
export interface LoyaltyTierConfig {
  tier: LoyaltyTier;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  pointsMultiplier: number;
}

/**
 * Configurações padrão dos tiers
 */
export const LOYALTY_TIER_CONFIGS: LoyaltyTierConfig[] = [
  {
    tier: LoyaltyTier.BRONZE,
    minPoints: 0,
    maxPoints: 499,
    benefits: ['Acúmulo de pontos básico'],
    pointsMultiplier: 1,
  },
  {
    tier: LoyaltyTier.SILVER,
    minPoints: 500,
    maxPoints: 1499,
    benefits: ['5% de desconto', 'Agendamento prioritário'],
    pointsMultiplier: 1.25,
  },
  {
    tier: LoyaltyTier.GOLD,
    minPoints: 1500,
    maxPoints: 3999,
    benefits: ['10% de desconto', 'Agendamento prioritário', 'Brindes exclusivos'],
    pointsMultiplier: 1.5,
  },
  {
    tier: LoyaltyTier.PLATINUM,
    minPoints: 4000,
    maxPoints: 9999,
    benefits: ['15% de desconto', 'Acesso VIP', 'Serviços exclusivos'],
    pointsMultiplier: 1.75,
  },
  {
    tier: LoyaltyTier.DIAMOND,
    minPoints: 10000,
    maxPoints: Infinity,
    benefits: ['20% de desconto', 'Acesso VIP', 'Experiências exclusivas', 'Concierge pessoal'],
    pointsMultiplier: 2,
  },
];

/**
 * Obtém a configuração do tier por pontos
 */
export function getTierByPoints(points: number): LoyaltyTierConfig {
  return (
    LOYALTY_TIER_CONFIGS.find((config) => points >= config.minPoints && points <= config.maxPoints) ??
    LOYALTY_TIER_CONFIGS[0]
  );
}

/**
 * Calcula pontos para o próximo tier
 */
export function getPointsToNextTier(points: number): number {
  const currentTier = getTierByPoints(points);
  const currentIndex = LOYALTY_TIER_CONFIGS.findIndex((c) => c.tier === currentTier.tier);
  
  if (currentIndex >= LOYALTY_TIER_CONFIGS.length - 1) {
    return 0; // Já está no tier máximo
  }
  
  const nextTier = LOYALTY_TIER_CONFIGS[currentIndex + 1];
  return nextTier.minPoints - points;
}
