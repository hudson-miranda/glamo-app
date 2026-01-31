/**
 * GLAMO - useServices Hook
 * Client-side service data management
 * 
 * @version 1.0.0
 * @description Hook for services list, CRUD operations, search, and bulk actions
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Service, ServiceFormData, BusinessSegment } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceFilters {
  categoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  segment?: BusinessSegment;
  professionalId?: string;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
  averageDuration: number;
  byCategory: { categoryId: string; categoryName: string; count: number }[];
}

interface UseServicesOptions {
  autoFetch?: boolean;
  initialFilters?: ServiceFilters;
  initialLimit?: number;
}

interface UseServicesReturn {
  // Data
  services: Service[];
  total: number;
  totalPages: number;
  stats: ServiceStats | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Search
  search: string;
  setSearch: (search: string) => void;

  // Filters
  filters: ServiceFilters;
  setFilters: (filters: ServiceFilters) => void;
  clearFilters: () => void;

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // CRUD Operations
  createService: (data: ServiceFormData) => Promise<Service>;
  updateService: (id: string, data: Partial<ServiceFormData>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;

  // Bulk Operations
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkActivate: (ids: string[]) => Promise<void>;
  bulkDeactivate: (ids: string[]) => Promise<void>;
  bulkUpdateCategory: (ids: string[], categoryId: string | null) => Promise<void>;

  // Professional Management
  assignProfessional: (serviceId: string, professionalId: string) => Promise<void>;
  removeProfessional: (serviceId: string, professionalId: string) => Promise<void>;

  // Other
  refetch: () => Promise<void>;
  loadStats: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const { autoFetch = true, initialFilters = {}, initialLimit = 20 } = options;

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<ServiceStats | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ServiceFilters>(initialFilters);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  // --------------------------------------------------------------------------
  // FETCH
  // --------------------------------------------------------------------------

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        includeCategory: 'true',
      });

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      if (filters.categoryId) {
        params.set('categoryId', filters.categoryId);
      }

      if (filters.status) {
        params.set('status', filters.status);
      }

      if (filters.segment) {
        params.set('segment', filters.segment);
      }

      if (filters.professionalId) {
        params.set('professionalId', filters.professionalId);
      }

      const response = await fetch(`/api/services?${params}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar serviços');
      }

      const data = await response.json();
      setServices(data.services);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, filters, sortBy, sortOrder]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/services/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Auto fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [autoFetch, fetchServices]);

  // Reset page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // --------------------------------------------------------------------------
  // SORTING
  // --------------------------------------------------------------------------

  const setSort = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // --------------------------------------------------------------------------
  // FILTERS
  // --------------------------------------------------------------------------

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch('');
  }, []);

  // --------------------------------------------------------------------------
  // SELECTION
  // --------------------------------------------------------------------------

  const selectAll = useCallback(() => {
    setSelectedIds(services.map((s) => s.id));
  }, [services]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  const createService = useCallback(async (data: ServiceFormData): Promise<Service> => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar serviço');
      }

      const service = await response.json();
      
      // Optimistic update
      setServices((prev) => [service, ...prev]);
      setTotal((prev) => prev + 1);

      return service;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateService = useCallback(async (id: string, data: Partial<ServiceFormData>): Promise<Service> => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar serviço');
      }

      const service = await response.json();
      
      // Update local state
      setServices((prev) => prev.map((s) => (s.id === id ? service : s)));

      return service;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteService = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir serviço');
      }

      // Remove from local state
      setServices((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => prev - 1);
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir serviços');
      }

      // Remove from local state
      setServices((prev) => prev.filter((s) => !ids.includes(s.id)));
      setTotal((prev) => prev - ids.length);
      setSelectedIds([]);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const bulkActivate = useCallback(async (ids: string[]): Promise<void> => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao ativar serviços');
      }

      // Update local state
      setServices((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, status: 'ACTIVE' as const } : s))
      );
      setSelectedIds([]);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const bulkDeactivate = useCallback(async (ids: string[]): Promise<void> => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao desativar serviços');
      }

      // Update local state
      setServices((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, status: 'INACTIVE' as const } : s))
      );
      setSelectedIds([]);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const bulkUpdateCategory = useCallback(async (ids: string[], categoryId: string | null): Promise<void> => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCategory', ids, categoryId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar categoria');
      }

      // Refetch to get updated category info
      await fetchServices();
      setSelectedIds([]);
    } finally {
      setIsUpdating(false);
    }
  }, [fetchServices]);

  // --------------------------------------------------------------------------
  // PROFESSIONAL MANAGEMENT
  // --------------------------------------------------------------------------

  const assignProfessional = useCallback(async (serviceId: string, professionalId: string): Promise<void> => {
    const response = await fetch(`/api/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assignProfessional', professionalId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha ao atribuir profissional');
    }

    await fetchServices();
  }, [fetchServices]);

  const removeProfessional = useCallback(async (serviceId: string, professionalId: string): Promise<void> => {
    const response = await fetch(`/api/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeProfessional', professionalId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha ao remover profissional');
    }

    await fetchServices();
  }, [fetchServices]);

  return {
    services,
    total,
    totalPages,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    page,
    limit,
    setPage,
    setLimit,
    search,
    setSearch,
    filters,
    setFilters,
    clearFilters,
    sortBy,
    sortOrder,
    setSort,
    selectedIds,
    setSelectedIds,
    selectAll,
    clearSelection,
    createService,
    updateService,
    deleteService,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    bulkUpdateCategory,
    assignProfessional,
    removeProfessional,
    refetch: fetchServices,
    loadStats,
  };
}

// ============================================================================
// SINGLE SERVICE HOOK
// ============================================================================

interface UseServiceReturn {
  service: Service | null;
  isLoading: boolean;
  error: Error | null;
  updateService: (data: Partial<ServiceFormData>) => Promise<Service>;
  deleteService: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  refetch: () => Promise<void>;
}

export function useService(id: string): UseServiceReturn {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchService = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/${id}?includeProfessionals=true`);
      if (!response.ok) {
        if (response.status === 404) {
          setService(null);
          throw new Error('Serviço não encontrado');
        }
        throw new Error('Falha ao carregar serviço');
      }
      const data = await response.json();
      setService(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id, fetchService]);

  const updateService = useCallback(async (data: Partial<ServiceFormData>): Promise<Service> => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar serviço');
      }

      const updatedService = await response.json();
      setService(updatedService);
      return updatedService;
    } finally {
      setIsUpdating(false);
    }
  }, [id]);

  const deleteService = useCallback(async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao excluir serviço');
      }

      setService(null);
    } finally {
      setIsDeleting(false);
    }
  }, [id]);

  return {
    service,
    isLoading,
    error,
    updateService,
    deleteService,
    isUpdating,
    isDeleting,
    refetch: fetchService,
  };
}

// ============================================================================
// SERVICE SEARCH HOOK
// ============================================================================

interface UseServiceSearchReturn {
  results: Pick<Service, 'id' | 'name' | 'duration' | 'price'>[];
  isSearching: boolean;
  search: (query: string) => Promise<void>;
}

export function useServiceSearch(): UseServiceSearchReturn {
  const [results, setResults] = useState<Pick<Service, 'id' | 'name' | 'duration' | 'price'>[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/services/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching services:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    results,
    isSearching,
    search,
  };
}
