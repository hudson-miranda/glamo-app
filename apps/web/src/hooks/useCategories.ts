/**
 * GLAMO - useCategories Hook
 * Comprehensive category management hook with hierarchical tree support
 * Production-grade SaaS implementation
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  Category,
  CategoryFormData,
  CategoryListParams,
  CategoryListResult,
  CategoryTreeNode,
  CategoryStats,
  CategoryFilters,
  BulkOperationResult,
} from '@/types/category';

// ============================================================================
// API Functions
// ============================================================================

async function fetchCategories(params: CategoryListParams): Promise<CategoryListResult> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.parentId) searchParams.set('parentId', params.parentId);
  if (params.rootOnly) searchParams.set('rootOnly', 'true');
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`/api/categories?${searchParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar categorias');
  }
  
  return response.json();
}

async function fetchCategoryTree(): Promise<CategoryTreeNode[]> {
  const response = await fetch('/api/categories?format=tree');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar árvore de categorias');
  }
  
  return response.json();
}

async function fetchCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}?includeServices=true&includeChildren=true`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Categoria não encontrada');
    }
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar categoria');
  }
  
  return response.json();
}

async function fetchCategoryStats(): Promise<CategoryStats> {
  const response = await fetch('/api/categories/stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar estatísticas');
  }
  
  return response.json();
}

async function searchCategories(query: string): Promise<Pick<Category, 'id' | 'name' | 'color'>[]> {
  if (!query || query.length < 2) return [];
  
  const response = await fetch(`/api/categories?search=${encodeURIComponent(query)}&limit=10`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar categorias');
  }
  
  const result = await response.json();
  return result.data || [];
}

async function createCategory(data: CategoryFormData): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar categoria');
  }
  
  return response.json();
}

async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar categoria');
  }
  
  return response.json();
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir categoria');
  }
}

async function reorderCategories(categoryIds: string[]): Promise<void> {
  const response = await fetch('/api/categories/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryIds }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao reordenar categorias');
  }
}

async function bulkDeleteCategories(ids: string[]): Promise<BulkOperationResult> {
  const response = await fetch('/api/categories/bulk', {
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

async function bulkUpdateStatus(
  ids: string[], 
  status: 'activate' | 'deactivate'
): Promise<BulkOperationResult> {
  const response = await fetch('/api/categories/bulk', {
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

async function activateCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'activate' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao ativar categoria');
  }
  
  return response.json();
}

async function deactivateCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deactivate' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao desativar categoria');
  }
  
  return response.json();
}

async function restoreCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao restaurar categoria');
  }
  
  return response.json();
}

// ============================================================================
// Query Keys
// ============================================================================

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  stats: () => [...categoryKeys.all, 'stats'] as const,
  search: (query: string) => [...categoryKeys.all, 'search', query] as const,
};

// ============================================================================
// useCategories Hook - List with Filters
// ============================================================================

interface UseCategoriesOptions {
  initialParams?: Partial<CategoryListParams>;
  enabled?: boolean;
}

interface UseCategoriesReturn {
  // Data
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  
  // Filters
  filters: CategoryFilters;
  setFilters: (filters: Partial<CategoryFilters>) => void;
  resetFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  
  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  
  // Actions
  refetch: () => void;
  
  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  
  // Bulk Actions
  bulkDelete: (ids?: string[]) => Promise<void>;
  bulkActivate: (ids?: string[]) => Promise<void>;
  bulkDeactivate: (ids?: string[]) => Promise<void>;
  isBulkLoading: boolean;
}

const defaultFilters: CategoryFilters = {
  search: '',
  status: undefined,
  parentId: undefined,
  rootOnly: false,
};

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { initialParams = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  
  // Local state
  const [filters, setFiltersState] = useState<CategoryFilters>({
    ...defaultFilters,
    ...initialParams,
  });
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit, setLimit] = useState(initialParams.limit || 20);
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialParams.sortOrder || 'asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Build query params
  const queryParams: CategoryListParams = useMemo(() => ({
    page,
    limit,
    search: debouncedSearch,
    status: filters.status,
    parentId: filters.parentId,
    rootOnly: filters.rootOnly,
    sortBy,
    sortOrder,
  }), [page, limit, debouncedSearch, filters.status, filters.parentId, filters.rootOnly, sortBy, sortOrder]);
  
  // Main query
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: categoryKeys.list(queryParams),
    queryFn: () => fetchCategories(queryParams),
    enabled,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
  
  // Bulk mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteCategories,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(`${result.affected} categoria(s) excluída(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const bulkActivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateStatus(ids, 'activate'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(`${result.affected} categoria(s) ativada(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const bulkDeactivateMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateStatus(ids, 'deactivate'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(`${result.affected} categoria(s) desativada(s)`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  // Filter handlers
  const setFilters = useCallback((newFilters: Partial<CategoryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset page on filter change
  }, []);
  
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPage(1);
  }, []);
  
  // Sort handler
  const setSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    if (field === sortBy && !order) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(order || 'asc');
    }
    setPage(1);
  }, [sortBy]);
  
  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);
  
  const selectAll = useCallback(() => {
    if (data?.data) {
      setSelectedIds(data.data.map(cat => cat.id));
    }
  }, [data?.data]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);
  
  const isAllSelected = data?.data 
    ? data.data.length > 0 && selectedIds.length === data.data.length
    : false;
  
  // Bulk action handlers
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
    categories: data?.data || [],
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
// useCategoryTree Hook - Hierarchical Tree Structure
// ============================================================================

interface UseCategoryTreeOptions {
  enabled?: boolean;
}

interface UseCategoryTreeReturn {
  tree: CategoryTreeNode[];
  flatList: CategoryTreeNode[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Tree manipulation
  expandedIds: string[];
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isExpanded: (id: string) => boolean;
  
  // Reorder
  reorder: (categoryIds: string[]) => Promise<void>;
  isReordering: boolean;
  
  // Utilities
  findNode: (id: string) => CategoryTreeNode | undefined;
  getPath: (id: string) => CategoryTreeNode[];
  getChildren: (id: string) => CategoryTreeNode[];
  getRootCategories: () => CategoryTreeNode[];
}

function flattenTree(nodes: CategoryTreeNode[], result: CategoryTreeNode[] = []): CategoryTreeNode[] {
  for (const node of nodes) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result);
    }
  }
  return result;
}

function findNodeInTree(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function getPathToNode(nodes: CategoryTreeNode[], id: string, path: CategoryTreeNode[] = []): CategoryTreeNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [...path, node];
    }
    if (node.children) {
      const foundPath = getPathToNode(node.children, id, [...path, node]);
      if (foundPath.length > 0) return foundPath;
    }
  }
  return [];
}

function getAllIds(nodes: CategoryTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids.push(...getAllIds(node.children));
    }
  }
  return ids;
}

export function useCategoryTree(options: UseCategoryTreeOptions = {}): UseCategoryTreeReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  const {
    data: tree = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: fetchCategoryTree,
    enabled,
    staleTime: 30000,
  });
  
  const reorderMutation = useMutation({
    mutationFn: reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Categorias reordenadas com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const flatList = useMemo(() => flattenTree(tree), [tree]);
  
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => 
      prev.includes(id)
        ? prev.filter(expandedId => expandedId !== id)
        : [...prev, id]
    );
  }, []);
  
  const expandAll = useCallback(() => {
    setExpandedIds(getAllIds(tree));
  }, [tree]);
  
  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);
  
  const isExpanded = useCallback((id: string) => {
    return expandedIds.includes(id);
  }, [expandedIds]);
  
  const findNode = useCallback((id: string) => {
    return findNodeInTree(tree, id);
  }, [tree]);
  
  const getPath = useCallback((id: string) => {
    return getPathToNode(tree, id);
  }, [tree]);
  
  const getChildren = useCallback((id: string) => {
    const node = findNodeInTree(tree, id);
    return node?.children || [];
  }, [tree]);
  
  const getRootCategories = useCallback(() => {
    return tree;
  }, [tree]);
  
  const reorder = useCallback(async (categoryIds: string[]) => {
    await reorderMutation.mutateAsync(categoryIds);
  }, [reorderMutation]);
  
  return {
    tree,
    flatList,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    expandedIds,
    toggleExpand,
    expandAll,
    collapseAll,
    isExpanded,
    reorder,
    isReordering: reorderMutation.isPending,
    findNode,
    getPath,
    getChildren,
    getRootCategories,
  };
}

// ============================================================================
// useCategory Hook - Single Category Details
// ============================================================================

interface UseCategoryOptions {
  enabled?: boolean;
}

interface UseCategoryReturn {
  category: Category | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Actions
  update: (data: Partial<CategoryFormData>) => Promise<Category>;
  remove: () => Promise<void>;
  activate: () => Promise<Category>;
  deactivate: () => Promise<Category>;
  restore: () => Promise<Category>;
  
  // States
  isUpdating: boolean;
  isDeleting: boolean;
  isActivating: boolean;
  isDeactivating: boolean;
  isRestoring: boolean;
}

export function useCategory(id: string | null, options: UseCategoryOptions = {}): UseCategoryReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  
  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: categoryKeys.detail(id || ''),
    queryFn: () => fetchCategory(id!),
    enabled: enabled && !!id,
    staleTime: 30000,
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CategoryFormData>) => updateCategory(id!, data),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(categoryKeys.detail(id!), updatedCategory);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success('Categoria atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Categoria excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const activateMutation = useMutation({
    mutationFn: () => activateCategory(id!),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(categoryKeys.detail(id!), updatedCategory);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success('Categoria ativada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCategory(id!),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(categoryKeys.detail(id!), updatedCategory);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success('Categoria desativada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const restoreMutation = useMutation({
    mutationFn: () => restoreCategory(id!),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(categoryKeys.detail(id!), updatedCategory);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success('Categoria restaurada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const update = useCallback(async (data: Partial<CategoryFormData>) => {
    return updateMutation.mutateAsync(data);
  }, [updateMutation]);
  
  const remove = useCallback(async () => {
    return deleteMutation.mutateAsync();
  }, [deleteMutation]);
  
  const activate = useCallback(async () => {
    return activateMutation.mutateAsync();
  }, [activateMutation]);
  
  const deactivate = useCallback(async () => {
    return deactivateMutation.mutateAsync();
  }, [deactivateMutation]);
  
  const restore = useCallback(async () => {
    return restoreMutation.mutateAsync();
  }, [restoreMutation]);
  
  return {
    category: category || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    update,
    remove,
    activate,
    deactivate,
    restore,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

// ============================================================================
// useCategoryStats Hook
// ============================================================================

interface UseCategoryStatsReturn {
  stats: CategoryStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategoryStats(): UseCategoryStatsReturn {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: categoryKeys.stats(),
    queryFn: fetchCategoryStats,
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
// useCategorySearch Hook - Lightweight Search for Autocomplete
// ============================================================================

interface UseCategorySearchOptions {
  minLength?: number;
  debounceMs?: number;
}

interface UseCategorySearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Pick<Category, 'id' | 'name' | 'color'>[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useCategorySearch(options: UseCategorySearchOptions = {}): UseCategorySearchReturn {
  const { minLength = 2, debounceMs = 300 } = options;
  
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);
  
  const {
    data: results = [],
    isFetching: isSearching,
  } = useQuery({
    queryKey: categoryKeys.search(debouncedQuery),
    queryFn: () => searchCategories(debouncedQuery),
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
// useCategoryMutations Hook - Standalone Mutations
// ============================================================================

interface UseCategoryMutationsReturn {
  create: (data: CategoryFormData) => Promise<Category>;
  update: (id: string, data: Partial<CategoryFormData>) => Promise<Category>;
  remove: (id: string) => Promise<void>;
  reorder: (categoryIds: string[]) => Promise<void>;
  
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReordering: boolean;
}

export function useCategoryMutations(): UseCategoryMutationsReturn {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => 
      updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success('Categoria atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Categoria excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const reorderMutation = useMutation({
    mutationFn: reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Categorias reordenadas com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const create = useCallback(async (data: CategoryFormData) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);
  
  const update = useCallback(async (id: string, data: Partial<CategoryFormData>) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);
  
  const remove = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);
  
  const reorder = useCallback(async (categoryIds: string[]) => {
    return reorderMutation.mutateAsync(categoryIds);
  }, [reorderMutation]);
  
  return {
    create,
    update,
    remove,
    reorder,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}

// ============================================================================
// useParentCategoryOptions Hook - For Parent Selection Dropdown
// ============================================================================

interface UseParentCategoryOptionsReturn {
  options: Array<{ value: string; label: string; level: number; disabled?: boolean }>;
  isLoading: boolean;
}

export function useParentCategoryOptions(excludeId?: string): UseParentCategoryOptionsReturn {
  const { tree, isLoading } = useCategoryTree();
  
  const options = useMemo(() => {
    const result: Array<{ value: string; label: string; level: number; disabled?: boolean }> = [];
    
    function processNode(node: CategoryTreeNode, level: number = 0) {
      const isExcluded = node.id === excludeId;
      const prefix = '—'.repeat(level);
      
      result.push({
        value: node.id,
        label: level > 0 ? `${prefix} ${node.name}` : node.name,
        level,
        disabled: isExcluded,
      });
      
      if (node.children && !isExcluded) {
        for (const child of node.children) {
          processNode(child, level + 1);
        }
      }
    }
    
    for (const node of tree) {
      processNode(node);
    }
    
    return result;
  }, [tree, excludeId]);
  
  return { options, isLoading };
}

// ============================================================================
// Export all hooks
// ============================================================================

export {
  fetchCategories,
  fetchCategoryTree,
  fetchCategory,
  fetchCategoryStats,
  searchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  bulkDeleteCategories,
  bulkUpdateStatus,
};
