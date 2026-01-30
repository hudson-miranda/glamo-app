import { Test, TestingModule } from '@nestjs/testing';
import { CustomerMergeService } from '../services/customer-merge.service';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';

describe('CustomerMergeService', () => {
  let service: CustomerMergeService;
  let prisma: jest.Mocked<PrismaService>;
  let tenantContext: jest.Mocked<TenantContext>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockCustomer1 = {
    id: 'cust_1',
    tenantId: 'tenant_123',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '+5511999999999',
    cpf: '12345678900',
    tags: ['vip'],
    loyaltyPoints: 100,
    totalAppointments: 10,
    completedAppointments: 8,
    cancelledAppointments: 1,
    noShowCount: 1,
    totalSpent: 1000,
    lastVisitAt: new Date(),
    createdAt: new Date('2023-01-01'),
  };

  const mockCustomer2 = {
    id: 'cust_2',
    tenantId: 'tenant_123',
    name: 'Maria S.',
    email: null,
    phone: '+5511999999999',
    cpf: null,
    tags: ['premium'],
    loyaltyPoints: 50,
    totalAppointments: 5,
    completedAppointments: 4,
    cancelledAppointments: 1,
    noShowCount: 0,
    totalSpent: 500,
    lastVisitAt: new Date(),
    createdAt: new Date('2023-06-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerMergeService,
        {
          provide: PrismaService,
          useValue: {
            customer: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            appointment: {
              updateMany: jest.fn(),
            },
            loyaltyTransaction: {
              updateMany: jest.fn(),
            },
            customerNote: {
              updateMany: jest.fn(),
            },
            review: {
              updateMany: jest.fn(),
            },
            customerMergeLog: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
            $queryRawUnsafe: jest.fn(),
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

    service = module.get<CustomerMergeService>(CustomerMergeService);
    prisma = module.get(PrismaService);
    tenantContext = module.get(TenantContext);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDuplicates', () => {
    it('should find duplicates by phone', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
        { value: '+5511999999999', count: BigInt(2) },
      ]);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        mockCustomer1,
        mockCustomer2,
      ]);

      const result = await service.findDuplicates({
        fields: ['phone'],
      });

      expect(result.totalGroups).toBe(1);
      expect(result.groups[0].matchField).toBe('phone');
      expect(result.groups[0].customerIds).toHaveLength(2);
    });

    it('should suggest customer with more appointments as primary', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
        { value: '+5511999999999', count: BigInt(2) },
      ]);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        mockCustomer1,
        mockCustomer2,
      ]);

      const result = await service.findDuplicates({
        fields: ['phone'],
      });

      expect(result.groups[0].suggestedPrimaryId).toBe('cust_1');
    });

    it('should find duplicates by multiple fields', async () => {
      (prisma.$queryRawUnsafe as jest.Mock)
        .mockResolvedValueOnce([{ value: '+5511999999999', count: BigInt(2) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        mockCustomer1,
        mockCustomer2,
      ]);

      const result = await service.findDuplicates({
        fields: ['phone', 'email', 'cpf'],
      });

      expect(result.totalGroups).toBe(1);
    });
  });

  describe('mergeCustomers', () => {
    it('should merge customers successfully', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer1);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([mockCustomer2]);
      
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          appointment: { updateMany: jest.fn().mockResolvedValue({ count: 5 }) },
          customer: { update: jest.fn().mockResolvedValue(mockCustomer1) },
          loyaltyTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
          customerNote: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          review: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          customerMergeLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.mergeCustomers({
        primaryCustomerId: 'cust_1',
        mergeCustomerIds: ['cust_2'],
      });

      expect(result.success).toBe(true);
      expect(result.customerId).toBe('cust_1');
      expect(result.mergedCount).toBe(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.merged',
        expect.any(Object),
      );
    });

    it('should throw error if primary customer not found', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.mergeCustomers({
          primaryCustomerId: 'nonexistent',
          mergeCustomerIds: ['cust_2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if merge customer not found', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer1);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.mergeCustomers({
          primaryCustomerId: 'cust_1',
          mergeCustomerIds: ['nonexistent'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if trying to merge with self', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer1);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([mockCustomer1]);

      await expect(
        service.mergeCustomers({
          primaryCustomerId: 'cust_1',
          mergeCustomerIds: ['cust_1'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sum loyalty points when configured', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer1);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([mockCustomer2]);
      
      let capturedData: any;
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          appointment: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          customer: {
            update: jest.fn().mockImplementation((args) => {
              capturedData = args.data;
              return mockCustomer1;
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          loyaltyTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          customerNote: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          review: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          customerMergeLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.mergeCustomers({
        primaryCustomerId: 'cust_1',
        mergeCustomerIds: ['cust_2'],
        sumLoyaltyPoints: true,
      });

      expect(result.totalLoyaltyPoints).toBe(150); // 100 + 50
    });
  });
});
