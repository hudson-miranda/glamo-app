/**
 * GLAMO - useProfessionals Hook
 * Comprehensive professional management hook with schedule and availability support
 * Production-grade SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  Professional,
  ProfessionalFormData,
  WorkSchedule,
  AvailabilitySlot,
} from '@/lib/services/professionalService';

// ============================================================================
// Types
// ============================================================================

interface ProfessionalListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  hasServices?: boolean;
  serviceId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProfessionalListResult {
  data: Professional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProfessionalFilters {
  search: string;
  status?: 'active' | 'inactive';
  hasServices?: boolean;
  serviceId?: string;
}

interface ProfessionalStats {
  total: number;
  active: number;
  inactive: number;
  withServices: number;
  avgServicesPerProfessional: number;
  byCommissionType: {
    percentage: number;
    fixed: number;
    none: number;
  };
}

interface BulkOperationResult {
  success: boolean;
  action: string;
  requested: number;
  affected: number;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchProfessionals(params: ProfessionalListParams): Promise<ProfessionalListResult> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.hasServices !== undefined) searchParams.set('hasServices', String(params.hasServices));
  if (params.serviceId) searchParams.set('serviceId', params.serviceId);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`/api/professionals?${searchParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar profissionais');
  }
  
  return response.json();
}

async function fetchProfessional(id: string): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}?includeServices=true`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Profissional não encontrado');
    }
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar profissional');
  }
  
  return response.json();
}

async function fetchProfessionalStats(): Promise<ProfessionalStats> {
  const response = await fetch('/api/professionals/stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar estatísticas');
  }
  
  return response.json();
}

async function searchProfessionals(query: string): Promise<Pick<Professional, 'id' | 'name' | 'avatar' | 'color'>[]> {
  if (!query || query.length < 2) return [];
  
  const response = await fetch(`/api/professionals?search=${encodeURIComponent(query)}&limit=10&status=active`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar profissionais');
  }
  
  const result = await response.json();
  return result.data || [];
}

async function createProfessional(data: ProfessionalFormData): Promise<Professional> {
  const response = await fetch('/api/professionals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar profissional');
  }
  
  return response.json();
}

async function updateProfessional(id: string, data: Partial<ProfessionalFormData>): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar profissional');
  }
  
  return response.json();
}

async function deleteProfessional(id: string): Promise<void> {
  const response = await fetch(`/api/professionals/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir profissional');
  }
}

async function updateProfessionalSchedule(id: string, schedule: WorkSchedule): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}/schedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar agenda');
  }
  
  return response.json();
}

async function fetchAvailability(
  id: string,
  date: string,
  serviceId?: string
): Promise<{ slots: AvailabilitySlot[] }> {
  const params = new URLSearchParams({ date });
  if (serviceId) params.set('serviceId', serviceId);
  
  const response = await fetch(`/api/professionals/${id}/availability?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar disponibilidade');
  }
  
  return response.json();
}

async function addProfessionalServices(id: string, serviceIds: string[]): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceIds }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao adicionar serviços');
  }
  
  return response.json();
}

async function removeProfessionalServices(id: string, serviceIds: string[]): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}/services`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceIds }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao remover serviços');
  }
  
  return response.json();
}

async function bulkDeleteProfessionals(ids: string[]): Promise<BulkOperationResult> {
  const response = await fetch('/api/professionals/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', ids }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na operação em lote');
  }
  
  return response.json();
}

async function bulkUpdateProfessionalStatus(
  ids: string[],
  status: 'activate' | 'deactivate'
): Promise<BulkOperationResult> {
  const response = await fetch('/api/professionals/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: status, ids }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na operação em lote');
  }
  
  return response.json();
}

async function activateProfessional(id: string): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'activate' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao ativar profissional');
  }
  
  return response.json();
}

async function deactivateProfessional(id: string): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deactivate' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao desativar profissional');
  }
  
  return response.json();
}

async function restoreProfessional(id: string): Promise<Professional> {
  const response = await fetch(`/api/professionals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao restaurar profissional');
  }
  
  return response.json();
}

// ============================================================================
// Query Keys
// ============================================================================

export const professionalKeys = {
  all: ['professionals'] as const,
  lists: () => [...professionalKeys.all, 'list'] as const,
  list: (params: ProfessionalListParams) => [...professionalKeys.lists(), params] as const,
  details: () => [...professionalKeys.all, 'detail'] as const,
  detail: (id: string) => [...professionalKeys.details(), id] as const,
  stats: () => [...professionalKeys.all, 'stats'] as const,
  search: (query: string) => [...professionalKeys.all, 'search', query] as const,
  availability: (id: string, date: string, serviceId?: string) => 
    [...professionalKeys.all, 'availability', id, date, serviceId] as const,
};

// ============================================================================
// useProfessionals Hook - List with Filters
// ============================================================================

interface UseProfessionalsOptions {
  initialParams?: Partial<ProfessionalListParams>;
  enabled?: boolean;
}

interface UseProfessionalsReturn {
  professionals: Professional[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  filters: ProfessionalFilters;
  setFilters: (filters: Partial<ProfessionalFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  refetch: () => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  bulkDelete: (ids?: string[]) => Promise<void>;
  bulkActivate: (ids?: string[]) => Promise<void>;
  bulkDeactivate: (ids?: string[]) => Promise<void>;
  isBulkLoading: boolean;
}

const defaultFilters: ProfessionalFilters = {
  search: '',
  status: undefined,
  hasServices: undefined,
  serviceId: undefined,
};

export function useProfessionals(options: UseProfessionalsOptions = {}): UseProfessionalsReturn {
  const { initialParams = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  
  const [filters, setFiltersState] = useState<ProfessionalFilters>({
    ...defaultFilters,
    ...initialParams,
  });
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit, setLimit] = useState(initialParams.limit || 20);
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialParams.sortOrder || 'asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const queryParams: ProfessionalListParams = useMemo(() => ({
    page,
    limit,
    search: debouncedSearch,
    status: filters.status,
    hasServices: filters.hasServices,
    serviceId: filters.serviceId,
    sortBy,
    sortOrder,
  }), [page, limit, debouncedSearch, filters.status, filters.hasServices, filters.serviceId, sortBy, sortOrder]);
  
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: professionalKeys.list(queryParams),
    queryFn: () => fetchProfessionals(queryParams),
    enabled,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
  
  // Bulk mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteProfessionals,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success(`${result.affected} profissional(is) excluído(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const bulkActivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateProfessionalStatus(ids, 'activate'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success(`${result.affected} profissional(is) ativado(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const bulkDeactivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateProfessionalStatus(ids, 'deactivate'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success(`${result.affected} profissional(is) desativado(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const setFilters = useCallback((newFilters: Partial<ProfessionalFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);
  
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPage(1);
  }, []);
  
  const setSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    if (field === sortBy && !order) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(order || 'asc');
    }
    setPage(1);
  }, [sortBy]);
  
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);
  
  const selectAll = useCallback(() => {
    if (data?.data) {
      setSelectedIds(data.data.map(p => p.id));
    }
  }, [data?.data]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);
  
  const isAllSelected = data?.data 
    ? data.data.length > 0 && selectedIds.length === data.data.length
    : false;
  
  const bulkDelete = useCallback(async (ids?: string[]) => {
    const idsToDelete = ids || selectedIds;
    if (idsToDelete.length === 0) return;
    await bulkDeleteMutation.mutateAsync(idsToDelete);
  }, [selectedIds, bulkDeleteMutation]);
  
  const bulkActivate = useCallback(async (ids?: string[]) => {
    const idsToActivate = ids || selectedIds;
    if (idsToActivate.length === 0) return;
    await bulkActivateMutation.mutateAsync(idsToActivate);
  }, [selectedIds, bulkActivateMutation]);
  
  const bulkDeactivate = useCallback(async (ids?: string[]) => {
    const idsToDeactivate = ids || selectedIds;
    if (idsToDeactivate.length === 0) return;
    await bulkDeactivateMutation.mutateAsync(idsToDeactivate);
  }, [selectedIds, bulkDeactivateMutation]);
  
  return {
    professionals: data?.data || [],
    pagination: {
      page: data?.page || page,
      limit: data?.limit || limit,
      total: data?.total || 0,
      totalPages: data?.totalPages || 0,
    },
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    filters,
    setFilters,
    resetFilters,
    setPage,
    setLimit,
    sortBy,
    sortOrder,
    setSort,
    refetch,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    isBulkLoading: bulkDeleteMutation.isPending || 
                   bulkActivateMutation.isPending || 
                   bulkDeactivateMutation.isPending,
  };
}

// ============================================================================
// useProfessional Hook - Single Professional Details
// ============================================================================

interface UseProfessionalOptions {
  enabled?: boolean;
}

interface UseProfessionalReturn {
  professional: Professional | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  update: (data: Partial<ProfessionalFormData>) => Promise<Professional>;
  remove: () => Promise<void>;
  activate: () => Promise<Professional>;
  deactivate: () => Promise<Professional>;
  restore: () => Promise<Professional>;
  updateSchedule: (schedule: WorkSchedule) => Promise<Professional>;
  addServices: (serviceIds: string[]) => Promise<Professional>;
  removeServices: (serviceIds: string[]) => Promise<Professional>;
  isUpdating: boolean;
  isDeleting: boolean;
  isActivating: boolean;
  isDeactivating: boolean;
  isRestoring: boolean;
}

export function useProfessional(id: string | null, options: UseProfessionalOptions = {}): UseProfessionalReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  
  const {
    data: professional,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: professionalKeys.detail(id || ''),
    queryFn: () => fetchProfessional(id!),
    enabled: enabled && !!id,
    staleTime: 30000,
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProfessionalFormData>) => updateProfessional(id!, data),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast.success('Profissional atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => deleteProfessional(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success('Profissional excluído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const activateMutation = useMutation({
    mutationFn: () => activateProfessional(id!),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast.success('Profissional ativado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deactivateMutation = useMutation({
    mutationFn: () => deactivateProfessional(id!),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast.success('Profissional desativado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const restoreMutation = useMutation({
    mutationFn: () => restoreProfessional(id!),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast.success('Profissional restaurado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const scheduleMutation = useMutation({
    mutationFn: (schedule: WorkSchedule) => updateProfessionalSchedule(id!, schedule),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      toast.success('Agenda atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const addServicesMutation = useMutation({
    mutationFn: (serviceIds: string[]) => addProfessionalServices(id!, serviceIds),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      toast.success('Serviços adicionados com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const removeServicesMutation = useMutation({
    mutationFn: (serviceIds: string[]) => removeProfessionalServices(id!, serviceIds),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(id!), updatedProfessional);
      toast.success('Serviços removidos com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  return {
    professional: professional || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    update: useCallback(async (data: Partial<ProfessionalFormData>) => {
      return updateMutation.mutateAsync(data);
    }, [updateMutation]),
    remove: useCallback(async () => {
      return deleteMutation.mutateAsync();
    }, [deleteMutation]),
    activate: useCallback(async () => {
      return activateMutation.mutateAsync();
    }, [activateMutation]),
    deactivate: useCallback(async () => {
      return deactivateMutation.mutateAsync();
    }, [deactivateMutation]),
    restore: useCallback(async () => {
      return restoreMutation.mutateAsync();
    }, [restoreMutation]),
    updateSchedule: useCallback(async (schedule: WorkSchedule) => {
      return scheduleMutation.mutateAsync(schedule);
    }, [scheduleMutation]),
    addServices: useCallback(async (serviceIds: string[]) => {
      return addServicesMutation.mutateAsync(serviceIds);
    }, [addServicesMutation]),
    removeServices: useCallback(async (serviceIds: string[]) => {
      return removeServicesMutation.mutateAsync(serviceIds);
    }, [removeServicesMutation]),
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

// ============================================================================
// useProfessionalStats Hook
// ============================================================================

interface UseProfessionalStatsReturn {
  stats: ProfessionalStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfessionalStats(): UseProfessionalStatsReturn {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: professionalKeys.stats(),
    queryFn: fetchProfessionalStats,
    staleTime: 60000,
  });
  
  return {
    stats: stats || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// useProfessionalSearch Hook
// ============================================================================

interface UseProfessionalSearchOptions {
  minLength?: number;
  debounceMs?: number;
}

interface UseProfessionalSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Pick<Professional, 'id' | 'name' | 'avatar' | 'color'>[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useProfessionalSearch(options: UseProfessionalSearchOptions = {}): UseProfessionalSearchReturn {
  const { minLength = 2, debounceMs = 300 } = options;
  
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);
  
  const {
    data: results = [],
    isFetching: isSearching,
  } = useQuery({
    queryKey: professionalKeys.search(debouncedQuery),
    queryFn: () => searchProfessionals(debouncedQuery),
    enabled: debouncedQuery.length >= minLength,
    staleTime: 30000,
  });
  
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);
  
  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
}

// ============================================================================
// useProfessionalAvailability Hook
// ============================================================================

interface UseProfessionalAvailabilityOptions {
  date: string;
  serviceId?: string;
  enabled?: boolean;
}

interface UseProfessionalAvailabilityReturn {
  slots: AvailabilitySlot[];
  availableSlots: AvailabilitySlot[];
  isLoading: boolean;
  refetch: () => void;
}

export function useProfessionalAvailability(
  professionalId: string | null,
  options: UseProfessionalAvailabilityOptions
): UseProfessionalAvailabilityReturn {
  const { date, serviceId, enabled = true } = options;
  
  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: professionalKeys.availability(professionalId || '', date, serviceId),
    queryFn: () => fetchAvailability(professionalId!, date, serviceId),
    enabled: enabled && !!professionalId && !!date,
    staleTime: 60000,
  });
  
  const availableSlots = useMemo(() => {
    return (data?.slots || []).filter(slot => slot.available);
  }, [data?.slots]);
  
  return {
    slots: data?.slots || [],
    availableSlots,
    isLoading,
    refetch,
  };
}

// ============================================================================
// useProfessionalMutations Hook - Standalone Mutations
// ============================================================================

interface UseProfessionalMutationsReturn {
  create: (data: ProfessionalFormData) => Promise<Professional>;
  update: (id: string, data: Partial<ProfessionalFormData>) => Promise<Professional>;
  remove: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useProfessionalMutations(): UseProfessionalMutationsReturn {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success('Profissional criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfessionalFormData> }) => 
      updateProfessional(id, data),
    onSuccess: (updatedProfessional) => {
      queryClient.setQueryData(professionalKeys.detail(updatedProfessional.id), updatedProfessional);
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast.success('Profissional atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.all });
      toast.success('Profissional excluído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  return {
    create: useCallback(async (data: ProfessionalFormData) => {
      return createMutation.mutateAsync(data);
    }, [createMutation]),
    update: useCallback(async (id: string, data: Partial<ProfessionalFormData>) => {
      return updateMutation.mutateAsync({ id, data });
    }, [updateMutation]),
    remove: useCallback(async (id: string) => {
      return deleteMutation.mutateAsync(id);
    }, [deleteMutation]),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  fetchProfessionals,
  fetchProfessional,
  fetchProfessionalStats,
  searchProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  fetchAvailability,
};
