/**
 * GLAMO - useSuppliers Hook
 * Enterprise-grade client-side supplier data management
 * Production-ready React Query implementation
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Supplier, SupplierStatus } from '@prisma/client';
import type { PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================================
// Types
// ============================================================================

export interface SupplierFilters {
  search?: string;
  status?: SupplierStatus;
  hasEmail?: boolean;
  hasPhone?: boolean;
  minRating?: number;
  categoryId?: string;
  tag?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SupplierWithRelations extends Supplier {
  products?: Array<{
    id: string;
    name: string;
    sku: string | null;
    salePrice: number;
    currentStock: number;
    status: string;
  }>;
  _count?: {
    products: number;
    purchases?: number;
  };
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  withProducts: number;
  avgRating: number;
  topCategories: Array<{ categoryId: string; categoryName: string; count: number }>;
  recentSuppliers: SupplierWithRelations[];
}

export interface CreateSupplierInput {
  name: string;
  tradeName?: string | null;
  document?: string | null;
  documentType?: 'CPF' | 'CNPJ' | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  bankInfo?: {
    bankName?: string;
    bankCode?: string;
    agency?: string;
    accountNumber?: string;
    accountType?: 'checking' | 'savings';
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  } | null;
  paymentTerms?: string | null;
  deliveryTime?: number | null;
  minimumOrder?: number | null;
  rating?: number | null;
  tags?: string[];
  status?: SupplierStatus;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

// ============================================================================
// Query Keys Factory
// ============================================================================

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: SupplierFilters) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
  products: (id: string) => [...supplierKeys.detail(id), 'products'] as const,
  search: (term: string) => [...supplierKeys.all, 'search', term] as const,
  stats: () => [...supplierKeys.all, 'stats'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchSuppliers(filters: SupplierFilters): Promise<PaginatedResponse<SupplierWithRelations>> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`/api/suppliers?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar fornecedores');
  }

  return response.json();
}

async function fetchSupplier(id: string): Promise<SupplierWithRelations> {
  const response = await fetch(`/api/suppliers/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar fornecedor');
  }

  return response.json();
}

async function searchSuppliers(term: string, limit: number = 10): Promise<Supplier[]> {
  const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(term)}&limit=${limit}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar fornecedores');
  }

  const result = await response.json();
  return result.data;
}

async function fetchSupplierStats(): Promise<SupplierStats> {
  const response = await fetch('/api/suppliers/stats');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar estatísticas');
  }

  return response.json();
}

async function fetchSupplierProducts(
  id: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<SupplierWithRelations['products']>> {
  const response = await fetch(`/api/suppliers/${id}/products?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar produtos do fornecedor');
  }

  return response.json();
}

async function createSupplier(data: CreateSupplierInput): Promise<Supplier> {
  const response = await fetch('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar fornecedor');
  }

  return response.json();
}

async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar fornecedor');
  }

  return response.json();
}

async function deleteSupplier(id: string): Promise<void> {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao excluir fornecedor');
  }
}

async function patchSupplier(id: string, action: string, data?: Record<string, unknown>): Promise<Supplier> {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar fornecedor');
  }

  return response.json();
}

async function bulkOperation(
  operation: 'activate' | 'deactivate' | 'delete',
  ids: string[]
): Promise<{ count: number; message: string }> {
  const response = await fetch('/api/suppliers/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, ids }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na operação em massa');
  }

  return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for supplier list with filters
 */
export function useSuppliers(initialFilters: SupplierFilters = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const query = useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => fetchSuppliers(filters),
    staleTime: 30000,
  });

  // Mutations for bulk operations
  const bulkActivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkOperation('activate', ids),
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkOperation('deactivate', ids),
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkOperation('delete', ids),
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Selection helpers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (query.data?.data) {
      setSelectedIds(new Set(query.data.data.map((s) => s.id)));
    }
  }, [query.data]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  // Filter helpers
  const updateFilters = useCallback((newFilters: Partial<SupplierFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    const pagination = query.data?.pagination;
    if (pagination?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: supplierKeys.list({ ...filters, page: pagination.page + 1 }),
        queryFn: () => fetchSuppliers({ ...filters, page: pagination.page + 1 }),
      });
    }
  }, [filters, query.data?.pagination, queryClient]);

  return {
    suppliers: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    filters,
    updateFilters,
    resetFilters,
    setPage,
    prefetchNextPage,
    refetch: query.refetch,
    // Selection
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    // Bulk operations
    bulkActivate: () => bulkActivateMutation.mutate(Array.from(selectedIds)),
    bulkDeactivate: () => bulkDeactivateMutation.mutate(Array.from(selectedIds)),
    bulkDelete: () => bulkDeleteMutation.mutate(Array.from(selectedIds)),
    isBulkOperating:
      bulkActivateMutation.isPending ||
      bulkDeactivateMutation.isPending ||
      bulkDeleteMutation.isPending,
  };
}

/**
 * Hook for single supplier with CRUD operations
 */
export function useSupplier(id: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: supplierKeys.detail(id || ''),
    queryFn: () => fetchSupplier(id!),
    enabled: !!id,
    staleTime: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplierInput) => updateSupplier(id!, data),
    onSuccess: (updated) => {
      toast.success('Fornecedor atualizado com sucesso');
      queryClient.setQueryData(supplierKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplier(id!),
    onSuccess: () => {
      toast.success('Fornecedor excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => patchSupplier(id!, 'activate'),
    onSuccess: (updated) => {
      toast.success('Fornecedor ativado com sucesso');
      queryClient.setQueryData(supplierKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => patchSupplier(id!, 'deactivate'),
    onSuccess: (updated) => {
      toast.success('Fornecedor desativado com sucesso');
      queryClient.setQueryData(supplierKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => patchSupplier(id!, 'block'),
    onSuccess: (updated) => {
      toast.success('Fornecedor bloqueado');
      queryClient.setQueryData(supplierKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: (rating: number) => patchSupplier(id!, 'updateRating', { rating }),
    onSuccess: (updated) => {
      toast.success('Avaliação atualizada');
      queryClient.setQueryData(supplierKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    supplier: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    activate: activateMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    block: blockMutation.mutateAsync,
    updateRating: updateRatingMutation.mutateAsync,
    // Loading states
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isBlocking: blockMutation.isPending,
    isUpdatingRating: updateRatingMutation.isPending,
  };
}

/**
 * Hook for supplier products
 */
export function useSupplierProducts(supplierId: string | undefined, options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: supplierKeys.products(supplierId || ''),
    queryFn: () => fetchSupplierProducts(supplierId!, page, limit),
    enabled: !!supplierId,
    staleTime: 30000,
  });
}

/**
 * Hook for supplier search with debounce
 */
export function useSupplierSearch(initialTerm: string = '', limit: number = 10) {
  const [term, setTerm] = useState(initialTerm);
  const debouncedTerm = useDebounce(term, 300);

  const query = useQuery({
    queryKey: supplierKeys.search(debouncedTerm),
    queryFn: () => searchSuppliers(debouncedTerm, limit),
    enabled: debouncedTerm.length >= 2,
    staleTime: 30000,
  });

  return {
    term,
    setTerm,
    suppliers: query.data ?? [],
    isSearching: query.isLoading && debouncedTerm.length >= 2,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook for supplier statistics
 */
export function useSupplierStats() {
  return useQuery({
    queryKey: supplierKeys.stats(),
    queryFn: fetchSupplierStats,
    staleTime: 60000,
  });
}

/**
 * Hook for supplier mutations (standalone)
 */
export function useSupplierMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: (supplier) => {
      toast.success(`Fornecedor "${supplier.name}" criado com sucesso`);
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierInput }) =>
      updateSupplier(id, data),
    onSuccess: (supplier) => {
      toast.success('Fornecedor atualizado com sucesso');
      queryClient.setQueryData(supplierKeys.detail(supplier.id), supplier);
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success('Fornecedor excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for infinite scroll suppliers list
 */
export function useInfiniteSuppliers(filters: Omit<SupplierFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...supplierKeys.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchSuppliers({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 30000,
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to prefetch a supplier
 */
export function usePrefetchSupplier() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: supplierKeys.detail(id),
        queryFn: () => fetchSupplier(id),
        staleTime: 30000,
      });
    },
    [queryClient]
  );
}

/**
 * Hook to invalidate supplier cache
 */
export function useInvalidateSuppliers() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: supplierKeys.all });
  }, [queryClient]);
}

/**
 * Hook to get cached supplier
 */
export function useCachedSupplier(id: string): SupplierWithRelations | undefined {
  const queryClient = useQueryClient();

  return queryClient.getQueryData<SupplierWithRelations>(supplierKeys.detail(id));
}
