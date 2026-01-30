import api from '@/lib/api';

interface ListParams {
  limit?: number;
  offset?: number;
}

export const notificationsService = {
  async list(params: ListParams = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/notifications/${id}`);
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  async updatePreferences(data: any) {
    const response = await api.patch('/notifications/preferences', data);
    return response.data;
  },

  async registerDevice(token: string, platform: 'ios' | 'android' | 'web') {
    const response = await api.post('/notifications/devices', { token, platform });
    return response.data;
  },

  async unregisterDevice(token: string) {
    await api.delete('/notifications/devices', { data: { token } });
  },
};
