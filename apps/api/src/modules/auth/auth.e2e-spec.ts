import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '@glamo/database';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;
  let testTenantId: string;

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } }).catch(() => {});
    }
    if (testTenantId) {
      await prisma.tenant.deleteMany({ where: { id: testTenantId } }).catch(() => {});
    }
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new tenant and user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          businessName: 'Test Salon E2E',
          ownerName: 'Test Owner',
          document: '12345678000190',
          phone: '11999999999',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail.toLowerCase());
      expect(response.body.user.role).toBe('OWNER');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      testUserId = response.body.user.id;
      testTenantId = response.body.user.tenantId;
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          businessName: 'Another Salon',
          ownerName: 'Another Owner',
          document: '98765432000121',
          phone: '11888888888',
        })
        .expect(409);

      expect(response.body.message).toContain('já está cadastrado');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: testPassword,
          businessName: 'Salon',
          ownerName: 'Owner',
          document: '12345678000190',
          phone: '11999999999',
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should fail with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          businessName: 'Salon',
          ownerName: 'Owner',
          document: '12345678000190',
          phone: '11999999999',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user.email).toBe(testEmail.toLowerCase());

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('inválidos');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(response.body.message).toContain('inválidos');
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return current user when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testEmail.toLowerCase());
      expect(response.body).toHaveProperty('role', 'OWNER');
      expect(response.body).toHaveProperty('tenant');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Update tokens for next tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should accept request for existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body.message).toContain('Se o email existir');
    });

    it('should accept request for non-existent email (security)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('Se o email existir');
    });
  });

  describe('/auth/change-password (POST)', () => {
    it('should change password when authenticated', async () => {
      const newPassword = 'NewTestPassword123!';

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testPassword,
          newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain('Senha alterada');

      // Verify new password works
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('should fail with wrong current password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPassword123!',
        })
        .expect(400);
    });
  });

  describe('/auth/users (POST)', () => {
    it('should add new user to tenant when owner', async () => {
      const staffEmail = `staff-${Date.now()}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: staffEmail,
          name: 'Staff User',
          role: 'STAFF',
          phone: '11777777777',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(staffEmail.toLowerCase());
      expect(response.body.role).toBe('STAFF');

      // Cleanup
      await prisma.user.delete({ where: { id: response.body.id } }).catch(() => {});
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/users')
        .send({
          email: 'test@example.com',
          name: 'Test',
          role: 'STAFF',
        })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toContain('Logout realizado');
    });
  });
});
