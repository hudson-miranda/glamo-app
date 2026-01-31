/**
 * GLAMO - Stock Movements Hook
 * Enterprise-grade React Query hooks for stock management
 * Production-ready SaaS implementation
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  StockMovement,
  StockMovementType,
  StockMovementReason,
  StockAlert,
  StockSummary,
  MovementFilters,
} from '@/lib/services/stockMovementService';

// ============================================================================
// Types
// ============================================================================

interface MovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AlertsResponse {
  alerts: StockAlert[];
  total: number;
  critical: number;
  warning: number;
}

interface BatchMovementResult {
  success: number;
  failed: number;
  movements: StockMovement[];
  errors: { productId: string; error: string }[];
}

interface ReportData {
  period: { start: Date; end: Date };
  summary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
    totalValue: number;
  };
  byType: { type: string; count: number; quantity: number; value: number }[];
  byProduct: { productId: string; productName: string; movements: number; netChange: number }[];
  timeline: { date: string; in: number; out: number }[];
}

interface CreateMovementData {
  productId: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

interface BatchMovementData {
  type: StockMovementType;
  reason: StockMovementReason;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost?: number;
  }[];
}

interface AdjustmentData {
  productId: string;
  newQuantity: number;
  notes?: string;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const stockKeys = {
  all: ['stock'] as const,
  movements: () => [...stockKeys.all, 'movements'] as const,
  movementsList: (filters: MovementFilters) => [...stockKeys.movements(), 'list', filters] as const,
  movement: (id: string) => [...stockKeys.movements(), 'detail', id] as const,
  productHistory: (productId: string) => [...stockKeys.movements(), 'product', productId] as const,
  alerts: () => [...stockKeys.all, 'alerts'] as const,
  summary: () => [...stockKeys.all, 'summary'] as const,
  report: (startDate: string, endDate: string) => [...stockKeys.all, 'report', startDate, endDate] as const,
};

// ============================================================================
// Utility: Build Query String
// ============================================================================

function buildQueryString(filters: MovementFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.type) {
    params.set('type', Array.isArray(filters.type) ? filters.type.join(',') : filters.type);
  }
  if (filters.reason) {
    params.set('reason', Array.isArray(filters.reason) ? filters.reason.join(',') : filters.reason);
  }
  if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
  if (filters.createdBy) params.set('createdBy', filters.createdBy);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  return params.toString();
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchMovements(filters: MovementFilters): Promise<MovementsResponse> {
  const queryString = buildQueryString(filters);
  const response = await fetch(`/api/stock/movements?${queryString}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar movimentações');
  }

  return response.json();
}

async function fetchMovement(id: string): Promise<StockMovement> {
  const response = await fetch(`/api/stock/movements/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar movimentação');
  }

  return response.json();
}

async function fetchProductHistory(
  productId: string,
  options: { page?: number; limit?: number; startDate?: string; endDate?: string }
): Promise<MovementsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);

  const response = await fetch(`/api/stock/products/${productId}/history?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar histórico');
  }

  return response.json();
}

async function fetchAlerts(): Promise<AlertsResponse> {
  const response = await fetch('/api/stock/alerts');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar alertas');
  }

  return response.json();
}

async function fetchSummary(): Promise<StockSummary> {
  const response = await fetch('/api/stock/summary');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar resumo');
  }

  return response.json();
}

async function fetchReport(
  startDate: string,
  endDate: string,
  options?: { groupBy?: string; type?: string[] }
): Promise<ReportData> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (options?.groupBy) params.set('groupBy', options.groupBy);
  if (options?.type) params.set('type', options.type.join(','));

  const response = await fetch(`/api/stock/report?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar relatório');
  }

  return response.json();
}

async function createMovement(data: CreateMovementData): Promise<StockMovement> {
  const response = await fetch('/api/stock/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar movimentação');
  }

  return response.json();
}

async function createBatchMovement(data: BatchMovementData): Promise<BatchMovementResult> {
  const response = await fetch('/api/stock/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar movimentação em lote');
  }

  return response.json();
}

async function adjustInventory(data: AdjustmentData): Promise<StockMovement> {
  const response = await fetch('/api/stock/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao ajustar estoque');
  }

  return response.json();
}

// ============================================================================
// useStockMovements Hook - List with filters and pagination
// ============================================================================

export function useStockMovements(initialFilters: MovementFilters = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MovementFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: stockKeys.movementsList(filters),
    queryFn: () => fetchMovements(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MovementFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset page on filter change unless page is specified
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, []);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (data && data.page < data.totalPages) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [data]);

  const prevPage = useCallback(() => {
    if (filters.page && filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 2) - 1 }));
    }
  }, [filters.page]);

  // Invalidate and refetch
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: stockKeys.movements() });
    queryClient.invalidateQueries({ queryKey: stockKeys.alerts() });
    queryClient.invalidateQueries({ queryKey: stockKeys.summary() });
  }, [queryClient]);

  return {
    movements: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isError,
    error,
    isFetching,
    filters,
    updateFilters,
    resetFilters,
    refetch,
    invalidate,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: data ? data.page < data.totalPages : false,
    hasPrevPage: (filters.page || 1) > 1,
  };
}

// ============================================================================
// useStockMovement Hook - Single movement details
// ============================================================================

export function useStockMovement(id: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: stockKeys.movement(id),
    queryFn: () => fetchMovement(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    movement: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ============================================================================
// useProductStockHistory Hook - Product movement history
// ============================================================================

export function useProductStockHistory(
  productId: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const [page, setPage] = useState(options.page || 1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...stockKeys.productHistory(productId), page, options],
    queryFn: () => fetchProductHistory(productId, {
      page,
      limit: options.limit || 20,
      startDate: options.startDate?.toISOString(),
      endDate: options.endDate?.toISOString(),
    }),
    enabled: !!productId,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });

  return {
    movements: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    setPage,
    hasNextPage: data ? page < Math.ceil(data.total / (options.limit || 20)) : false,
    hasPrevPage: page > 1,
  };
}

// ============================================================================
// useStockAlerts Hook - Stock alerts
// ============================================================================

export function useStockAlerts() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: stockKeys.alerts(),
    queryFn: fetchAlerts,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const criticalAlerts = useMemo(
    () => data?.alerts.filter((a) => a.severity === 'critical') ?? [],
    [data]
  );

  const warningAlerts = useMemo(
    () => data?.alerts.filter((a) => a.severity === 'warning') ?? [],
    [data]
  );

  return {
    alerts: data?.alerts ?? [],
    total: data?.total ?? 0,
    critical: data?.critical ?? 0,
    warning: data?.warning ?? 0,
    criticalAlerts,
    warningAlerts,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ============================================================================
// useStockSummary Hook - Stock summary statistics
// ============================================================================

export function useStockSummary() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: stockKeys.summary(),
    queryFn: fetchSummary,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    summary: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ============================================================================
// useStockReport Hook - Stock movement report
// ============================================================================

export function useStockReport(
  startDate: Date,
  endDate: Date,
  options?: { groupBy?: 'day' | 'week' | 'month'; type?: StockMovementType[] }
) {
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...stockKeys.report(startDateStr, endDateStr), options],
    queryFn: () => fetchReport(startDateStr, endDateStr, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    report: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ============================================================================
// useStockMutations Hook - Create, batch, and adjust operations
// ============================================================================

export function useStockMutations() {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: stockKeys.movements() });
    queryClient.invalidateQueries({ queryKey: stockKeys.alerts() });
    queryClient.invalidateQueries({ queryKey: stockKeys.summary() });
  }, [queryClient]);

  // Create movement
  const createMutation = useMutation({
    mutationFn: createMovement,
    onSuccess: (data) => {
      toast.success('Movimentação registrada com sucesso');
      invalidateQueries();
      // Also invalidate product history
      queryClient.invalidateQueries({
        queryKey: stockKeys.productHistory(data.productId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Batch movement
  const batchMutation = useMutation({
    mutationFn: createBatchMovement,
    onSuccess: (data) => {
      if (data.failed > 0) {
        toast.warning(
          `${data.success} movimentações criadas, ${data.failed} falharam`,
          {
            description: data.errors.map((e) => e.error).join(', '),
          }
        );
      } else {
        toast.success(`${data.success} movimentações criadas com sucesso`);
      }
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Adjust inventory
  const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: (data) => {
      toast.success('Estoque ajustado com sucesso');
      invalidateQueries();
      queryClient.invalidateQueries({
        queryKey: stockKeys.productHistory(data.productId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    create: createMutation.mutateAsync,
    createBatch: batchMutation.mutateAsync,
    adjust: adjustMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isBatching: batchMutation.isPending,
    isAdjusting: adjustMutation.isPending,
    isLoading: createMutation.isPending || batchMutation.isPending || adjustMutation.isPending,
  };
}

// ============================================================================
// useInfiniteStockMovements Hook - Infinite scroll
// ============================================================================

export function useInfiniteStockMovements(filters: Omit<MovementFilters, 'page'> = {}) {
  const limit = filters.limit || 20;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...stockKeys.movements(), 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchMovements({ ...filters, page: pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });

  const movements = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const total = data?.pages[0]?.total ?? 0;

  return {
    movements,
    total,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    refetch,
  };
}

// ============================================================================
// useDebounce Hook - Utility for search
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useStockSearch Hook - Debounced search
// ============================================================================

export function useStockSearch(initialSearch: string = '', debounceMs: number = 300) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, debounceMs);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...stockKeys.movements(), 'search', debouncedSearch],
    queryFn: () => fetchMovements({ search: debouncedSearch, limit: 20 }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  });

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    results: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
    refetch,
    isSearching: debouncedSearch.length >= 2 && isLoading,
  };
}

// ============================================================================
// Export Download Helper
// ============================================================================

export async function downloadStockExport(filters: MovementFilters = {}): Promise<void> {
  const queryString = buildQueryString(filters);
  const response = await fetch(`/api/stock/export?${queryString}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao exportar movimentações');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movimentacoes-estoque-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  toast.success('Exportação concluída');
}
