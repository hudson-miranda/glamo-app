/**
 * GLAMO - useProducts Hook
 * Enterprise-grade React Query hook for products management
 * Production-ready SaaS implementation
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type {
  ProductInput,
  ProductUpdateInput,
  ProductFilters,
  ProductSortOptions,
  ProductListResult,
  ProductWithRelations,
  StockMovementInput,
  StockMovementResult,
  ProductStats,
  StockMovement,
} from '@/lib/services/productService';
import { ProductStatus, StockMovementType } from '@prisma/client';

// ============================================================================
// API Client Functions
// ============================================================================

async function fetchProducts(params: {
  filters?: ProductFilters;
  sort?: ProductSortOptions;
  page?: number;
  limit?: number;
}): Promise<ProductListResult> {
  const searchParams = new URLSearchParams();

  if (params.filters) {
    const f = params.filters;
    if (f.search) searchParams.set('search', f.search);
    if (f.status) {
      const statuses = Array.isArray(f.status) ? f.status.join(',') : f.status;
      searchParams.set('status', statuses);
    }
    if (f.categoryId) searchParams.set('categoryId', f.categoryId);
    if (f.supplierId) searchParams.set('supplierId', f.supplierId);
    if (f.brand) searchParams.set('brand', f.brand);
    if (f.minPrice !== undefined) searchParams.set('minPrice', String(f.minPrice));
    if (f.maxPrice !== undefined) searchParams.set('maxPrice', String(f.maxPrice));
    if (f.hasStock !== undefined) searchParams.set('hasStock', String(f.hasStock));
    if (f.lowStock) searchParams.set('lowStock', 'true');
    if (f.isSellable !== undefined) searchParams.set('isSellable', String(f.isSellable));
    if (f.isConsumable !== undefined) searchParams.set('isConsumable', String(f.isConsumable));
    if (f.tags?.length) searchParams.set('tags', f.tags.join(','));
  }

  if (params.sort) {
    searchParams.set('sortField', params.sort.field);
    searchParams.set('sortDirection', params.sort.direction);
  }

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`/api/products?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar produtos');
  }
  return res.json();
}

async function fetchProduct(id: string): Promise<ProductWithRelations> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar produto');
  }
  return res.json();
}

async function createProduct(data: ProductInput): Promise<ProductWithRelations> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao criar produto');
  }
  return res.json();
}

async function updateProduct(id: string, data: ProductUpdateInput): Promise<ProductWithRelations> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao atualizar produto');
  }
  return res.json();
}

async function deleteProduct(id: string, permanent = false): Promise<void> {
  const url = permanent ? `/api/products/${id}?permanent=true` : `/api/products/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao excluir produto');
  }
}

async function patchProduct(id: string, action: 'activate' | 'deactivate' | 'out_of_stock' | 'restore'): Promise<ProductWithRelations> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao atualizar status do produto');
  }
  return res.json();
}

async function fetchProductStats(): Promise<ProductStats> {
  const res = await fetch('/api/products/stats');
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar estatísticas');
  }
  return res.json();
}

async function searchProducts(term: string, limit = 10): Promise<{ products: ProductWithRelations[] }> {
  const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}&limit=${limit}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar produtos');
  }
  return res.json();
}

async function fetchStockMovements(productId: string, options: {
  startDate?: string;
  endDate?: string;
  type?: StockMovementType[];
  limit?: number;
} = {}): Promise<{ movements: StockMovement[] }> {
  const searchParams = new URLSearchParams();
  if (options.startDate) searchParams.set('startDate', options.startDate);
  if (options.endDate) searchParams.set('endDate', options.endDate);
  if (options.type?.length) searchParams.set('type', options.type.join(','));
  if (options.limit) searchParams.set('limit', String(options.limit));

  const res = await fetch(`/api/products/${productId}/stock?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar movimentações');
  }
  return res.json();
}

async function addStockMovement(productId: string, data: Omit<StockMovementInput, 'productId'>): Promise<StockMovementResult> {
  const res = await fetch(`/api/products/${productId}/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao adicionar movimentação');
  }
  return res.json();
}

async function fetchLowStock(): Promise<{ products: ProductWithRelations[] }> {
  const res = await fetch('/api/products/low-stock');
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar produtos com estoque baixo');
  }
  return res.json();
}

async function fetchStockValuation(): Promise<{
  totalItems: number;
  totalUnits: number;
  totalCost: number;
  totalSaleValue: number;
  potentialProfit: number;
}> {
  const res = await fetch('/api/products/valuation');
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar valoração do estoque');
  }
  return res.json();
}

interface BulkActionParams {
  action: 'activate' | 'deactivate' | 'delete' | 'update_category' | 'price_adjustment' | 'stock_movement';
  ids?: string[];
  categoryId?: string | null;
  adjustmentType?: 'percentage' | 'fixed';
  adjustmentValue?: number;
  target?: 'costPrice' | 'salePrice';
  movements?: StockMovementInput[];
}

async function bulkAction(params: BulkActionParams): Promise<{ success: boolean; count?: number }> {
  const res = await fetch('/api/products/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro na operação em lote');
  }
  return res.json();
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters, sort: ProductSortOptions, page: number, limit: number) =>
    [...productKeys.lists(), { filters, sort, page, limit }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
  search: (term: string) => [...productKeys.all, 'search', term] as const,
  stock: (productId: string) => [...productKeys.all, 'stock', productId] as const,
  stockMovements: (productId: string, options: object) => [...productKeys.stock(productId), 'movements', options] as const,
  lowStock: () => [...productKeys.all, 'low-stock'] as const,
  valuation: () => [...productKeys.all, 'valuation'] as const,
};

// ============================================================================
// Main Hook - useProducts
// ============================================================================

interface UseProductsOptions {
  filters?: ProductFilters;
  sort?: ProductSortOptions;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const queryClient = useQueryClient();
  const {
    filters = {},
    sort = { field: 'name', direction: 'asc' },
    page = 1,
    limit = 20,
    enabled = true,
  } = options;

  // List query
  const listQuery = useQuery({
    queryKey: productKeys.list(filters, sort, page, limit),
    queryFn: () => fetchProducts({ filters, sort, page, limit }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success(`Produto "${data.name}" criado com sucesso`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: bulkAction,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      
      const messages: Record<string, string> = {
        activate: `${data.count} produto(s) ativado(s)`,
        deactivate: `${data.count} produto(s) desativado(s)`,
        delete: `${data.count} produto(s) excluído(s)`,
        update_category: `${data.count} produto(s) atualizado(s)`,
        price_adjustment: `${data.count} preço(s) ajustado(s)`,
        stock_movement: `${data.count} movimentação(ões) registrada(s)`,
      };
      
      toast.success(messages[variables.action] || 'Operação realizada');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (listQuery.data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: productKeys.list(filters, sort, page + 1, limit),
        queryFn: () => fetchProducts({ filters, sort, page: page + 1, limit }),
      });
    }
  }, [queryClient, filters, sort, page, limit, listQuery.data?.hasMore]);

  return {
    // Data
    products: listQuery.data?.products || [],
    total: listQuery.data?.total || 0,
    totalPages: listQuery.data?.totalPages || 0,
    hasMore: listQuery.data?.hasMore || false,
    
    // State
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    
    // Mutations
    create: createMutation.mutateAsync,
    bulkActivate: (ids: string[]) => bulkMutation.mutateAsync({ action: 'activate', ids }),
    bulkDeactivate: (ids: string[]) => bulkMutation.mutateAsync({ action: 'deactivate', ids }),
    bulkDelete: (ids: string[]) => bulkMutation.mutateAsync({ action: 'delete', ids }),
    bulkUpdateCategory: (ids: string[], categoryId: string | null) =>
      bulkMutation.mutateAsync({ action: 'update_category', ids, categoryId }),
    bulkPriceAdjustment: (
      ids: string[],
      adjustmentType: 'percentage' | 'fixed',
      adjustmentValue: number,
      target: 'costPrice' | 'salePrice'
    ) => bulkMutation.mutateAsync({ action: 'price_adjustment', ids, adjustmentType, adjustmentValue, target }),
    
    isCreating: createMutation.isPending,
    isBulkActing: bulkMutation.isPending,
    
    // Utilities
    prefetchNextPage,
    refetch: listQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  };
}

// ============================================================================
// Single Product Hook
// ============================================================================

export function useProduct(id: string | null | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(id);

  // Detail query
  const detailQuery = useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => fetchProduct(id!),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProductUpdateInput) => updateProduct(id!, data),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id!), data);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success('Produto atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (permanent = false) => deleteProduct(id!, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.removeQueries({ queryKey: productKeys.detail(id!) });
      toast.success('Produto excluído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Status mutations
  const activateMutation = useMutation({
    mutationFn: () => patchProduct(id!, 'activate'),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id!), data);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success('Produto ativado');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => patchProduct(id!, 'deactivate'),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id!), data);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success('Produto desativado');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => patchProduct(id!, 'restore'),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id!), data);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success('Produto restaurado');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    // Data
    product: detailQuery.data,
    
    // State
    isLoading: detailQuery.isLoading,
    isFetching: detailQuery.isFetching,
    isError: detailQuery.isError,
    error: detailQuery.error,
    
    // Mutations
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    activate: activateMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isRestoring: restoreMutation.isPending,
    
    // Utilities
    refetch: detailQuery.refetch,
  };
}

// ============================================================================
// Product Stats Hook
// ============================================================================

export function useProductStats(enabled = true) {
  const query = useQuery({
    queryKey: productKeys.stats(),
    queryFn: fetchProductStats,
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================
// Product Search Hook
// ============================================================================

export function useProductSearch(debounceMs = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, debounceMs);

  const query = useQuery({
    queryKey: productKeys.search(debouncedTerm),
    queryFn: () => searchProducts(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 30 * 1000,
  });

  return {
    searchTerm,
    setSearchTerm,
    products: query.data?.products || [],
    isSearching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

// ============================================================================
// Stock Movements Hook
// ============================================================================

interface UseStockMovementsOptions {
  productId: string;
  startDate?: string;
  endDate?: string;
  type?: StockMovementType[];
  limit?: number;
  enabled?: boolean;
}

export function useStockMovements(options: UseStockMovementsOptions) {
  const { productId, startDate, endDate, type, limit = 100, enabled = true } = options;
  const queryClient = useQueryClient();

  const queryOptions = { startDate, endDate, type, limit };

  const query = useQuery({
    queryKey: productKeys.stockMovements(productId, queryOptions),
    queryFn: () => fetchStockMovements(productId, queryOptions),
    enabled: enabled && Boolean(productId),
    staleTime: 30 * 1000,
  });

  const addMovementMutation = useMutation({
    mutationFn: (data: Omit<StockMovementInput, 'productId'>) => addStockMovement(productId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productKeys.stock(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.valuation() });
      
      const typeLabels: Record<StockMovementType, string> = {
        ENTRY: 'Entrada',
        EXIT: 'Saída',
        PURCHASE: 'Compra',
        SALE: 'Venda',
        RETURN: 'Devolução',
        LOSS: 'Perda',
        ADJUSTMENT_IN: 'Ajuste entrada',
        ADJUSTMENT_OUT: 'Ajuste saída',
        TRANSFER_IN: 'Transferência entrada',
        TRANSFER_OUT: 'Transferência saída',
        CONSUMPTION: 'Consumo',
      };
      
      toast.success(`${typeLabels[result.movement.type]} registrada. Estoque: ${result.newStock}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    movements: query.data?.movements || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    addMovement: addMovementMutation.mutateAsync,
    isAddingMovement: addMovementMutation.isPending,
    
    refetch: query.refetch,
  };
}

// ============================================================================
// Low Stock Hook
// ============================================================================

export function useLowStock(enabled = true) {
  const query = useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: fetchLowStock,
    enabled,
    staleTime: 60 * 1000,
  });

  return {
    products: query.data?.products || [],
    count: query.data?.products?.length || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================
// Stock Valuation Hook
// ============================================================================

export function useStockValuation(enabled = true) {
  const query = useQuery({
    queryKey: productKeys.valuation(),
    queryFn: fetchStockValuation,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    valuation: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================
// Product Mutations Hook (standalone)
// ============================================================================

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success(`Produto "${data.name}" criado com sucesso`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdateInput }) => updateProduct(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(productKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success('Produto atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) => deleteProduct(id, permanent),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.removeQueries({ queryKey: productKeys.detail(variables.id) });
      toast.success('Produto excluído com sucesso');
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
