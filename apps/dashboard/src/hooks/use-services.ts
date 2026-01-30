import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  servicesService,
  ServiceQuery,
  CreateServiceRequest,
  CreateCategoryRequest,
} from '@/services/services.service';

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (query?: ServiceQuery) => [...serviceKeys.lists(), query] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  categories: () => [...serviceKeys.all, 'categories'] as const,
  category: (id: string) => [...serviceKeys.categories(), id] as const,
};

export function useServices(query?: ServiceQuery) {
  return useQuery({
    queryKey: serviceKeys.list(query),
    queryFn: () => servicesService.list(query),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesService.getById(id),
    enabled: !!id,
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: serviceKeys.categories(),
    queryFn: () => servicesService.listCategories(),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequest) => servicesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateServiceRequest> }) =>
      servicesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => servicesService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.categories() });
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
      servicesService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.categories() });
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.categories() });
    },
  });
}
