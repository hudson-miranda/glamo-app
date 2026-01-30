import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService, PlanType, SubscriptionStatus } from '@glamo/database';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: PrismaService;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Salon',
    slug: 'test-salon',
    isActive: true,
    settings: {},
    subscription: {
      id: 'sub-123',
      planType: PlanType.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
    },
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: { count: jest.fn().mockResolvedValue(5) },
    professional: { count: jest.fn().mockResolvedValue(3) },
    client: { count: jest.fn().mockResolvedValue(100) },
    appointment: { count: jest.fn().mockResolvedValue(50) },
    service: { count: jest.fn().mockResolvedValue(20) },
    product: { count: jest.fn().mockResolvedValue(15) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return tenant when found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-123');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        include: { subscription: true },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return tenant when found by slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('test-salon');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-salon' },
        include: { subscription: true },
      });
    });
  });

  describe('validateTenant', () => {
    it('should return valid for active tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.validateTenant('tenant-123');

      expect(result.valid).toBe(true);
      expect(result.tenant).toEqual(mockTenant);
    });

    it('should return invalid for non-existent tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.validateTenant('non-existent');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('não encontrado');
    });

    it('should return invalid for inactive tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        isActive: false,
      });

      const result = await service.validateTenant('tenant-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('desativado');
    });

    it('should return invalid for canceled subscription', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        subscription: {
          ...mockTenant.subscription,
          status: SubscriptionStatus.CANCELED,
        },
      });

      const result = await service.validateTenant('tenant-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('cancelada');
    });

    it('should return invalid for expired trial', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        subscription: {
          ...mockTenant.subscription,
          status: SubscriptionStatus.TRIALING,
          trialEndsAt: pastDate,
        },
      });

      const result = await service.validateTenant('tenant-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('teste expirado');
    });
  });

  describe('hasFeature', () => {
    it('should return true for enabled feature', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.hasFeature('tenant-123', 'marketing');

      expect(result).toBe(true); // PROFESSIONAL tem marketing
    });

    it('should return false for disabled feature', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        subscription: { ...mockTenant.subscription, planType: PlanType.STARTER },
      });

      const result = await service.hasFeature('tenant-123', 'marketing');

      expect(result).toBe(false); // STARTER não tem marketing
    });

    it('should return false for non-existent tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.hasFeature('non-existent', 'marketing');

      expect(result).toBe(false);
    });
  });

  describe('getLimit', () => {
    it('should return correct limit for plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getLimit('tenant-123', 'maxClients');

      expect(result).toBe(2000); // PROFESSIONAL limit
    });

    it('should return 0 for non-existent tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.getLimit('non-existent', 'maxClients');

      expect(result).toBe(0);
    });
  });

  describe('checkLimit', () => {
    it('should allow when under limit', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.checkLimit('tenant-123', 'maxClients', 100);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(100);
      expect(result.limit).toBe(2000);
    });

    it('should deny when at limit', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.checkLimit('tenant-123', 'maxClients', 2000);

      expect(result.allowed).toBe(false);
    });

    it('should always allow unlimited', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        subscription: { ...mockTenant.subscription, planType: PlanType.ENTERPRISE },
      });

      const result = await service.checkLimit('tenant-123', 'maxClients', 999999);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });
  });

  describe('enforceLimit', () => {
    it('should not throw when under limit', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.enforceLimit('tenant-123', 'maxClients', 100, 'clientes'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when at limit', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.enforceLimit('tenant-123', 'maxClients', 2000, 'clientes'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('enforceFeature', () => {
    it('should not throw when feature enabled', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.enforceFeature('tenant-123', 'marketing'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when feature disabled', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        subscription: { ...mockTenant.subscription, planType: PlanType.STARTER },
      });

      await expect(
        service.enforceFeature('tenant-123', 'marketing'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getUsageStats('tenant-123');

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('professionals');
      expect(result).toHaveProperty('clients');
      expect(result.users.current).toBe(5);
      expect(result.clients.current).toBe(100);
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate slug from name', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.generateUniqueSlug('Salão da Maria');

      expect(result).toBe('salao-da-maria');
    });

    it('should add suffix for duplicate slugs', async () => {
      mockPrisma.tenant.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const result = await service.generateUniqueSlug('Test Salon');

      expect(result).toBe('test-salon-2');
    });
  });
});
