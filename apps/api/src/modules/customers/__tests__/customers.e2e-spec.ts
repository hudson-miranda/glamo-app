import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CustomersModule } from '../customers.module';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';

describe('CustomersController (e2e)', () => {
  let app: INestApplication;
  let prisma: jest.Mocked<PrismaService>;

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
    loyaltyTier: 'BRONZE',
    totalAppointments: 5,
    completedAppointments: 4,
    totalSpent: 500,
    address: {},
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    customer: {
      create: jest.fn().mockResolvedValue(mockCustomer),
      findFirst: jest.fn().mockResolvedValue(mockCustomer),
      findMany: jest.fn().mockResolvedValue([mockCustomer]),
      findUnique: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(1),
    },
    customerSegment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    customerSegmentMember: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    customerNote: {
      create: jest.fn().mockResolvedValue({ id: 'note_1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    loyaltyTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx_1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    loyaltyRedemption: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    appointment: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { finalPrice: null }, _count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    appointmentService: {
      groupBy: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    service: {
      findUnique: jest.fn().mockResolvedValue({ name: 'Corte' }),
    },
    professional: {
      findUnique: jest.fn().mockResolvedValue({ name: 'João' }),
    },
    review: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: 0 }),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CustomersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(TenantContext)
      .useValue({
        getTenantId: jest.fn().mockReturnValue('tenant_123'),
      })
      .overrideProvider(EventEmitter2)
      .useValue({
        emit: jest.fn(),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .overrideGuard(TenantGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /customers', () => {
    it('should create a customer', async () => {
      mockPrisma.customer.findFirst
        .mockResolvedValueOnce(null) // findByPhone
        .mockResolvedValueOnce(null); // findByEmail

      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Maria Silva',
          phone: '+5511999999999',
          email: 'maria@email.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Maria Silva');
    });

    it('should return 409 if phone already exists', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce(mockCustomer);

      await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Maria Silva',
          phone: '+5511999999999',
        })
        .expect(409);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({
          email: 'maria@email.com',
        })
        .expect(400);
    });
  });

  describe('GET /customers', () => {
    it('should return paginated customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('should filter by search term', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .query({ search: 'Maria' })
        .expect(200);
    });

    it('should filter by tags', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .query({ tags: ['vip'] })
        .expect(200);
    });
  });

  describe('GET /customers/:id', () => {
    it('should return customer details', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/cust_123')
        .expect(200);

      expect(response.body.id).toBe('cust_123');
    });

    it('should return 404 if not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/customers/nonexistent')
        .expect(404);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('should update customer', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Maria Santos' };
      mockPrisma.customer.update.mockResolvedValueOnce(updatedCustomer);

      const response = await request(app.getHttpServer())
        .patch('/customers/cust_123')
        .send({ name: 'Maria Santos' })
        .expect(200);

      expect(response.body.name).toBe('Maria Santos');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should soft delete customer', async () => {
      await request(app.getHttpServer())
        .delete('/customers/cust_123')
        .expect(204);
    });
  });

  describe('GET /customers/:id/analytics', () => {
    it('should return customer analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/cust_123/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('customerId');
      expect(response.body).toHaveProperty('financial');
      expect(response.body).toHaveProperty('behavior');
      expect(response.body).toHaveProperty('engagement');
      expect(response.body).toHaveProperty('loyalty');
    });
  });

  describe('GET /customers/:id/history', () => {
    it('should return appointment history', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/cust_123/history')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('POST /customers/:id/loyalty/points', () => {
    it('should add loyalty points', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/cust_123/loyalty/points')
        .send({
          points: 50,
          description: 'Agendamento concluído',
        })
        .expect(200);

      expect(response.body).toHaveProperty('loyaltyPoints');
    });
  });

  describe('GET /customers/stats', () => {
    it('should return customer statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
    });
  });

  describe('GET /customers/segments', () => {
    it('should return segments list', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/segments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /customers/segments', () => {
    it('should create a new segment', async () => {
      mockPrisma.customerSegment.create.mockResolvedValueOnce({
        id: 'seg_new',
        name: 'Premium',
        slug: 'premium',
        type: 'SMART',
        isSystem: false,
      });

      const response = await request(app.getHttpServer())
        .post('/customers/segments')
        .send({
          name: 'Premium',
          description: 'Clientes premium',
        })
        .expect(201);

      expect(response.body.name).toBe('Premium');
    });
  });

  describe('POST /customers/bulk-update', () => {
    it('should update multiple customers', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/bulk-update')
        .send({
          customerIds: ['cust_1', 'cust_2'],
          data: { acceptsMarketing: false },
        })
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /customers/duplicates/find', () => {
    it('should find duplicate customers', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/duplicates/find')
        .send({
          fields: ['phone', 'email'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalGroups');
      expect(response.body).toHaveProperty('groups');
    });
  });
});
