import { LoyaltyTier } from './customer.interface';

/**
 * Analytics financeiro do cliente
 */
export interface CustomerFinancialAnalytics {
  totalSpent: number;
  averageTicket: number;
  lastPurchaseValue: number;
  lastPurchaseDate?: Date;
  spendingTrend: 'UP' | 'DOWN' | 'STABLE';
  monthlySpending: MonthlySpending[];
}

/**
 * Gasto mensal
 */
export interface MonthlySpending {
  month: string; // YYYY-MM
  amount: number;
  appointmentCount: number;
}

/**
 * Comportamento do cliente
 */
export interface CustomerBehaviorAnalytics {
  favoriteServices: ServicePreference[];
  favoriteProfessional?: ProfessionalPreference;
  preferredDays: DayPreference[];
  preferredTimes: TimePreference[];
  averageBookingAdvance: number; // dias de antecedência média
}

/**
 * Preferência de serviço
 */
export interface ServicePreference {
  serviceId: string;
  serviceName: string;
  count: number;
  percentage: number;
  lastUsed: Date;
}

/**
 * Preferência de profissional
 */
export interface ProfessionalPreference {
  professionalId: string;
  professionalName: string;
  appointmentCount: number;
  percentage: number;
}

/**
 * Preferência de dia
 */
export interface DayPreference {
  dayOfWeek: number;
  dayName: string;
  count: number;
  percentage: number;
}

/**
 * Preferência de horário
 */
export interface TimePreference {
  timeSlot: string; // 'morning', 'afternoon', 'evening'
  count: number;
  percentage: number;
}

/**
 * Engajamento do cliente
 */
export interface CustomerEngagementAnalytics {
  appointmentHistory: AppointmentHistorySummary;
  cancellationRate: number;
  noShowRate: number;
  averageRating?: number;
  ratingCount: number;
  feedbackCount: number;
  lastInteraction?: Date;
}

/**
 * Resumo do histórico de agendamentos
 */
export interface AppointmentHistorySummary {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcoming: number;
  firstAppointment?: Date;
  lastAppointment?: Date;
}

/**
 * Analytics de fidelidade
 */
export interface CustomerLoyaltyAnalytics {
  currentTier: LoyaltyTier;
  tierName: string;
  pointsBalance: number;
  pointsToNextTier: number;
  tierProgress: number;
  pointsHistory: PointsTransaction[];
  redemptionHistory: RedemptionRecord[];
  totalPointsEarned: number;
  totalPointsRedeemed: number;
}

/**
 * Transação de pontos
 */
export interface PointsTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  balance: number;
  description: string;
  referenceId?: string;
  createdAt: Date;
}

/**
 * Registro de resgate
 */
export interface RedemptionRecord {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  redeemedAt: Date;
}

/**
 * Analytics completo do cliente
 */
export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  financial: CustomerFinancialAnalytics;
  behavior: CustomerBehaviorAnalytics;
  engagement: CustomerEngagementAnalytics;
  loyalty: CustomerLoyaltyAnalytics;
  segments: string[];
  calculatedAt: Date;
}

/**
 * Timeline de interação do cliente
 */
export interface CustomerTimelineItem {
  id: string;
  type: 'APPOINTMENT' | 'PURCHASE' | 'REVIEW' | 'POINTS' | 'NOTE' | 'COMMUNICATION' | 'UPDATE';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  createdBy?: string;
}
