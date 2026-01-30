import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  promotionalPrice?: number;
  categoryId: string;
  category?: ServiceCategory;
  isActive: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  professionals: string[];
  image?: string;
  sortOrder: number;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  servicesCount: number;
}

export interface ServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  professionalId?: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration: number;
  price: number;
  promotionalPrice?: number;
  categoryId: string;
  requiresDeposit?: boolean;
  depositAmount?: number;
  professionals?: string[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export const servicesService = {
  async list(query?: ServiceQuery): Promise<PaginatedResponse<Service>> {
    const response = await api.get<PaginatedResponse<Service>>('/services', {
      params: query,
    });
    return response.data;
  },

  async getById(id: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  async create(data: CreateServiceRequest): Promise<Service> {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateServiceRequest>): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  },

  async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
    await api.post('/services/reorder', { items });
  },

  // Categories
  async listCategories(): Promise<ServiceCategory[]> {
    const response = await api.get<ServiceCategory[]>('/services/categories');
    return response.data;
  },

  async getCategory(id: string): Promise<ServiceCategory> {
    const response = await api.get<ServiceCategory>(`/services/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<ServiceCategory> {
    const response = await api.post<ServiceCategory>('/services/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<CreateCategoryRequest>): Promise<ServiceCategory> {
    const response = await api.patch<ServiceCategory>(`/services/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/services/categories/${id}`);
  },
};
