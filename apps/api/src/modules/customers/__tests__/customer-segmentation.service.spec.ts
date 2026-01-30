import { Test, TestingModule } from '@nestjs/testing';
import { CustomerSegmentationService } from '../services/customer-segmentation.service';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SegmentType, SYSTEM_SEGMENTS } from '../interfaces';

describe('CustomerSegmentationService', () => {
  let service: CustomerSegmentationService;
  let prisma: jest.Mocked<PrismaService>;
  let tenantContext: jest.Mocked<TenantContext>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockSegment = {
    id: 'seg_123',
    tenantId: 'tenant_123',
    name: 'VIP',
    slug: 'vip',
    description: 'Clientes VIP',
    type: SegmentType.AUTOMATIC,
    color: '#FFD700',
    icon: 'star',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.totalSpent', operator: 'gte', value: 5000 },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer = {
    id: 'cust_123',
    tenantId: 'tenant_123',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '+5511999999999',
    tags: [],
    totalSpent: 6000,
    totalAppointments: 25,
    lastVisitAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerSegmentationService,
        {
          provide: PrismaService,
          useValue: {
            customerSegment: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            customerSegmentMember: {
              count: jest.fn(),
              findMany: jest.fn(),
              upsert: jest.fn(),
              deleteMany: jest.fn(),
            },
            customer: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
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

    service = module.get<CustomerSegmentationService>(CustomerSegmentationService);
    prisma = module.get(PrismaService);
    tenantContext = module.get(TenantContext);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listSegments', () => {
    it('should return segments with customer count', async () => {
      (prisma.customerSegment.findMany as jest.Mock).mockResolvedValue([mockSegment]);
      (prisma.customerSegmentMember.count as jest.Mock).mockResolvedValue(10);

      const result = await service.listSegments();

      expect(result).toHaveLength(1);
      expect(result[0].customerCount).toBe(10);
    });
  });

  describe('createSegment', () => {
    it('should create a new segment', async () => {
      (prisma.customerSegment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customerSegment.create as jest.Mock).mockResolvedValue({
        ...mockSegment,
        id: 'seg_new',
        name: 'Premium',
        slug: 'premium',
        isSystem: false,
      });

      const result = await service.createSegment({
        name: 'Premium',
        description: 'Clientes premium',
        type: SegmentType.SMART,
      });

      expect(result.name).toBe('Premium');
      expect(result.isSystem).toBe(false);
    });

    it('should throw error if slug already exists', async () => {
      (prisma.customerSegment.findFirst as jest.Mock).mockResolvedValue(mockSegment);

      await expect(
        service.createSegment({ name: 'VIP' }),
      ).rejects.toThrow();
    });
  });

  describe('updateSegment', () => {
    it('should update non-system segment', async () => {
      const nonSystemSegment = { ...mockSegment, isSystem: false };
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(nonSystemSegment);
      (prisma.customerSegment.update as jest.Mock).mockResolvedValue({
        ...nonSystemSegment,
        name: 'Premium Updated',
      });
      (prisma.customerSegmentMember.count as jest.Mock).mockResolvedValue(5);

      const result = await service.updateSegment('seg_123', {
        name: 'Premium Updated',
      });

      expect(result.name).toBe('Premium Updated');
    });

    it('should throw error when updating system segment', async () => {
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(mockSegment);

      await expect(
        service.updateSegment('seg_123', { name: 'New Name' }),
      ).rejects.toThrow('Segmentos do sistema não podem ser editados');
    });
  });

  describe('deleteSegment', () => {
    it('should delete non-system segment', async () => {
      const nonSystemSegment = { ...mockSegment, isSystem: false };
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(nonSystemSegment);
      (prisma.customerSegmentMember.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.customerSegment.delete as jest.Mock).mockResolvedValue(nonSystemSegment);

      await expect(service.deleteSegment('seg_123')).resolves.not.toThrow();
    });

    it('should throw error when deleting system segment', async () => {
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(mockSegment);

      await expect(service.deleteSegment('seg_123')).rejects.toThrow(
        'Segmentos do sistema não podem ser deletados',
      );
    });
  });

  describe('evaluateCustomerSegments', () => {
    it('should evaluate and assign matching segments', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.customerSegment.findMany as jest.Mock).mockResolvedValue([mockSegment]);
      (prisma.customerSegmentMember.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customerSegmentMember.upsert as jest.Mock).mockResolvedValue({});
      (prisma.customerSegmentMember.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await service.evaluateCustomerSegments('cust_123');

      expect(result).toContain('vip');
      expect(prisma.customerSegmentMember.upsert).toHaveBeenCalled();
    });

    it('should emit event when segments change', async () => {
      const customerWithLowSpent = { ...mockCustomer, totalSpent: 100 };
      
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(customerWithLowSpent);
      (prisma.customerSegment.findMany as jest.Mock).mockResolvedValue([mockSegment]);
      (prisma.customerSegmentMember.findMany as jest.Mock).mockResolvedValue([
        { segment: { slug: 'vip' } },
      ]);
      (prisma.customerSegmentMember.upsert as jest.Mock).mockResolvedValue({});
      (prisma.customerSegmentMember.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.evaluateCustomerSegments('cust_123');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'customer.segments_changed',
        expect.any(Object),
      );
    });
  });

  describe('addToSegment / removeFromSegment', () => {
    it('should add customers to manual segment', async () => {
      const manualSegment = { ...mockSegment, type: SegmentType.MANUAL, isSystem: false };
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(manualSegment);
      (prisma.customerSegmentMember.upsert as jest.Mock).mockResolvedValue({});

      await expect(
        service.addToSegment('seg_123', ['cust_1', 'cust_2']),
      ).resolves.not.toThrow();
    });

    it('should throw error when adding to non-manual segment', async () => {
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(mockSegment);

      await expect(
        service.addToSegment('seg_123', ['cust_1']),
      ).rejects.toThrow('Operação válida apenas para segmentos manuais');
    });

    it('should remove customers from manual segment', async () => {
      const manualSegment = { ...mockSegment, type: SegmentType.MANUAL, isSystem: false };
      (prisma.customerSegment.findUnique as jest.Mock).mockResolvedValue(manualSegment);
      (prisma.customerSegmentMember.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      await expect(
        service.removeFromSegment('seg_123', ['cust_1', 'cust_2']),
      ).resolves.not.toThrow();
    });
  });

  describe('initializeSystemSegments', () => {
    it('should create system segments if not exist', async () => {
      (prisma.customerSegment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customerSegment.create as jest.Mock).mockResolvedValue(mockSegment);

      await service.initializeSystemSegments();

      expect(prisma.customerSegment.create).toHaveBeenCalledTimes(SYSTEM_SEGMENTS.length);
    });

    it('should not create if already exists', async () => {
      (prisma.customerSegment.findFirst as jest.Mock).mockResolvedValue(mockSegment);

      await service.initializeSystemSegments();

      expect(prisma.customerSegment.create).not.toHaveBeenCalled();
    });
  });
});
