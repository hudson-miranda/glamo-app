import api from '@/lib/api';

export interface AnalyticsOverview {
  revenue: {
    value: number;
    previousValue: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  averageTicket: {
    value: number;
    previousValue: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  count: number;
}

export interface TopService {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

export interface TopProfessional {
  id: string;
  name: string;
  appointments: number;
  revenue: number;
  rating: number;
}

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
  period?: 'day' | 'week' | 'month';
}

export const analyticsService = {
  async getOverview(query?: DateRangeQuery): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>('/analytics/overview', {
      params: query,
    });
    return response.data;
  },

  async getRevenueChart(query?: DateRangeQuery): Promise<RevenueData[]> {
    const response = await api.get<{ data: RevenueData[] }>('/analytics/revenue', {
      params: query,
    });
    return response.data.data;
  },

  async getTopServices(query?: DateRangeQuery): Promise<TopService[]> {
    const response = await api.get<{ data: TopService[] }>('/analytics/services', {
      params: query,
    });
    return response.data.data;
  },

  async getTopProfessionals(query?: DateRangeQuery): Promise<TopProfessional[]> {
    const response = await api.get<{ data: TopProfessional[] }>(
      '/analytics/professionals',
      { params: query },
    );
    return response.data.data;
  },

  async getOccupancyHeatmap(query?: DateRangeQuery): Promise<any> {
    const response = await api.get('/analytics/occupancy', {
      params: query,
    });
    return response.data;
  },

  async getCustomerAnalytics(query?: DateRangeQuery): Promise<any> {
    const response = await api.get('/analytics/customers', {
      params: query,
    });
    return response.data;
  },

  async exportReport(type: string, query?: DateRangeQuery): Promise<Blob> {
    const response = await api.get(`/analytics/export/${type}`, {
      params: query,
      responseType: 'blob',
    });
    return response.data;
  },
};
