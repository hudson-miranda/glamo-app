import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'customer' | 'alert' | 'review' | 'marketing' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    appointments: boolean;
    payments: boolean;
    marketing: boolean;
    reviews: boolean;
  };
  push: {
    enabled: boolean;
    appointments: boolean;
    payments: boolean;
    marketing: boolean;
    reviews: boolean;
  };
  sms: {
    enabled: boolean;
    appointments: boolean;
    payments: boolean;
  };
  whatsapp: {
    enabled: boolean;
    appointments: boolean;
    payments: boolean;
  };
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export const notificationsService = {
  async list(query?: NotificationQuery): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
      params: query,
    });
    return response.data;
  },

  async getStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>('/notifications/stats');
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async deleteAll(): Promise<void> {
    await api.delete('/notifications');
  },

  // Preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
  },

  async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put<NotificationPreferences>('/notifications/preferences', data);
    return response.data;
  },
};
