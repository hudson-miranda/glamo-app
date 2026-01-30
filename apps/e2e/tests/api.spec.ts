import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

describe('API Health Check', () => {
  test('should return healthy status', async () => {
    const response = await axios.get(`${API_URL}/health`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'ok');
  });
});

describe('Authentication API', () => {
  const testUser = {
    email: process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
    password: process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
  };

  let accessToken: string;
  let refreshToken: string;

  test('should login with valid credentials', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('refreshToken');
    expect(response.data).toHaveProperty('user');
    expect(response.data).toHaveProperty('tenant');

    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
  });

  test('should reject invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword',
      });
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });

  test('should refresh token', async () => {
    // Primeiro fazer login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
    refreshToken = loginResponse.data.refreshToken;

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('refreshToken');
  });

  test('should get current user with valid token', async () => {
    // Primeiro fazer login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
    accessToken = loginResponse.data.accessToken;

    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('email');
  });

  test('should reject request without token', async () => {
    try {
      await axios.get(`${API_URL}/auth/me`);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });
});

describe('Services API', () => {
  let accessToken: string;
  const tenantId = process.env.TEST_TENANT_ID || 'test-tenant-id';

  beforeAll(async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
      password: process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
    });
    accessToken = response.data.accessToken;
  });

  const headers = () => ({
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-ID': tenantId,
  });

  test('should list services', async () => {
    const response = await axios.get(`${API_URL}/services`, { headers: headers() });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should create service', async () => {
    const newService = {
      name: `API Test Service ${Date.now()}`,
      duration: 30,
      price: 5000,
      description: 'Test service created via API',
    };

    const response = await axios.post(`${API_URL}/services`, newService, { headers: headers() });
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe(newService.name);
  });

  test('should get service by id', async () => {
    // Primeiro criar um serviço
    const createResponse = await axios.post(
      `${API_URL}/services`,
      {
        name: `Get Test Service ${Date.now()}`,
        duration: 30,
        price: 5000,
      },
      { headers: headers() }
    );

    const response = await axios.get(`${API_URL}/services/${createResponse.data.id}`, {
      headers: headers(),
    });
    
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(createResponse.data.id);
  });

  test('should update service', async () => {
    // Primeiro criar um serviço
    const createResponse = await axios.post(
      `${API_URL}/services`,
      {
        name: `Update Test Service ${Date.now()}`,
        duration: 30,
        price: 5000,
      },
      { headers: headers() }
    );

    const response = await axios.patch(
      `${API_URL}/services/${createResponse.data.id}`,
      { price: 6000 },
      { headers: headers() }
    );
    
    expect(response.status).toBe(200);
    expect(response.data.price).toBe(6000);
  });

  test('should delete service', async () => {
    // Primeiro criar um serviço
    const createResponse = await axios.post(
      `${API_URL}/services`,
      {
        name: `Delete Test Service ${Date.now()}`,
        duration: 30,
        price: 5000,
      },
      { headers: headers() }
    );

    const response = await axios.delete(`${API_URL}/services/${createResponse.data.id}`, {
      headers: headers(),
    });
    
    expect(response.status).toBe(204);
  });
});

describe('Customers API', () => {
  let accessToken: string;
  const tenantId = process.env.TEST_TENANT_ID || 'test-tenant-id';

  beforeAll(async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
      password: process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
    });
    accessToken = response.data.accessToken;
  });

  const headers = () => ({
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-ID': tenantId,
  });

  test('should list customers', async () => {
    const response = await axios.get(`${API_URL}/customers`, { headers: headers() });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should create customer', async () => {
    const newCustomer = {
      name: 'API Test Customer',
      email: `api.test.${Date.now()}@email.com`,
      phone: '11999998888',
    };

    const response = await axios.post(`${API_URL}/customers`, newCustomer, { headers: headers() });
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe(newCustomer.name);
  });

  test('should search customers', async () => {
    const response = await axios.get(`${API_URL}/customers?search=teste`, { headers: headers() });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});

describe('Appointments API', () => {
  let accessToken: string;
  const tenantId = process.env.TEST_TENANT_ID || 'test-tenant-id';

  beforeAll(async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
      password: process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
    });
    accessToken = response.data.accessToken;
  });

  const headers = () => ({
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-ID': tenantId,
  });

  test('should list appointments', async () => {
    const response = await axios.get(`${API_URL}/appointments`, { headers: headers() });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should filter appointments by date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(`${API_URL}/appointments?startDate=${today}`, {
      headers: headers(),
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should filter appointments by status', async () => {
    const response = await axios.get(`${API_URL}/appointments?status=scheduled`, {
      headers: headers(),
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});

describe('Public Booking API', () => {
  const tenantSlug = process.env.TEST_TENANT_SLUG || 'test-salon';

  test('should get tenant by slug', async () => {
    const response = await axios.get(`${API_URL}/public/tenants/${tenantSlug}`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('name');
  });

  test('should get public services', async () => {
    // Primeiro pegar o tenant
    const tenantResponse = await axios.get(`${API_URL}/public/tenants/${tenantSlug}`);
    const tenantId = tenantResponse.data.id;

    const response = await axios.get(`${API_URL}/public/tenants/${tenantId}/services`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should get public professionals', async () => {
    const tenantResponse = await axios.get(`${API_URL}/public/tenants/${tenantSlug}`);
    const tenantId = tenantResponse.data.id;

    const response = await axios.get(`${API_URL}/public/tenants/${tenantId}/professionals`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should get available slots', async () => {
    const tenantResponse = await axios.get(`${API_URL}/public/tenants/${tenantSlug}`);
    const tenantId = tenantResponse.data.id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];

    const response = await axios.get(
      `${API_URL}/public/tenants/${tenantId}/available-slots?date=${date}&duration=30`
    );
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
