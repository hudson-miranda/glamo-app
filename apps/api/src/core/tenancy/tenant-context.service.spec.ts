import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService, TenantContext } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Static methods', () => {
    describe('run', () => {
      it('should execute function within tenant context', () => {
        const context: TenantContext = {
          tenantId: 'tenant-123',
          slug: 'salon-test',
          planType: 'PROFESSIONAL',
        };

        const result = TenantContextService.run(context, () => {
          return TenantContextService.getCurrentTenantId();
        });

        expect(result).toBe('tenant-123');
      });

      it('should return undefined outside of context', () => {
        const tenantId = TenantContextService.getCurrentTenantId();
        expect(tenantId).toBeUndefined();
      });

      it('should isolate nested contexts', () => {
        const contextA: TenantContext = { tenantId: 'tenant-a' };
        const contextB: TenantContext = { tenantId: 'tenant-b' };

        TenantContextService.run(contextA, () => {
          expect(TenantContextService.getCurrentTenantId()).toBe('tenant-a');

          TenantContextService.run(contextB, () => {
            expect(TenantContextService.getCurrentTenantId()).toBe('tenant-b');
          });

          // Volta ao contexto A
          expect(TenantContextService.getCurrentTenantId()).toBe('tenant-a');
        });
      });
    });

    describe('runAsync', () => {
      it('should execute async function within tenant context', async () => {
        const context: TenantContext = {
          tenantId: 'tenant-async',
          slug: 'async-test',
        };

        const result = await TenantContextService.runAsync(context, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return TenantContextService.getCurrentTenantId();
        });

        expect(result).toBe('tenant-async');
      });

      it('should maintain context through await', async () => {
        const context: TenantContext = { tenantId: 'tenant-await' };

        await TenantContextService.runAsync(context, async () => {
          expect(TenantContextService.getCurrentTenantId()).toBe('tenant-await');

          await new Promise((resolve) => setTimeout(resolve, 10));

          expect(TenantContextService.getCurrentTenantId()).toBe('tenant-await');
        });
      });
    });

    describe('getStore', () => {
      it('should return full context', () => {
        const context: TenantContext = {
          tenantId: 'tenant-full',
          slug: 'full-test',
          planType: 'BUSINESS',
          features: ['marketing', 'loyalty'],
        };

        TenantContextService.run(context, () => {
          const store = TenantContextService.getStore();
          expect(store).toEqual(context);
        });
      });
    });

    describe('getCurrentTenantSlug', () => {
      it('should return tenant slug', () => {
        const context: TenantContext = {
          tenantId: 'tenant-slug',
          slug: 'my-salon',
        };

        TenantContextService.run(context, () => {
          expect(TenantContextService.getCurrentTenantSlug()).toBe('my-salon');
        });
      });
    });

    describe('getCurrentPlanType', () => {
      it('should return plan type', () => {
        const context: TenantContext = {
          tenantId: 'tenant-plan',
          planType: 'ENTERPRISE',
        };

        TenantContextService.run(context, () => {
          expect(TenantContextService.getCurrentPlanType()).toBe('ENTERPRISE');
        });
      });
    });

    describe('hasFeature', () => {
      it('should return true for existing feature', () => {
        const context: TenantContext = {
          tenantId: 'tenant-feature',
          features: ['marketing', 'loyalty', 'whatsapp'],
        };

        TenantContextService.run(context, () => {
          expect(TenantContextService.hasFeature('marketing')).toBe(true);
          expect(TenantContextService.hasFeature('loyalty')).toBe(true);
        });
      });

      it('should return false for non-existing feature', () => {
        const context: TenantContext = {
          tenantId: 'tenant-feature',
          features: ['marketing'],
        };

        TenantContextService.run(context, () => {
          expect(TenantContextService.hasFeature('loyalty')).toBe(false);
        });
      });

      it('should return false when no features', () => {
        const context: TenantContext = {
          tenantId: 'tenant-no-feature',
        };

        TenantContextService.run(context, () => {
          expect(TenantContextService.hasFeature('anything')).toBe(false);
        });
      });
    });

    describe('hasTenantContext', () => {
      it('should return true inside context', () => {
        const context: TenantContext = { tenantId: 'tenant-check' };

        TenantContextService.run(context, () => {
          expect(TenantContextService.hasTenantContext()).toBe(true);
        });
      });

      it('should return false outside context', () => {
        expect(TenantContextService.hasTenantContext()).toBe(false);
      });
    });
  });

  describe('Instance methods', () => {
    it('should work same as static methods', () => {
      const context: TenantContext = { tenantId: 'tenant-instance' };

      service.run(context, () => {
        expect(service.getCurrentTenantId()).toBe('tenant-instance');
        expect(service.hasTenantContext()).toBe(true);
      });
    });
  });
});
