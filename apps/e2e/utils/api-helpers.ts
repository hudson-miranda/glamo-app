import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

/**
 * Helper para autenticação nos testes de API
 */
export class ApiHelper {
  private accessToken: string | null = null;
  private tenantId: string | null = null;

  /**
   * Faz login e armazena o token
   */
  async login(email?: string, password?: string): Promise<void> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email || process.env.TEST_OWNER_EMAIL || 'owner@testsalon.com',
      password: password || process.env.TEST_OWNER_PASSWORD || 'Owner@123456',
    });

    this.accessToken = response.data.accessToken;
    this.tenantId = response.data.tenant?.id;
  }

  /**
   * Retorna headers de autenticação
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }
    
    return headers;
  }

  /**
   * Requisição GET autenticada
   */
  async get<T>(path: string): Promise<T> {
    const response = await axios.get(`${API_URL}${path}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  /**
   * Requisição POST autenticada
   */
  async post<T>(path: string, data: any): Promise<T> {
    const response = await axios.post(`${API_URL}${path}`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  /**
   * Requisição PATCH autenticada
   */
  async patch<T>(path: string, data: any): Promise<T> {
    const response = await axios.patch(`${API_URL}${path}`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  /**
   * Requisição DELETE autenticada
   */
  async delete(path: string): Promise<void> {
    await axios.delete(`${API_URL}${path}`, {
      headers: this.getHeaders(),
    });
  }
}

/**
 * Classe para gerenciar dados de teste e limpeza
 */
export class TestDataManager {
  private api: ApiHelper;
  private createdResources: { type: string; id: string }[] = [];

  constructor(api: ApiHelper) {
    this.api = api;
  }

  /**
   * Cria um cliente de teste e registra para limpeza
   */
  async createCustomer(data: any): Promise<any> {
    const customer = await this.api.post('/customers', data);
    this.createdResources.push({ type: 'customers', id: customer.id });
    return customer;
  }

  /**
   * Cria um serviço de teste e registra para limpeza
   */
  async createService(data: any): Promise<any> {
    const service = await this.api.post('/services', data);
    this.createdResources.push({ type: 'services', id: service.id });
    return service;
  }

  /**
   * Cria um agendamento de teste e registra para limpeza
   */
  async createAppointment(data: any): Promise<any> {
    const appointment = await this.api.post('/appointments', data);
    this.createdResources.push({ type: 'appointments', id: appointment.id });
    return appointment;
  }

  /**
   * Limpa todos os recursos criados durante o teste
   */
  async cleanup(): Promise<void> {
    // Deleta na ordem inversa da criação
    const resources = [...this.createdResources].reverse();
    
    for (const resource of resources) {
      try {
        await this.api.delete(`/${resource.type}/${resource.id}`);
      } catch (error) {
        console.warn(`Failed to cleanup ${resource.type}/${resource.id}:`, error);
      }
    }
    
    this.createdResources = [];
  }
}

/**
 * Helper para reset de banco de dados em testes
 */
export async function resetTestDatabase(): Promise<void> {
  try {
    await axios.post(`${API_URL}/test/reset-db`, {}, {
      headers: {
        'X-Test-Secret': process.env.TEST_SECRET || 'test-secret',
      },
    });
  } catch (error) {
    console.warn('Failed to reset test database:', error);
  }
}

/**
 * Helper para seed de dados de teste
 */
export async function seedTestData(): Promise<void> {
  try {
    await axios.post(`${API_URL}/test/seed`, {}, {
      headers: {
        'X-Test-Secret': process.env.TEST_SECRET || 'test-secret',
      },
    });
  } catch (error) {
    console.warn('Failed to seed test data:', error);
  }
}
