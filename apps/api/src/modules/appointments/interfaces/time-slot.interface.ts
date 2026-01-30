/**
 * Interface para slot de tempo disponível
 */
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  professionalId?: string;
  professionalName?: string;
}

/**
 * Interface para slot com detalhes
 */
export interface DetailedTimeSlot extends TimeSlot {
  duration: number; // em minutos
  formattedTime: string;
  conflictReason?: string;
}

/**
 * Interface para intervalo de tempo
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Interface para horário de trabalho
 */
export interface WorkingHoursSlot {
  dayOfWeek: number; // 0-6 (domingo-sábado)
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  breakStart?: string;
  breakEnd?: string;
}

/**
 * Interface para bloqueio de tempo
 */
export interface BlockedTimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  isAllDay: boolean;
}
