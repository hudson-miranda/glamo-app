import api from '@/lib/api';
import { format } from 'date-fns';

interface ListParams {
  status?: string;
  professionalId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const appointmentsService = {
  async list(params: ListParams = {}) {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  async getByDate(date: Date) {
    const response = await api.get('/appointments', {
      params: {
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'),
      },
    });
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  async confirm(id: string) {
    const response = await api.patch(`/appointments/${id}/confirm`);
    return response.data;
  },

  async complete(id: string) {
    const response = await api.patch(`/appointments/${id}/complete`);
    return response.data;
  },

  async noShow(id: string) {
    const response = await api.patch(`/appointments/${id}/no-show`);
    return response.data;
  },
};
