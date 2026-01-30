import { Test, TestingModule } from '@nestjs/testing';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { RecurrenceService } from '../services/recurrence.service';
import { RecurrenceType } from '../dto/create-appointment.dto';

describe('RecurrenceService', () => {
  let service: RecurrenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurrenceService],
    }).compile();

    service = module.get<RecurrenceService>(RecurrenceService);
  });

  describe('generateOccurrences', () => {
    const baseDate = new Date('2024-03-15T10:00:00Z');

    it('should return single occurrence for NONE type', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.NONE,
        interval: 1,
      });

      // Assert
      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].date).toEqual(baseDate);
      expect(occurrences[0].isLast).toBe(true);
    });

    it('should generate daily occurrences', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.DAILY,
        interval: 1,
        count: 5,
      });

      // Assert
      expect(occurrences).toHaveLength(5);
      expect(occurrences[0].date).toEqual(baseDate);
      expect(occurrences[1].date).toEqual(addDays(baseDate, 1));
      expect(occurrences[4].isLast).toBe(true);
    });

    it('should generate weekly occurrences', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.WEEKLY,
        interval: 1,
        count: 4,
      });

      // Assert
      expect(occurrences).toHaveLength(4);
      expect(occurrences[1].date).toEqual(addWeeks(baseDate, 1));
      expect(occurrences[2].date).toEqual(addWeeks(baseDate, 2));
    });

    it('should generate biweekly occurrences', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.BIWEEKLY,
        interval: 1,
        count: 3,
      });

      // Assert
      expect(occurrences).toHaveLength(3);
      expect(occurrences[1].date).toEqual(addWeeks(baseDate, 2));
      expect(occurrences[2].date).toEqual(addWeeks(baseDate, 4));
    });

    it('should generate monthly occurrences', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.MONTHLY,
        interval: 1,
        count: 3,
      });

      // Assert
      expect(occurrences).toHaveLength(3);
      expect(occurrences[1].date).toEqual(addMonths(baseDate, 1));
      expect(occurrences[2].date).toEqual(addMonths(baseDate, 2));
    });

    it('should stop at endDate', () => {
      // Arrange
      const endDate = addWeeks(baseDate, 2);

      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.WEEKLY,
        interval: 1,
        endDate,
        count: 10, // Count would be higher
      });

      // Assert
      expect(occurrences.length).toBeLessThanOrEqual(3); // Only 3 weeks fit
    });

    it('should respect max occurrences limit', () => {
      // Act
      const occurrences = service.generateOccurrences(baseDate, {
        type: RecurrenceType.DAILY,
        interval: 1,
        count: 100, // Higher than max
      });

      // Assert
      expect(occurrences.length).toBeLessThanOrEqual(52); // Max limit
    });
  });

  describe('getNextOccurrence', () => {
    const baseDate = new Date('2024-03-15T10:00:00Z');

    it('should calculate next daily occurrence', () => {
      const next = service.getNextOccurrence(baseDate, {
        type: RecurrenceType.DAILY,
        interval: 2,
      });

      expect(next).toEqual(addDays(baseDate, 2));
    });

    it('should calculate next weekly occurrence', () => {
      const next = service.getNextOccurrence(baseDate, {
        type: RecurrenceType.WEEKLY,
        interval: 1,
      });

      expect(next).toEqual(addWeeks(baseDate, 1));
    });

    it('should calculate next biweekly occurrence', () => {
      const next = service.getNextOccurrence(baseDate, {
        type: RecurrenceType.BIWEEKLY,
        interval: 1,
      });

      expect(next).toEqual(addWeeks(baseDate, 2));
    });

    it('should calculate next monthly occurrence', () => {
      const next = service.getNextOccurrence(baseDate, {
        type: RecurrenceType.MONTHLY,
        interval: 1,
      });

      expect(next).toEqual(addMonths(baseDate, 1));
    });
  });

  describe('getRecurrenceDescription', () => {
    it('should describe daily recurrence', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.DAILY,
        interval: 1,
      });

      expect(desc).toBe('Diariamente');
    });

    it('should describe custom interval daily', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.DAILY,
        interval: 3,
      });

      expect(desc).toBe('A cada 3 dias');
    });

    it('should describe weekly recurrence', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.WEEKLY,
        interval: 1,
      });

      expect(desc).toBe('Semanalmente');
    });

    it('should describe biweekly recurrence', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.BIWEEKLY,
        interval: 1,
      });

      expect(desc).toBe('Quinzenalmente');
    });

    it('should describe monthly recurrence', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.MONTHLY,
        interval: 1,
      });

      expect(desc).toBe('Mensalmente');
    });

    it('should describe no recurrence', () => {
      const desc = service.getRecurrenceDescription({
        type: RecurrenceType.NONE,
        interval: 1,
      });

      expect(desc).toBe('Sem recorrência');
    });
  });

  describe('validatePattern', () => {
    it('should validate NONE type', () => {
      const result = service.validatePattern({
        type: RecurrenceType.NONE,
        interval: 1,
      });

      expect(result.valid).toBe(true);
    });

    it('should fail when no count or endDate', () => {
      const result = service.validatePattern({
        type: RecurrenceType.WEEKLY,
        interval: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('número de ocorrências ou data final');
    });

    it('should fail when count exceeds max', () => {
      const result = service.validatePattern({
        type: RecurrenceType.WEEKLY,
        interval: 1,
        count: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Número máximo');
    });

    it('should fail when endDate is in the past', () => {
      const result = service.validatePattern({
        type: RecurrenceType.WEEKLY,
        interval: 1,
        endDate: new Date('2020-01-01'),
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('no futuro');
    });

    it('should pass with valid pattern', () => {
      const result = service.validatePattern({
        type: RecurrenceType.WEEKLY,
        interval: 1,
        count: 10,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('generateRecurrenceGroupId', () => {
    it('should generate unique IDs', () => {
      const id1 = service.generateRecurrenceGroupId();
      const id2 = service.generateRecurrenceGroupId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^recurrence_\d+_[a-z0-9]+$/);
    });
  });
});
