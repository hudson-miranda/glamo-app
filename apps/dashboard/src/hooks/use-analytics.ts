import { useQuery } from '@tanstack/react-query';
import { analyticsService, DateRangeQuery } from '@/services/analytics.service';

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (query?: DateRangeQuery) => [...analyticsKeys.all, 'overview', query] as const,
  revenue: (query?: DateRangeQuery) => [...analyticsKeys.all, 'revenue', query] as const,
  services: (query?: DateRangeQuery) => [...analyticsKeys.all, 'services', query] as const,
  professionals: (query?: DateRangeQuery) => [...analyticsKeys.all, 'professionals', query] as const,
  occupancy: (query?: DateRangeQuery) => [...analyticsKeys.all, 'occupancy', query] as const,
  customers: (query?: DateRangeQuery) => [...analyticsKeys.all, 'customers', query] as const,
};

export function useAnalyticsOverview(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.overview(query),
    queryFn: () => analyticsService.getOverview(query),
  });
}

export function useRevenueChart(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.revenue(query),
    queryFn: () => analyticsService.getRevenueChart(query),
  });
}

export function useTopServices(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.services(query),
    queryFn: () => analyticsService.getTopServices(query),
  });
}

export function useTopProfessionals(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.professionals(query),
    queryFn: () => analyticsService.getTopProfessionals(query),
  });
}

export function useOccupancyHeatmap(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.occupancy(query),
    queryFn: () => analyticsService.getOccupancyHeatmap(query),
  });
}

export function useCustomerAnalytics(query?: DateRangeQuery) {
  return useQuery({
    queryKey: analyticsKeys.customers(query),
    queryFn: () => analyticsService.getCustomerAnalytics(query),
  });
}
