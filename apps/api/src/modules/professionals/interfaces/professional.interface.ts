/**
 * Interfaces do Módulo de Profissionais
 * @module professionals/interfaces
 */

/**
 * Status do profissional
 */
export enum ProfessionalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_VACATION = 'ON_VACATION',
  ON_LEAVE = 'ON_LEAVE',
}

/**
 * Tipo de contrato
 */
export enum ContractType {
  EMPLOYEE = 'EMPLOYEE',         // CLT
  CONTRACTOR = 'CONTRACTOR',     // PJ
  FREELANCER = 'FREELANCER',     // Autônomo
  PARTNER = 'PARTNER',           // Sócio
  COMMISSION_ONLY = 'COMMISSION_ONLY', // Só comissão
}

/**
 * Tipo de comissão
 */
export enum CommissionType {
  FIXED = 'FIXED',               // Valor fixo por serviço
  PERCENTAGE = 'PERCENTAGE',     // Percentual do serviço
  TIERED = 'TIERED',             // Escalonada por meta
  HYBRID = 'HYBRID',             // Fixo + percentual
}

/**
 * Horário de trabalho
 */
export interface WorkingHours {
  dayOfWeek: number;             // 0-6 (Domingo-Sábado)
  isWorkingDay: boolean;
  startTime: string;             // HH:mm
  endTime: string;
  breakStart?: string;           // Início do intervalo
  breakEnd?: string;             // Fim do intervalo
}

/**
 * Intervalo de horário
 */
export interface TimeSlot {
  start: string;                 // HH:mm
  end: string;                   // HH:mm
}

/**
 * Configuração de agenda
 */
export interface ScheduleConfig {
  defaultSlotDuration: number;   // Duração padrão em minutos
  minAdvanceBooking: number;     // Mínimo de horas de antecedência
  maxAdvanceBooking: number;     // Máximo de dias de antecedência
  allowOnlineBooking: boolean;
  allowWalkIns: boolean;
  overbookingLimit: number;      // Quantos overbookings permitir
  bufferBetweenAppointments: number; // Buffer em minutos
}

/**
 * Bloqueio de agenda
 */
export interface ScheduleBlock {
  id: string;
  professionalId: string;
  type: 'VACATION' | 'LEAVE' | 'SICK' | 'PERSONAL' | 'TRAINING' | 'OTHER';
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  recurrenceRule?: string;       // RRULE format
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

/**
 * Especialidade do profissional
 */
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  certificationDate?: Date;
  certificationExpiry?: Date;
  certificateUrl?: string;
}

/**
 * Regra de comissão do profissional
 */
export interface CommissionRule {
  id: string;
  serviceId?: string;            // null = todos os serviços
  categoryId?: string;           // null = todas as categorias
  type: CommissionType;
  value: number;                 // Percentual ou valor fixo
  minValue?: number;             // Comissão mínima
  maxValue?: number;             // Comissão máxima
  tiers?: CommissionTier[];      // Para tipo TIERED
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

/**
 * Tier de comissão escalonada
 */
export interface CommissionTier {
  minRevenue: number;            // Faturamento mínimo
  maxRevenue?: number;           // Faturamento máximo
  percentage: number;            // Percentual para este tier
  bonus?: number;                // Bônus ao atingir
}

/**
 * Meta do profissional
 */
export interface ProfessionalGoal {
  id: string;
  professionalId: string;
  type: 'REVENUE' | 'APPOINTMENTS' | 'NEW_CUSTOMERS' | 'RATING' | 'PRODUCTS';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  bonus?: number;                // Bônus ao atingir
  isAchieved: boolean;
  achievedAt?: Date;
}

/**
 * Métricas do profissional
 */
export interface ProfessionalMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  totalCommissions: number;
  averageRating: number;
  totalReviews: number;
  newCustomers: number;
  returningCustomers: number;
  productsSold: number;
  productsRevenue: number;
  averageServiceDuration: number;
  utilizationRate: number;       // % do tempo ocupado
}

/**
 * Profissional completo
 */
export interface ProfessionalEntity {
  id: string;
  tenantId: string;
  userId?: string;               // Vinculado a um usuário
  
  // Dados pessoais
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  birthDate?: Date;
  gender?: 'M' | 'F' | 'O';
  avatar?: string;
  bio?: string;
  
  // Profissional
  status: ProfessionalStatus;
  contractType: ContractType;
  hireDate: Date;
  terminationDate?: Date;
  registrationNumber?: string;   // CRO, CRM, etc.
  
  // Especialidades e serviços
  specialties: Specialty[];
  serviceIds: string[];
  
  // Agenda
  workingHours: WorkingHours[];
  scheduleConfig: ScheduleConfig;
  scheduleBlocks: ScheduleBlock[];
  
  // Comissões
  commissionRules: CommissionRule[];
  defaultCommissionPercentage: number;
  
  // Metas
  goals: ProfessionalGoal[];
  
  // Métricas
  metrics: ProfessionalMetrics;
  
  // Configurações
  color?: string;                // Cor na agenda
  displayOrder: number;
  isOnlineBookingEnabled: boolean;
  acceptsNewCustomers: boolean;
  
  // Social
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Disponibilidade do profissional para uma data
 */
export interface ProfessionalAvailability {
  professionalId: string;
  date: Date;
  slots: {
    time: string;
    isAvailable: boolean;
    reason?: 'BOOKED' | 'BLOCKED' | 'BREAK' | 'OUTSIDE_HOURS';
    appointmentId?: string;
  }[];
  isWorkingDay: boolean;
  hasBlockedPeriod: boolean;
  workingHours?: WorkingHours;
}
