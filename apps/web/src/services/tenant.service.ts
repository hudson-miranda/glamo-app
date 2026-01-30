import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  primaryColor?: string;
}

export interface CreateTenantRequest {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  timezone?: string;
  primaryColor?: string;
  logo?: string;
}

export const tenantService = {
  async create(data: CreateTenantRequest): Promise<Tenant> {
    const response = await api.post<Tenant>('/tenants', data);
    return response.data;
  },

  async getCurrent(): Promise<Tenant> {
    const response = await api.get<Tenant>('/tenants/current');
    return response.data;
  },

  async update(data: UpdateTenantRequest): Promise<Tenant> {
    const response = await api.patch<Tenant>('/tenants/current', data);
    return response.data;
  },

  async getSettings(): Promise<any> {
    const response = await api.get('/tenants/settings');
    return response.data;
  },

  async updateSettings(settings: any): Promise<any> {
    const response = await api.patch('/tenants/settings', settings);
    return response.data;
  },
};
