import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  professionalsService,
  ProfessionalQuery,
  CreateProfessionalRequest,
  WorkingHours,
} from '@/services/professionals.service';

export const professionalKeys = {
  all: ['professionals'] as const,
  lists: () => [...professionalKeys.all, 'list'] as const,
  list: (query?: ProfessionalQuery) => [...professionalKeys.lists(), query] as const,
  details: () => [...professionalKeys.all, 'detail'] as const,
  detail: (id: string) => [...professionalKeys.details(), id] as const,
  schedule: (id: string, date: string) => [...professionalKeys.detail(id), 'schedule', date] as const,
};

export function useProfessionals(query?: ProfessionalQuery) {
  return useQuery({
    queryKey: professionalKeys.list(query),
    queryFn: () => professionalsService.list(query),
  });
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: professionalKeys.detail(id),
    queryFn: () => professionalsService.getById(id),
    enabled: !!id,
  });
}

export function useProfessionalSchedule(id: string, date: string) {
  return useQuery({
    queryKey: professionalKeys.schedule(id, date),
    queryFn: () => professionalsService.getSchedule(id, date),
    enabled: !!id && !!date,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProfessionalRequest) => professionalsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProfessionalRequest> }) =>
      professionalsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => professionalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
    },
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, workingHours }: { id: string; workingHours: WorkingHours[] }) =>
      professionalsService.updateWorkingHours(id, workingHours),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.detail(id) });
    },
  });
}
