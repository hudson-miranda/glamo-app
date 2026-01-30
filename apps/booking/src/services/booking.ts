import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings?: {
    bookingLeadTime: number;
    bookingWindowDays: number;
    cancellationPolicy?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: {
    id: string;
    name: string;
  };
}

export interface Professional {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
}

export interface AvailableSlotsParams {
  date: string;
  professionalId?: string;
  duration: number;
}

export interface CreateBookingData {
  tenantId: string;
  serviceIds: string[];
  professionalId?: string | null;
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: string;
}

export const bookingService = {
  async getTenantBySlug(slug: string): Promise<Tenant> {
    const response = await api.get(`/public/tenants/${slug}`);
    return response.data;
  },

  async getServices(tenantId: string): Promise<Service[]> {
    const response = await api.get(`/public/tenants/${tenantId}/services`);
    return response.data;
  },

  async getServiceCategories(tenantId: string): Promise<any[]> {
    const response = await api.get(`/public/tenants/${tenantId}/service-categories`);
    return response.data;
  },

  async getProfessionals(tenantId: string, serviceIds: string[]): Promise<Professional[]> {
    const response = await api.get(`/public/tenants/${tenantId}/professionals`, {
      params: { serviceIds: serviceIds.join(',') },
    });
    return response.data;
  },

  async getAvailableSlots(tenantId: string, params: AvailableSlotsParams): Promise<string[]> {
    const response = await api.get(`/public/tenants/${tenantId}/available-slots`, {
      params,
    });
    return response.data;
  },

  async createBooking(data: CreateBookingData): Promise<{ id: string }> {
    const response = await api.post('/public/bookings', data);
    return response.data;
  },

  async getBooking(id: string): Promise<any> {
    const response = await api.get(`/public/bookings/${id}`);
    return response.data;
  },

  async cancelBooking(id: string, reason?: string): Promise<void> {
    await api.patch(`/public/bookings/${id}/cancel`, { reason });
  },
};
