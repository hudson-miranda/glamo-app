import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  document?: string;
  birthDate?: string;
  gender?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  tags?: string[];
  source?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  document?: string;
  birthDate?: string;
  gender?: string;
  address?: Customer['address'];
  notes?: string;
  tags?: string[];
  source?: string;
}

export const customersService = {
  async list(query?: CustomerQuery): Promise<PaginatedResponse<Customer>> {
    const response = await api.get<PaginatedResponse<Customer>>('/customers', {
      params: query,
    });
    return response.data;
  },

  async getById(id: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> {
    const response = await api.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async search(term: string): Promise<Customer[]> {
    const response = await api.get<Customer[]>('/customers/search', {
      params: { q: term },
    });
    return response.data;
  },

  async getHistory(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/customers/${id}/history`);
    return response.data;
  },

  async addTags(id: string, tags: string[]): Promise<Customer> {
    const response = await api.post<Customer>(`/customers/${id}/tags`, { tags });
    return response.data;
  },

  async removeTags(id: string, tags: string[]): Promise<Customer> {
    const response = await api.delete<Customer>(`/customers/${id}/tags`, {
      data: { tags },
    });
    return response.data;
  },
};
