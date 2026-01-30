import { Injectable, Logger } from '@nestjs/common';
import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  isAfter,
  format,
} from 'date-fns';
import { RecurrenceType } from '../dto/create-appointment.dto';

/**
 * Padrão de recorrência
 */
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  count?: number;
  endDate?: Date;
  daysOfWeek?: number[];
}

/**
 * Ocorrência gerada
 */
export interface RecurrenceOccurrence {
  date: Date;
  index: number;
  isLast: boolean;
}

/**
 * Serviço responsável pelo gerenciamento de recorrência de agendamentos
 */
@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  /**
   * Limite máximo de ocorrências
   */
  private readonly MAX_OCCURRENCES = 52; // 1 ano de recorrência semanal

  /**
   * Gera as datas de ocorrência baseado no padrão de recorrência
   */
  generateOccurrences(
    startDate: Date,
    pattern: RecurrencePattern,
  ): RecurrenceOccurrence[] {
    if (pattern.type === RecurrenceType.NONE) {
      return [{ date: startDate, index: 0, isLast: true }];
    }

    const occurrences: RecurrenceOccurrence[] = [];
    let currentDate = startDate;
    let index = 0;

    const maxOccurrences = Math.min(
      pattern.count ?? this.MAX_OCCURRENCES,
      this.MAX_OCCURRENCES,
    );

    while (index < maxOccurrences) {
      // Verificar se passou da data final
      if (pattern.endDate && isAfter(currentDate, pattern.endDate)) {
        break;
      }

      occurrences.push({
        date: new Date(currentDate),
        index,
        isLast: false,
      });

      // Calcular próxima data
      currentDate = this.getNextOccurrence(currentDate, pattern);
      index++;
    }

    // Marcar último como isLast
    if (occurrences.length > 0) {
      occurrences[occurrences.length - 1].isLast = true;
    }

    return occurrences;
  }

  /**
   * Calcula a próxima ocorrência
   */
  getNextOccurrence(currentDate: Date, pattern: RecurrencePattern): Date {
    switch (pattern.type) {
      case RecurrenceType.DAILY:
        return addDays(currentDate, pattern.interval || 1);

      case RecurrenceType.WEEKLY:
        return addWeeks(currentDate, pattern.interval || 1);

      case RecurrenceType.BIWEEKLY:
        return addWeeks(currentDate, 2);

      case RecurrenceType.MONTHLY:
        return addMonths(currentDate, pattern.interval || 1);

      default:
        return currentDate;
    }
  }

  /**
   * Verifica se uma data faz parte de um padrão de recorrência
   */
  isDateInPattern(
    date: Date,
    startDate: Date,
    pattern: RecurrencePattern,
  ): boolean {
    if (pattern.type === RecurrenceType.NONE) {
      return date.getTime() === startDate.getTime();
    }

    const occurrences = this.generateOccurrences(startDate, pattern);
    return occurrences.some(
      (occ) =>
        format(occ.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
    );
  }

  /**
   * Obtém informações de recorrência em formato legível
   */
  getRecurrenceDescription(pattern: RecurrencePattern): string {
    switch (pattern.type) {
      case RecurrenceType.DAILY:
        if (pattern.interval === 1) {
          return 'Diariamente';
        }
        return `A cada ${pattern.interval} dias`;

      case RecurrenceType.WEEKLY:
        if (pattern.interval === 1) {
          return 'Semanalmente';
        }
        return `A cada ${pattern.interval} semanas`;

      case RecurrenceType.BIWEEKLY:
        return 'Quinzenalmente';

      case RecurrenceType.MONTHLY:
        if (pattern.interval === 1) {
          return 'Mensalmente';
        }
        return `A cada ${pattern.interval} meses`;

      default:
        return 'Sem recorrência';
    }
  }

  /**
   * Calcula a data final de um grupo de recorrência
   */
  calculateEndDate(startDate: Date, pattern: RecurrencePattern): Date | null {
    if (pattern.type === RecurrenceType.NONE) {
      return null;
    }

    if (pattern.endDate) {
      return pattern.endDate;
    }

    if (pattern.count) {
      const occurrences = this.generateOccurrences(startDate, pattern);
      return occurrences[occurrences.length - 1].date;
    }

    return null;
  }

  /**
   * Valida um padrão de recorrência
   */
  validatePattern(pattern: RecurrencePattern): { valid: boolean; error?: string } {
    if (pattern.type === RecurrenceType.NONE) {
      return { valid: true };
    }

    // Deve ter count ou endDate
    if (!pattern.count && !pattern.endDate) {
      return {
        valid: false,
        error: 'Recorrência deve ter número de ocorrências ou data final',
      };
    }

    // Verificar limite de ocorrências
    if (pattern.count && pattern.count > this.MAX_OCCURRENCES) {
      return {
        valid: false,
        error: `Número máximo de ocorrências é ${this.MAX_OCCURRENCES}`,
      };
    }

    // Verificar data final
    if (pattern.endDate && isBefore(pattern.endDate, new Date())) {
      return {
        valid: false,
        error: 'Data final de recorrência deve ser no futuro',
      };
    }

    return { valid: true };
  }

  /**
   * Cria um ID de grupo de recorrência
   */
  generateRecurrenceGroupId(): string {
    return `recurrence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Expande recorrência para datas específicas excluindo algumas datas
   */
  expandWithExclusions(
    startDate: Date,
    pattern: RecurrencePattern,
    excludedDates: Date[],
  ): RecurrenceOccurrence[] {
    const allOccurrences = this.generateOccurrences(startDate, pattern);

    const excludedDateStrings = excludedDates.map((d) =>
      format(d, 'yyyy-MM-dd'),
    );

    return allOccurrences.filter(
      (occ) => !excludedDateStrings.includes(format(occ.date, 'yyyy-MM-dd')),
    );
  }
}
