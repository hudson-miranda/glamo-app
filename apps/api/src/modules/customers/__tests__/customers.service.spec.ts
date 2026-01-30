import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from '../customers.service';
import { CustomersRepository } from '../repositories';
import {
  CustomerAnalyticsService,
  CustomerSegmentationService,
  CustomerMergeService,
  CustomerImportService,
} from '../services';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: jest.Mocked<CustomersRepository>;
  let analyticsService: jest.Mocked<CustomerAnalyticsService>;
  let segmentationService: jest.Mocked<CustomerSegmentationService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockCustomer = {
    id: 'cust_123',
    tenantId: 'tenant_123',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '+5511999999999',
    cpf: '12345678900',
    birthDate: new Date('1990-05-15'),
    gender: 'F',
    tags: ['vip'],
    acceptsMarketing: true,
    loyaltyPoints: 100,
    totalAppointments: 5,
    completedAppointments: 4,
    totalSpent: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: CustomersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByPhone: jest.fn(),
            findByEmail: jest.fn(),
            findByCpf: jest.fn(),
            findMany: jest.fn(),
            updateAndReturn: jest.fn(),
            softDelete: jest.fn(),
            addTags: jest.fn(),
            removeTags: jest.fn(),
            addLoyaltyPoints: jest.fn(),
            updateLoyaltyTier: jest.fn(),
            getStats: jest.fn(),
            findBirthdays: jest.fn(),
            findInactive: jest.fn(),
            findBySegment: jest.fn(),
          },
        },
        {
          provide: CustomerAnalyticsService,
          useValue: {
            getCustomerAnalytics: jest.fn(),
            getCustomerTimeline: jest.fn(),
            recalculateMetrics: jest.fn(),
          },
        },
        {
          provide: CustomerSegmentationService,
          useValue: {
            evaluateCustomerSegments: jest.fn(),
            listSegments: jest.fn(),
            createSegment: jest.fn(),
            updateSegment: jest.fn(),
            deleteSegment: jest.fn(),
          },
        },
        {
          provide: CustomerMergeService,
          useValue: {
            findDuplicates: jest.fn(),
            mergeCustomers: jest.fn(),
          },
        },
        {
          provide: CustomerImportService,
          useValue: {
            validateFile: jest.fn(),
            importCustomers: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            customerNote: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            loyaltyTransaction: {
              create: jest.fn(),
            },
            appointment: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: TenantContext,
          useValue: {
            getTenantId: jest.fn().mockReturnValue('tenant_123'),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get(CustomersRepository);
    analyticsService = module.get(CustomerAnalyticsService);
    segmentationService = module.get(CustomerSegmentationService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCustomer);
      segmentationService.evaluateCustomerSegments.mockResolvedValue([]);

      const result = await service.create({
        name: 'Maria Silva',
        phone: '+5511999999999',
        email: 'maria@email.com',
      });

      expect(result).toEqual(mockCustomer);
      expect(repository.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.created',
        expect.any(Object),
      );
    });

    it('should throw ConflictException if phone already exists', async () => {
      repository.findByPhone.mockResolvedValue(mockCustomer);

      await expect(
        service.create({
          name: 'Maria Silva',
          phone: '+5511999999999',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(mockCustomer);

      await expect(
        service.create({
          name: 'Maria Silva',
          phone: '+5511888888888',
          email: 'maria@email.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return customer if found', async () => {
      repository.findById.mockResolvedValue(mockCustomer);

      const result = await service.findById('cust_123');

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Maria Santos' };
      repository.findById.mockResolvedValue(mockCustomer);
      repository.updateAndReturn.mockResolvedValue(updatedCustomer);
      segmentationService.evaluateCustomerSegments.mockResolvedValue([]);

      const result = await service.update('cust_123', {
        name: 'Maria Santos',
      });

      expect(result.name).toBe('Maria Santos');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.updated',
        expect.any(Object),
      );
    });

    it('should throw ConflictException if new email already in use', async () => {
      const otherCustomer = { ...mockCustomer, id: 'cust_456' };
      repository.findById.mockResolvedValue(mockCustomer);
      repository.findByEmail.mockResolvedValue(otherCustomer);

      await expect(
        service.update('cust_123', { email: 'other@email.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should soft delete customer', async () => {
      repository.findById.mockResolvedValue(mockCustomer);
      repository.softDelete.mockResolvedValue({ count: 1 });

      await service.delete('cust_123', 'user_123', 'Requested by customer');

      expect(repository.softDelete).toHaveBeenCalledWith('cust_123');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.deleted',
        expect.any(Object),
      );
    });
  });

  describe('updateTags', () => {
    it('should add and remove tags', async () => {
      const updatedCustomer = { ...mockCustomer, tags: ['vip', 'premium'] };
      repository.findById
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(updatedCustomer);
      repository.addTags.mockResolvedValue(updatedCustomer);
      repository.removeTags.mockResolvedValue(updatedCustomer);

      const result = await service.updateTags('cust_123', {
        addTags: ['premium'],
        removeTags: ['old-tag'],
      });

      expect(repository.addTags).toHaveBeenCalledWith('cust_123', ['premium']);
      expect(repository.removeTags).toHaveBeenCalledWith('cust_123', ['old-tag']);
    });
  });

  describe('addLoyaltyPoints', () => {
    it('should add points and check tier change', async () => {
      const updatedCustomer = { ...mockCustomer, loyaltyPoints: 600 };
      repository.findById
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(updatedCustomer);
      repository.addLoyaltyPoints.mockResolvedValue(updatedCustomer);

      // Mock prisma transaction
      const prisma = service['prisma'];
      (prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({
        id: 'tx_123',
      });

      const result = await service.addLoyaltyPoints('cust_123', {
        points: 500,
        description: 'Agendamento concluído',
      });

      expect(repository.addLoyaltyPoints).toHaveBeenCalledWith('cust_123', 500);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.loyalty.points_added',
        expect.any(Object),
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return customer analytics', async () => {
      const mockAnalytics = {
        customerId: 'cust_123',
        customerName: 'Maria Silva',
        financial: { totalSpent: 500 },
        behavior: { favoriteServices: [] },
        engagement: { appointmentHistory: {} },
        loyalty: { currentTier: 'BRONZE' },
        segments: ['vip'],
        calculatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockCustomer);
      analyticsService.getCustomerAnalytics.mockResolvedValue(mockAnalytics as any);

      const result = await service.getAnalytics('cust_123');

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getStats', () => {
    it('should return customer statistics', async () => {
      const mockStats = {
        total: 100,
        active: 80,
        newThisMonth: 10,
        churned: 5,
        retentionRate: 95,
      };

      repository.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getBirthdays', () => {
    it('should return birthday customers for current month', async () => {
      const birthdayCustomers = [mockCustomer];
      repository.findBirthdays.mockResolvedValue(birthdayCustomers);

      const result = await service.getBirthdays();

      expect(result).toEqual(birthdayCustomers);
      expect(repository.findBirthdays).toHaveBeenCalled();
    });
  });

  describe('getInactiveCustomers', () => {
    it('should return inactive customers', async () => {
      const inactiveCustomers = [mockCustomer];
      repository.findInactive.mockResolvedValue(inactiveCustomers);

      const result = await service.getInactiveCustomers(90);

      expect(result).toEqual(inactiveCustomers);
      expect(repository.findInactive).toHaveBeenCalledWith(90);
    });
  });

  describe('segments', () => {
    it('should list segments', async () => {
      const mockSegments = [{ id: 'seg_1', name: 'VIP' }];
      segmentationService.listSegments.mockResolvedValue(mockSegments as any);

      const result = await service.listSegments();

      expect(result).toEqual(mockSegments);
    });

    it('should create segment', async () => {
      const newSegment = { id: 'seg_2', name: 'Premium' };
      segmentationService.createSegment.mockResolvedValue(newSegment as any);

      const result = await service.createSegment({ name: 'Premium' });

      expect(result).toEqual(newSegment);
    });
  });
});
