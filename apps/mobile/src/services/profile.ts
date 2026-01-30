import api from '@/lib/api';

export const profileService = {
  async get() {
    const response = await api.get('/profile');
    return response.data;
  },

  async update(data: any) {
    const response = await api.patch('/profile', data);
    return response.data;
  },

  async updateAvatar(formData: FormData) {
    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getStats() {
    const response = await api.get('/profile/stats');
    return response.data;
  },

  async getSchedule() {
    const response = await api.get('/profile/schedule');
    return response.data;
  },

  async updateSchedule(data: any) {
    const response = await api.patch('/profile/schedule', data);
    return response.data;
  },
};
