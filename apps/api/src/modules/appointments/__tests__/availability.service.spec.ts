import { Test, TestingModule } from '@nestjs/testing';
import { addMinutes, addDays, subHours } from 'date-fns';
import { AvailabilityService } from '../services/availability.service';
import { PrismaService } from '@core/database/prisma.service';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import { DayOfWeek, AppointmentStatus } from '@glamo/database';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: jest.Mocked<PrismaService>;
  let tenantContext: jest.Mocked<TenantContextService>;

  const mockTenantId = 'tenant-123';
  const mockProfessionalId = 'professional-123';

  beforeEach(async () => {
    const mockPrisma = {
      service: {
        findMany: jest.fn(),
      },
      professional: {
        findUnique: jest.fn(),
      },
      professionalSchedule: {
        findFirst: jest.fn(),
      },
      professionalTimeBlock: {
        findMany: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      tenantSettings: {
        findUnique: jest.fn(),
      },
    };

    const mockTenantContext = {
      getCurrentTenantId: jest.fn().mockReturnValue(mockTenantId),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    prisma = module.get(PrismaService);
    tenantContext = module.get(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    const baseDate = new Date('2024-03-15T10:00:00Z');

    it('should return available slots when no appointments exist', async () => {
      // Arrange
      prisma.service.findMany.mockResolvedValue([
        { duration: 60 },
      ]);
      prisma.professional.findUnique.mockResolvedValue({
        id: mockProfessionalId,
        slotInterval: 30,
        bufferTime: 0,
        user: { name: 'Test Professional' },
      });
      prisma.tenantSettings.findUnique.mockResolvedValue({
        minAdvanceBooking: 60,
        maxAdvanceBooking: 43200,
        defaultSlotInterval: 30,
      });
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isActive: true,
      });
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.appointment.findMany.mockResolvedValue([]);

      // Act
      const slots = await service.getAvailableSlots({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        serviceIds: ['service-1'],
        date: baseDate,
      });

      // Assert
      expect(slots).toBeDefined();
      expect(Array.isArray(slots)).toBe(true);
    });

    it('should exclude slots that conflict with existing appointments', async () => {
      // Arrange
      const existingAppointmentStart = new Date('2024-03-15T10:00:00Z');
      
      prisma.service.findMany.mockResolvedValue([{ duration: 30 }]);
      prisma.professional.findUnique.mockResolvedValue({
        id: mockProfessionalId,
        slotInterval: 30,
        bufferTime: 0,
        user: { name: 'Test Professional' },
      });
      prisma.tenantSettings.findUnique.mockResolvedValue({
        minAdvanceBooking: 0,
        maxAdvanceBooking: 43200,
        defaultSlotInterval: 30,
      });
      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: '09:00',
        endTime: '12:00',
        isActive: true,
      });
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.appointment.findMany.mockResolvedValue([
        {
          scheduledAt: existingAppointmentStart,
          endTime: addMinutes(existingAppointmentStart, 60),
          status: AppointmentStatus.CONFIRMED,
        },
      ]);

      // Act
      const slots = await service.getAvailableSlots({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        serviceIds: ['service-1'],
        date: baseDate,
      });

      // Assert
      // Slots during the existing appointment should not be available
      const conflictingSlots = slots.filter(
        slot =>
          slot.startTime >= existingAppointmentStart &&
          slot.startTime < addMinutes(existingAppointmentStart, 60),
      );
      expect(conflictingSlots).toHaveLength(0);
    });

    it('should return empty array when professional does not work on the day', async () => {
      // Arrange
      prisma.service.findMany.mockResolvedValue([{ duration: 30 }]);
      prisma.professional.findUnique.mockResolvedValue({
        id: mockProfessionalId,
        user: { name: 'Test Professional' },
      });
      prisma.tenantSettings.findUnique.mockResolvedValue({});
      prisma.professionalSchedule.findFirst.mockResolvedValue(null);

      // Act
      const slots = await service.getAvailableSlots({
        tenantId: mockTenantId,
        professionalId: mockProfessionalId,
        serviceIds: ['service-1'],
        date: baseDate,
      });

      // Assert
      expect(slots).toEqual([]);
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for available slot', async () => {
      // Arrange
      const slotStart = addDays(new Date(), 1);
      slotStart.setHours(10, 0, 0, 0);

      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.appointment.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.isSlotAvailable(
        mockTenantId,
        mockProfessionalId,
        slotStart,
        60,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when slot conflicts with existing appointment', async () => {
      // Arrange
      const slotStart = addDays(new Date(), 1);
      slotStart.setHours(10, 0, 0, 0);

      prisma.professionalSchedule.findFirst.mockResolvedValue({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      });
      prisma.professionalTimeBlock.findMany.mockResolvedValue([]);
      prisma.appointment.findFirst.mockResolvedValue({
        id: 'existing-appointment',
        scheduledAt: slotStart,
        endTime: addMinutes(slotStart, 60),
      });

      // Act
      const result = await service.isSlotAvailable(
        mockTenantId,
        mockProfessionalId,
        slotStart,
        60,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('calculateServicesDuration', () => {
    it('should sum durations of all services', async () => {
      // Arrange
      prisma.service.findMany.mockResolvedValue([
        { duration: 30 },
        { duration: 45 },
        { duration: 15 },
      ]);

      // Act
      const duration = await service.calculateServicesDuration(
        mockTenantId,
        ['service-1', 'service-2', 'service-3'],
      );

      // Assert
      expect(duration).toBe(90);
    });

    it('should return default duration when no services provided', async () => {
      // Act
      const duration = await service.calculateServicesDuration(mockTenantId, []);

      // Assert
      expect(duration).toBe(30);
    });
  });
});
