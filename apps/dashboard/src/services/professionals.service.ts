import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Professional {
  id: string;
  name: string;
  email?: string;
  phone: string;
  document?: string;
  birthDate?: string;
  gender?: string;
  avatar?: string;
  bio?: string;
  specialties: string[];
  commissionRate: number;
  isActive: boolean;
  workingHours: WorkingHours[];
  services: string[];
  rating: number;
  totalAppointments: number;
  createdAt: string;
}

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
  breaks?: { start: string; end: string }[];
}

export interface ProfessionalQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  specialties?: string[];
  serviceId?: string;
}

export interface CreateProfessionalRequest {
  name: string;
  email?: string;
  phone: string;
  document?: string;
  birthDate?: string;
  gender?: string;
  bio?: string;
  specialties?: string[];
  commissionRate?: number;
  workingHours?: WorkingHours[];
  services?: string[];
}

export const professionalsService = {
  async list(query?: ProfessionalQuery): Promise<PaginatedResponse<Professional>> {
    const response = await api.get<PaginatedResponse<Professional>>('/professionals', {
      params: query,
    });
    return response.data;
  },

  async getById(id: string): Promise<Professional> {
    const response = await api.get<Professional>(`/professionals/${id}`);
    return response.data;
  },

  async create(data: CreateProfessionalRequest): Promise<Professional> {
    const response = await api.post<Professional>('/professionals', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateProfessionalRequest>): Promise<Professional> {
    const response = await api.patch<Professional>(`/professionals/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/professionals/${id}`);
  },

  async updateAvatar(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ url: string }>(`/professionals/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getSchedule(id: string, date: string): Promise<{ availableSlots: string[] }> {
    const response = await api.get<{ availableSlots: string[] }>(
      `/professionals/${id}/schedule`,
      { params: { date } }
    );
    return response.data;
  },

  async updateWorkingHours(id: string, workingHours: WorkingHours[]): Promise<Professional> {
    const response = await api.patch<Professional>(`/professionals/${id}/working-hours`, {
      workingHours,
    });
    return response.data;
  },
};
