import { TimeSlot, WorkingHoursSlot, BlockedTimeSlot } from './time-slot.interface';

/**
 * Parâmetros para consulta de disponibilidade
 */
export interface AvailabilityParams {
  tenantId: string;
  professionalId: string;
  serviceIds: string[];
  date: Date;
  duration?: number; // Duração em minutos (calculada se não fornecida)
}

/**
 * Parâmetros para consulta de disponibilidade em range
 */
export interface AvailabilityRangeParams {
  tenantId: string;
  professionalId?: string;
  serviceIds?: string[];
  startDate: Date;
  endDate: Date;
}

/**
 * Resultado de disponibilidade para um dia
 */
export interface DayAvailability {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  dayName: string;
  isWorkingDay: boolean;
  slots: TimeSlot[];
  totalAvailable: number;
}

/**
 * Resultado de disponibilidade para múltiplos profissionais
 */
export interface ProfessionalAvailability {
  professionalId: string;
  professionalName: string;
  avatar?: string;
  availability: DayAvailability[];
}

/**
 * Configuração de disponibilidade do profissional
 */
export interface ProfessionalAvailabilityConfig {
  professionalId: string;
  workingHours: WorkingHoursSlot[];
  blockedTimes: BlockedTimeSlot[];
  slotInterval: number; // Intervalo entre slots em minutos (ex: 15, 30)
  bufferBefore: number; // Tempo de buffer antes do agendamento
  bufferAfter: number;  // Tempo de buffer depois do agendamento
  maxAdvanceBookingDays: number; // Máximo de dias para agendar antecipado
  minAdvanceBookingHours: number; // Mínimo de horas de antecedência
}

/**
 * Conflito de agendamento
 */
export interface AppointmentConflict {
  type: 'OVERLAP' | 'BLOCKED' | 'OUTSIDE_HOURS' | 'TOO_CLOSE' | 'PAST_DATE';
  message: string;
  conflictingAppointmentId?: string;
  conflictingBlockId?: string;
}

/**
 * Resultado de verificação de conflito
 */
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: AppointmentConflict[];
}
