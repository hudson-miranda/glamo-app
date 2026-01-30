import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getQueueToken } from '@nestjs/bull';
import { addHours, addMinutes } from 'date-fns';
import { AppointmentsService } from '../appointments.service';
import { AppointmentsRepository } from '../repositories/appointments.repository';
import { PrismaService } from '@core/database/prisma.service';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import { TenantService } from '@core/tenancy/tenant.service';
import {
  AvailabilityService,
  ConflictCheckerService,
  RecurrenceService,
  ReminderService,
} from '../services';
import { AppointmentStatus } from '@glamo/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: jest.Mocked<AppointmentsRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let tenantContext: jest.Mocked<TenantContextService>;
  let tenantService: jest.Mocked<TenantService>;
  let availabilityService: jest.Mocked<AvailabilityService>;
  let conflictChecker: jest.Mocked<ConflictCheckerService>;
  let recurrenceService: jest.Mocked<RecurrenceService>;
  let reminderService: jest.Mocked<ReminderService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockAppointment = {
    id: 'appointment-123',
    tenantId: mockTenantId,
    clientId: 'client-123',
    professionalId: 'professional-123',
    scheduledAt: addHours(new Date(), 24),
    endTime: addHours(new Date(), 25),
    totalDuration: 60,
    totalPrice: 100,
    status: AppointmentStatus.PENDING,
    client: { id: 'client-123', name: 'Test Client', email: 'client@test.com' },
    professional: {
      id: 'professional-123',
      user: { id: 'user-123', name: 'Test Professional' },
    },
    services: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findByIdInternal: jest.fn(),
      findMany: jest.fn(),
      findByDateRange: jest.fn(),
      findByRecurrenceGroup: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      countByStatus: jest.fn(),
      countCurrentMonth: jest.fn(),
    };

    const mockPrisma = {
      service: {
        findUnique: jest.fn(),
      },
      appointment: {
        create: jest.fn(),
      },
      appointmentService: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const mockTenantContext = {
      getCurrentTenantId: jest.fn().mockReturnValue(mockTenantId),
    };

    const mockTenantService = {
      enforceLimit: jest.fn(),
    };

    const mockAvailabilityService = {
      calculateServicesDuration: jest.fn().mockResolvedValue(60),
      getAvailableSlots: jest.fn(),
      getAvailabilityRange: jest.fn(),
    };

    const mockConflictChecker = {
      checkConflicts: jest.fn().mockResolvedValue({ hasConflict: false, conflicts: [] }),
    };

    const mockRecurrenceService = {
      generateOccurrences: jest.fn(),
      generateRecurrenceGroupId: jest.fn().mockReturnValue('recurrence-123'),
      validatePattern: jest.fn().mockReturnValue({ valid: true }),
    };

    const mockReminderService = {
      scheduleReminders: jest.fn(),
      cancelReminders: jest.fn(),
      rescheduleReminders: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantContextService, useValue: mockTenantContext },
        { provide: TenantService, useValue: mockTenantService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: ConflictCheckerService, useValue: mockConflictChecker },
        { provide: RecurrenceService, useValue: mockRecurrenceService },
        { provide: ReminderService, useValue: mockReminderService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: getQueueToken('appointments'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get(AppointmentsRepository);
    prisma = module.get(PrismaService);
    tenantContext = module.get(TenantContextService);
    tenantService = module.get(TenantService);
    availabilityService = module.get(AvailabilityService);
    conflictChecker = module.get(ConflictCheckerService);
    recurrenceService = module.get(RecurrenceService);
    reminderService = module.get(ReminderService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      clientId: 'client-123',
      professionalId: 'professional-123',
      services: [{ serviceId: 'service-123', quantity: 1 }],
      scheduledAt: addHours(new Date(), 24).toISOString(),
    };

    it('should create a single appointment successfully', async () => {
      // Arrange
      prisma.service.findUnique.mockResolvedValue({ price: 100, duration: 60 });
      repository.findById.mockResolvedValue(mockAppointment);

      // Act
      const result = await service.create(createDto, mockUserId);

      // Assert
      expect(tenantService.enforceLimit).toHaveBeenCalledWith(mockTenantId, 'appointmentsPerMonth');
      expect(conflictChecker.checkConflicts).toHaveBeenCalled();
      expect(reminderService.scheduleReminders).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw BadRequestException when conflict exists', async () => {
      // Arrange
      conflictChecker.checkConflicts.mockResolvedValue({
        hasConflict: true,
        conflicts: [{ type: 'PROFESSIONAL_BUSY', severity: 'ERROR' }],
        canOverride: false,
      });

      // Act & Assert
      await expect(service.create(createDto, mockUserId)).rejects.toThrow(BadRequestException);
    });

    it('should skip conflict check when skipConflictCheck is true', async () => {
      // Arrange
      const dtoWithSkip = { ...createDto, skipConflictCheck: true };
      prisma.service.findUnique.mockResolvedValue({ price: 100, duration: 60 });
      repository.findById.mockResolvedValue(mockAppointment);

      // Act
      await service.create(dtoWithSkip, mockUserId);

      // Assert
      expect(conflictChecker.checkConflicts).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return appointment when found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockAppointment);

      // Act
      const result = await service.findById('appointment-123');

      // Assert
      expect(result).toEqual(mockAppointment);
    });

    it('should throw NotFoundException when not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('should confirm pending appointment', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockAppointment);
      repository.updateStatus.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
      });

      // Act
      const result = await service.confirm('appointment-123', mockUserId);

      // Assert
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw BadRequestException when not pending', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
      });

      // Act & Assert
      await expect(service.confirm('appointment-123', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel appointment successfully', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockAppointment);
      repository.updateStatus.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      // Act
      const result = await service.cancel(
        'appointment-123',
        { reason: 'CLIENT_REQUEST' },
        mockUserId,
      );

      // Assert
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(reminderService.cancelReminders).toHaveBeenCalled();
    });

    it('should throw BadRequestException for completed appointment', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      // Act & Assert
      await expect(
        service.cancel('appointment-123', { reason: 'CLIENT_REQUEST' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reschedule', () => {
    const rescheduleDto = {
      newScheduledAt: addHours(new Date(), 48).toISOString(),
      reason: 'Client requested change',
    };

    it('should reschedule appointment successfully', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockAppointment);
      repository.update.mockResolvedValue({
        ...mockAppointment,
        scheduledAt: new Date(rescheduleDto.newScheduledAt),
      });

      // Act
      const result = await service.reschedule('appointment-123', rescheduleDto, mockUserId);

      // Assert
      expect(conflictChecker.checkConflicts).toHaveBeenCalled();
      expect(reminderService.rescheduleReminders).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw BadRequestException for cancelled appointment', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      // Act & Assert
      await expect(
        service.reschedule('appointment-123', rescheduleDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('status transitions', () => {
    it('should transition from CONFIRMED to WAITING (check-in)', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
      });
      repository.updateStatus.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.WAITING,
      });

      // Act
      const result = await service.checkIn('appointment-123', mockUserId);

      // Assert
      expect(result.status).toBe(AppointmentStatus.WAITING);
    });

    it('should transition from WAITING to IN_PROGRESS (start)', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.WAITING,
      });
      repository.updateStatus.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_PROGRESS,
      });

      // Act
      const result = await service.startService('appointment-123', mockUserId);

      // Assert
      expect(result.status).toBe(AppointmentStatus.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      // Arrange
      repository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_PROGRESS,
      });
      repository.updateStatus.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      // Act
      const result = await service.complete('appointment-123', mockUserId);

      // Assert
      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });
  });
});
