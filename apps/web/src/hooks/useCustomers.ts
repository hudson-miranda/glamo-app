/**
 * GLAMO - useCustomers Hook
 * Client-side hook for customer data management
 * 
 * @version 1.0.0
 * @description Provides customer data fetching, mutations, and state management
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import type { 
  Customer, 
  CustomerCreateInput, 
  CustomerUpdateInput,
  CustomerFilters,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

// Type matching what the API actually returns for list operations
export interface CustomerListItem {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED';
  cpf: string | null;
  rg: string | null;
  notes: string | null;
  tags: string[];
  acceptsMarketing: boolean;
  preferredChannel: string;
  tier: string;
  pointsBalance: number;
  totalSpent: string;
  visitCount: number;
  lastVisitAt: string | null;
  avgTicket: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { appointments: number };
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  withEmail: number;
  withPhone: number;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: CustomerFilters;
  includeInactive?: boolean;
}

export interface UseCustomersOptions {
  initialParams?: CustomerListParams;
  autoFetch?: boolean;
}

export interface UseCustomersReturn {
  // Data
  customers: CustomerListItem[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Pagination
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Search & Filters
  search: string;
  setSearch: (search: string) => void;
  filters: CustomerFilters;
  setFilters: (filters: CustomerFilters) => void;
  clearFilters: () => void;

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;

  // Actions
  refresh: () => Promise<void>;
  createCustomer: (data: CustomerCreateInput) => Promise<Customer>;
  updateCustomer: (id: string, data: CustomerUpdateInput) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkActivate: (ids: string[]) => Promise<void>;
  bulkDeactivate: (ids: string[]) => Promise<void>;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;

  // Stats
  stats: CustomerStats | null;
  loadStats: () => Promise<void>;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

interface CustomerListResponse {
  customers: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function fetchCustomers(params: CustomerListParams): Promise<CustomerListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params.includeInactive) queryParams.set('includeInactive', 'true');
  
  if (params.filters) {
    const f = params.filters;
    if (f.status) queryParams.set('status', f.status);
    if (f.gender) queryParams.set('gender', f.gender);
    if (f.hasEmail !== undefined) queryParams.set('hasEmail', f.hasEmail.toString());
    if (f.hasPhone !== undefined) queryParams.set('hasPhone', f.hasPhone.toString());
    if (f.tags?.length) queryParams.set('tags', f.tags.join(','));
    if (f.createdFrom) queryParams.set('createdFrom', f.createdFrom);
    if (f.createdTo) queryParams.set('createdTo', f.createdTo);
  }

  const response = await fetch(`/api/customers?${queryParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar clientes');
  }
  
  return response.json();
}

async function fetchCustomerStats(): Promise<CustomerStats> {
  const response = await fetch('/api/customers/stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar estatísticas');
  }
  
  return response.json();
}

async function createCustomerApi(data: CustomerCreateInput): Promise<Customer> {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar cliente');
  }
  
  return response.json();
}

async function updateCustomerApi(id: string, data: CustomerUpdateInput): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar cliente');
  }
  
  return response.json();
}

async function deleteCustomerApi(id: string): Promise<void> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir cliente');
  }
}

async function bulkOperationApi(action: 'delete' | 'activate' | 'deactivate', ids: string[]): Promise<void> {
  const response = await fetch('/api/customers/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ids }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na operação em lote');
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const { initialParams = {}, autoFetch = true } = options;

  // State
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);

  // Params
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit] = useState(initialParams.limit || 20);
  const [search, setSearch] = useState(initialParams.search || '');
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialParams.sortOrder || 'asc');
  const [filters, setFilters] = useState<CustomerFilters>(initialParams.filters || {});
  const [includeInactive, setIncludeInactive] = useState(initialParams.includeInactive || false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toast
  const { success, error: toastError } = useToast();

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Pagination helpers
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetchCustomers({
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        filters,
        includeInactive,
      });

      // API returns { customers, total, page, limit, totalPages }
      setCustomers(result.customers || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder, filters, includeInactive]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Reset page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // Pagination actions
  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) setPage((p) => p - 1);
  }, [hasPrevious]);

  // Sorting
  const setSort = useCallback((newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
    if (newSortBy === sortBy && !newSortOrder) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder || 'asc');
    }
    setPage(1);
  }, [sortBy]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(1);
  }, []);

  // Selection
  const selectAll = useCallback(() => {
    setSelectedIds(customers.map((c) => c.id));
  }, [customers]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Create customer
  const createCustomer = useCallback(async (data: CustomerCreateInput): Promise<Customer> => {
    try {
      const customer = await createCustomerApi(data);
      success('Cliente criado com sucesso');
      await fetchData();
      return customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar cliente';
      toastError(message);
      throw err;
    }
  }, [fetchData, success, toastError]);

  // Update customer
  const updateCustomer = useCallback(async (id: string, data: CustomerUpdateInput): Promise<Customer> => {
    try {
      const customer = await updateCustomerApi(id, data);
      success('Cliente atualizado com sucesso');
      
      // Update local state
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? customer : c))
      );
      
      return customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      toastError(message);
      throw err;
    }
  }, [success, toastError]);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteCustomerApi(id);
      success('Cliente excluído com sucesso');
      
      // Update local state
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      toastError(message);
      throw err;
    }
  }, [success, toastError]);

  // Bulk operations
  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await bulkOperationApi('delete', ids);
      success(`${ids.length} cliente(s) excluído(s) com sucesso`);
      await fetchData();
      clearSelection();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na exclusão em lote';
      toastError(message);
      throw err;
    }
  }, [fetchData, clearSelection, success, toastError]);

  const bulkActivate = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await bulkOperationApi('activate', ids);
      success(`${ids.length} cliente(s) ativado(s) com sucesso`);
      await fetchData();
      clearSelection();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na ativação em lote';
      toastError(message);
      throw err;
    }
  }, [fetchData, clearSelection, success, toastError]);

  const bulkDeactivate = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await bulkOperationApi('deactivate', ids);
      success(`${ids.length} cliente(s) desativado(s) com sucesso`);
      await fetchData();
      clearSelection();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na desativação em lote';
      toastError(message);
      throw err;
    }
  }, [fetchData, clearSelection, success, toastError]);

  // Load stats
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchCustomerStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  return {
    // Data
    customers,
    total,
    totalPages,
    isLoading,
    isError,
    error,

    // Pagination
    page,
    limit,
    hasNext,
    hasPrevious,
    setPage,
    nextPage,
    previousPage,

    // Search & Filters
    search,
    setSearch,
    filters,
    setFilters,
    clearFilters,

    // Sorting
    sortBy,
    sortOrder,
    setSort,

    // Actions
    refresh: fetchData,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,

    // Selection
    selectedIds,
    setSelectedIds,
    selectAll,
    clearSelection,
    isSelected,
    toggleSelection,

    // Stats
    stats,
    loadStats,
  };
}

// ============================================================================
// SINGLE CUSTOMER HOOK
// ============================================================================

export interface UseCustomerOptions {
  id: string;
  includeRelations?: boolean;
}

export interface UseCustomerReturn {
  customer: Customer | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  update: (data: CustomerUpdateInput) => Promise<Customer>;
  remove: () => Promise<void>;
}

export function useCustomer(options: UseCustomerOptions): UseCustomerReturn {
  const { id, includeRelations = false } = options;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { success, error: toastError } = useToast();

  const fetchCustomer = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const params = includeRelations ? '?include=relations' : '';
      const response = await fetch(`/api/customers/${id}${params}`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao carregar cliente');
      }

      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [id, includeRelations]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const update = useCallback(async (data: CustomerUpdateInput): Promise<Customer> => {
    try {
      const updated = await updateCustomerApi(id, data);
      setCustomer(updated);
      success('Cliente atualizado com sucesso');
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      toastError(message);
      throw err;
    }
  }, [id, success, toastError]);

  const remove = useCallback(async (): Promise<void> => {
    try {
      await deleteCustomerApi(id);
      success('Cliente excluído com sucesso');
      setCustomer(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      toastError(message);
      throw err;
    }
  }, [id, success, toastError]);

  return {
    customer,
    isLoading,
    isError,
    error,
    refresh: fetchCustomer,
    update,
    remove,
  };
}

// ============================================================================
// SEARCH HOOK (For autocomplete)
// ============================================================================

export interface UseCustomerSearchReturn {
  results: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  isLoading: boolean;
  search: (query: string) => void;
  clear: () => void;
}

export function useCustomerSearch(): UseCustomerSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; email: string | null; phone: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const search = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    results,
    isLoading,
    search,
    clear,
  };
}

export default useCustomers;
