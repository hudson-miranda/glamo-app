import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { addHours } from 'date-fns';
import { AppointmentsModule } from '../appointments.module';
import { PrismaService } from '@core/database/prisma.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/tenancy/guards/tenant.guard';
import { TenantContextService } from '@core/tenancy/tenant-context.service';
import { AppointmentStatus } from '@glamo/database';

describe('Appointments E2E', () => {
  let app: INestApplication;
  let prisma: jest.Mocked<PrismaService>;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      id: 'client-123',
      name: 'Test Client',
      email: 'client@test.com',
      phone: '+5511999999999',
    },
    professional: {
      id: 'professional-123',
      user: {
        id: 'user-pro-123',
        name: 'Test Professional',
        email: 'pro@test.com',
      },
    },
    services: [],
  };

  beforeAll(async () => {
    const mockPrisma = {
      appointment: {
        create: jest.fn().mockResolvedValue(mockAppointment),
        findFirst: jest.fn().mockResolvedValue(mockAppointment),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        findUnique: jest.fn().mockResolvedValue(mockAppointment),
        update: jest.fn().mockResolvedValue(mockAppointment),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      service: {
        findUnique: jest.fn().mockResolvedValue({ price: 100, duration: 60 }),
        findMany: jest.fn().mockResolvedValue([{ duration: 60 }]),
      },
      professional: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'professional-123',
          slotInterval: 30,
          user: { name: 'Test Professional' },
        }),
      },
      professionalSchedule: {
        findFirst: jest.fn().mockResolvedValue({
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        }),
      },
      professionalTimeBlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      tenantSettings: {
        findUnique: jest.fn().mockResolvedValue({
          minAdvanceBooking: 60,
          maxAdvanceBooking: 43200,
          defaultSlotInterval: 30,
        }),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: mockTenantId,
          plan: 'PROFESSIONAL',
        }),
      },
      appointmentService: {
        create: jest.fn(),
      },
      appointmentReminder: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const mockTenantContext = {
      getCurrentTenantId: jest.fn().mockReturnValue(mockTenantId),
      hasFeature: jest.fn().mockReturnValue(true),
      run: jest.fn((tenantId, callback) => callback()),
      runAsync: jest.fn((tenantId, callback) => callback()),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(TenantContextService)
      .useValue(mockTenantContext)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: mockUserId, tenantId: mockTenantId };
          return true;
        }),
      })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /appointments', () => {
    it('should create an appointment', async () => {
      const createDto = {
        clientId: 'client-123',
        professionalId: 'professional-123',
        services: [{ serviceId: 'service-123' }],
        scheduledAt: addHours(new Date(), 24).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should validate services array', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send({
          clientId: 'client-123',
          professionalId: 'professional-123',
          services: [],
          scheduledAt: addHours(new Date(), 24).toISOString(),
        })
        .expect(400);

      expect(response.body.message).toContain('Pelo menos um serviço');
    });
  });

  describe('GET /appointments', () => {
    it('should list appointments', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments')
        .query({ status: AppointmentStatus.PENDING })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter by date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = addHours(new Date(), 48).toISOString();

      const response = await request(app.getHttpServer())
        .get('/appointments')
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /appointments/:id', () => {
    it('should get appointment by id', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments/appointment-123')
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/appointments/invalid-id')
        .expect(400);
    });
  });

  describe('POST /appointments/:id/confirm', () => {
    it('should confirm an appointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments/appointment-123/confirm')
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('POST /appointments/:id/cancel', () => {
    it('should cancel an appointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments/appointment-123/cancel')
        .send({ reason: 'CLIENT_REQUEST' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('POST /appointments/:id/reschedule', () => {
    it('should reschedule an appointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/appointments/appointment-123/reschedule')
        .send({
          newScheduledAt: addHours(new Date(), 48).toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('GET /appointments/availability/slots', () => {
    it('should get available slots', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments/availability/slots')
        .query({
          professionalId: 'professional-123',
          date: addHours(new Date(), 24).toISOString(),
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /appointments/stats/status-count', () => {
    it('should get status counts', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments/stats/status-count')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
