import api from '@/lib/api';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  totalPrice: number;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  professional: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
  createdAt: string;
}

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  customerId?: string;
}

export interface CreateAppointmentRequest {
  customerId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export const appointmentsService = {
  async list(query?: AppointmentQuery): Promise<PaginatedResponse<Appointment>> {
    const response = await api.get<PaginatedResponse<Appointment>>('/appointments', {
      params: query,
    });
    return response.data;
  },

  async getById(id: string): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateAppointmentRequest>): Promise<Appointment> {
    const response = await api.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const response = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  },

  async confirm(id: string): Promise<Appointment> {
    const response = await api.post<Appointment>(`/appointments/${id}/confirm`);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const response = await api.post<Appointment>(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  async complete(id: string): Promise<Appointment> {
    const response = await api.post<Appointment>(`/appointments/${id}/complete`);
    return response.data;
  },

  async reschedule(id: string, date: string, startTime: string): Promise<Appointment> {
    const response = await api.post<Appointment>(`/appointments/${id}/reschedule`, {
      date,
      startTime,
    });
    return response.data;
  },

  async getAvailableSlots(
    professionalId: string,
    serviceId: string,
    date: string,
  ): Promise<string[]> {
    const response = await api.get<string[]>('/appointments/available-slots', {
      params: { professionalId, serviceId, date },
    });
    return response.data;
  },
};
