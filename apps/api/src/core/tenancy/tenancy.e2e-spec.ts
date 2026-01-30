import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService, PlanType, SubscriptionStatus } from '@glamo/database';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';

describe('Multi-Tenancy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantService: TenantService;

  let tenantA: any;
  let tenantB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    tenantService = app.get<TenantService>(TenantService);

    // Criar dois tenants de teste
    await setupTestTenants();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestTenants();
    await app.close();
  });

  async function setupTestTenants() {
    // Tenant A
    const registerA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `tenant-a-${Date.now()}@test.com`,
        password: 'Password123!',
        businessName: 'Tenant A Salon',
        ownerName: 'Owner A',
        document: '11111111000111',
        phone: '11111111111',
      });

    if (registerA.status === 201) {
      tokenA = registerA.body.accessToken;
      userA = registerA.body.user;
      tenantA = { id: userA.tenantId };
    }

    // Tenant B
    const registerB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `tenant-b-${Date.now()}@test.com`,
        password: 'Password123!',
        businessName: 'Tenant B Salon',
        ownerName: 'Owner B',
        document: '22222222000122',
        phone: '22222222222',
      });

    if (registerB.status === 201) {
      tokenB = registerB.body.accessToken;
      userB = registerB.body.user;
      tenantB = { id: userB.tenantId };
    }
  }

  async function cleanupTestTenants() {
    if (tenantA?.id) {
      await prisma.user.deleteMany({ where: { tenantId: tenantA.id } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { tenantId: tenantA.id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {});
    }
    if (tenantB?.id) {
      await prisma.user.deleteMany({ where: { tenantId: tenantB.id } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { tenantId: tenantB.id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {});
    }
  }

  describe('Data Isolation', () => {
    it('should isolate users between tenants', async () => {
      // Verificar que userA não vê userB
      const meA = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(meA.body.tenantId).toBe(tenantA.id);
      expect(meA.body.tenantId).not.toBe(tenantB.id);

      const meB = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(meB.body.tenantId).toBe(tenantB.id);
      expect(meB.body.tenantId).not.toBe(tenantA.id);
    });

    it('should not allow cross-tenant access via header', async () => {
      // Tentar acessar tenant B com token de A mas header de B
      // Deve usar o tenant do token, não do header
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Tenant-ID', tenantB.id)
        .expect(200);

      // Deve retornar dados do tenant A (do token)
      expect(response.body.tenantId).toBe(tenantA.id);
    });
  });

  describe('Tenant Resolution', () => {
    it('should resolve tenant from JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.tenantId).toBeDefined();
    });

    it('should resolve tenant from X-Tenant-ID header for public routes', async () => {
      // Para rotas públicas, o header pode ser usado
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', tenantA.id)
        .send({
          email: userA.email,
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.user.tenantId).toBe(tenantA.id);
    });
  });

  describe('TenantContextService', () => {
    it('should maintain context through async operations', async () => {
      const results: string[] = [];

      await TenantContextService.runAsync(
        { tenantId: 'test-context-123' },
        async () => {
          results.push(TenantContextService.getCurrentTenantId()!);

          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push(TenantContextService.getCurrentTenantId()!);

          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push(TenantContextService.getCurrentTenantId()!);
        },
      );

      expect(results).toEqual(['test-context-123', 'test-context-123', 'test-context-123']);
    });

    it('should isolate parallel contexts', async () => {
      const results: { context: string; value: string }[] = [];

      await Promise.all([
        TenantContextService.runAsync({ tenantId: 'context-1' }, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push({
            context: 'context-1',
            value: TenantContextService.getCurrentTenantId()!,
          });
        }),
        TenantContextService.runAsync({ tenantId: 'context-2' }, async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          results.push({
            context: 'context-2',
            value: TenantContextService.getCurrentTenantId()!,
          });
        }),
      ]);

      // Cada contexto deve ter seu próprio valor
      expect(results.find((r) => r.context === 'context-1')?.value).toBe('context-1');
      expect(results.find((r) => r.context === 'context-2')?.value).toBe('context-2');
    });
  });

  describe('Tenant Validation', () => {
    it('should validate active tenant', async () => {
      if (!tenantA?.id) return;

      const result = await tenantService.validateTenant(tenantA.id);

      expect(result.valid).toBe(true);
      expect(result.tenant).toBeDefined();
    });

    it('should invalidate non-existent tenant', async () => {
      const result = await tenantService.validateTenant('non-existent-id');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('não encontrado');
    });
  });

  describe('Plan Features', () => {
    it('should check feature availability', async () => {
      if (!tenantA?.id) return;

      // FREE plan should have online booking
      const hasOnlineBooking = await tenantService.hasFeature(
        tenantA.id,
        'onlineBooking',
      );
      expect(hasOnlineBooking).toBe(true);
    });

    it('should enforce limits', async () => {
      if (!tenantA?.id) return;

      // Check limit
      const limitCheck = await tenantService.checkLimit(
        tenantA.id,
        'maxClients',
        10,
      );

      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.limit).toBeGreaterThan(0);
    });
  });

  describe('Usage Statistics', () => {
    it('should return usage stats for tenant', async () => {
      if (!tenantA?.id) return;

      const stats = await tenantService.getUsageStats(tenantA.id);

      expect(stats).toHaveProperty('users');
      expect(stats).toHaveProperty('clients');
      expect(stats).toHaveProperty('appointmentsThisMonth');
      expect(stats.users.current).toBeGreaterThanOrEqual(1); // At least owner
    });
  });
});
