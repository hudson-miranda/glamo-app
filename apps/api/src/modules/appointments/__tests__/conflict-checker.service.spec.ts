import { Test, TestingModule } from '@nestjs/testing';
import { addMinutes, subHours } from 'date-fns';
import { ConflictCheckerService, ConflictType } from '../services/conflict-checker.service';
import { PrismaService } from '@core/database/prisma.service';
import { AppointmentStatus } from '@glamo/database';

describe('ConflictCheckerService', () => {
  let service: ConflictCheckerService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTenantId = 'tenant-123';
  const mockProfessionalId = 'professional-123';
  const mockClientId = 'client-123';

  beforeEach(async () => {
    const mockPrisma = {
      appointment: {
        findMany: jest.fn(),
      },
      professionalTimeBlock: {
        findMany: jest.fn(),
      },
      professionalSchedule: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictCheckerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConflictCheckerService>(ConflictCheckerService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkConflicts', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    it('should return no conflicts when slot is available', async () => {
      // Arrange
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });

      // Act
      const result = await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        clientId: mockClientId,
        startTime: futureDate,
        duration: 60,
      });

      // Assert
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect professional busy conflict', async () => {
      // Arrange
      const existingAppointment = {
        id: 'existing-1',
        scheduledAt: futureDate,
        endTime: addMinutes(futureDate, 60),
        client: { id: 'other-client', name: 'Other Client' },
      };

      prisma.appointment.findMany
        .mockResolvedValueOnce([existingAppointment]) // Professional conflicts
        .mockResolvedValueOnce([]); // Client conflicts
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });

      // Act
      const result = await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        clientId: mockClientId,
        startTime: futureDate,
        duration: 60,
      });

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some(c => c.type === ConflictType.PROFESSIONAL_BUSY)).toBe(true);
    });

    it('should detect client busy conflict', async () => {
      // Arrange
      const existingClientAppointment = {
        id: 'existing-1',
        scheduledAt: futureDate,
        endTime: addMinutes(futureDate, 60),
        professional: {
          id: 'other-professional',
          user: { name: 'Other Professional' },
        },
      };

      prisma.appointment.findMany
        .mockResolvedValueOnce([]) // Professional conflicts
        .mockResolvedValueOnce([existingClientAppointment]); // Client conflicts
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });

      // Act
      const result = await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        clientId: mockClientId,
        startTime: futureDate,
        duration: 60,
      });

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some(c => c.type === ConflictType.CLIENT_BUSY)).toBe(true);
    });

    it('should detect blocked time conflict', async () => {
      // Arrange
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.professionalTimeBlock.findMany.mockResolvedValue([
        {
          startTime: subHours(futureDate, 1),
          endTime: addMinutes(futureDate, 120),
          reason: 'Vacation',
        },
      ]);
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });

      // Act
      const result = await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        startTime: futureDate,
        duration: 60,
      });

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some(c => c.type === ConflictType.BLOCKED_TIME)).toBe(true);
    });

    it('should detect outside working hours conflict', async () => {
      // Arrange
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.professionalSchedule.findFirst.mockResolvedValue(null); // No schedule

      // Act
      const result = await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        startTime: futureDate,
        duration: 60,
      });

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.some(c => c.type === ConflictType.OUTSIDE_WORKING_HOURS)).toBe(true);
    });

    it('should exclude specific appointment when checking conflicts', async () => {
      // Arrange
      const excludeId = 'appointment-to-exclude';
      
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });

      // Act
      await service.checkConflicts({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        startTime: futureDate,
        duration: 60,
        excludeAppointmentId: excludeId,
      });

      // Assert
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: excludeId },
          }),
        }),
      );
    });
  });
});
