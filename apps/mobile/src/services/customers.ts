import api from '@/lib/api';

interface ListParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export const customersService = {
  async list(params: ListParams = {}) {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/customers/${id}`);
  },

  async getHistory(id: string) {
    const response = await api.get(`/customers/${id}/history`);
    return response.data;
  },

  async getNotes(id: string) {
    const response = await api.get(`/customers/${id}/notes`);
    return response.data;
  },

  async addNote(id: string, content: string) {
    const response = await api.post(`/customers/${id}/notes`, { content });
    return response.data;
  },
};
