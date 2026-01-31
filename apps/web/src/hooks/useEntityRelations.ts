/**
 * GLAMO - useEntityRelations Hook
 * Managing entity relationships and inline creation
 * 
 * @version 1.0.0
 * @description Handles related entity loading, selection, and inline creation
 */

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { UUID, PaginatedResponse, PaginationParams, EntityStatus, SortDirection } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EntityOption<T = unknown> {
  id: UUID;
  label: string;
  value: UUID;
  data: T;
  isNew?: boolean;
  isDisabled?: boolean;
  group?: string;
}

export interface EntityRelationConfig<T> {
  /** Entity name for display purposes */
  entityName: string;
  /** Label field path or function */
  getLabel: (item: T) => string;
  /** Optional grouping function */
  getGroup?: (item: T) => string | undefined;
  /** Optional disabled check */
  isDisabled?: (item: T) => boolean;
  /** Fetch function for loading entities */
  fetch: (params: EntityFetchParams) => Promise<PaginatedResponse<T>>;
  /** Search function (optional, falls back to fetch) */
  search?: (query: string, params?: Partial<EntityFetchParams>) => Promise<T[]>;
  /** Create function for inline creation */
  create?: (data: Partial<T>) => Promise<T>;
  /** Validate function before creation */
  validate?: (data: Partial<T>) => Promise<boolean> | boolean;
  /** Default values for new entities */
  defaultValues?: Partial<T>;
  /** Minimum search length */
  minSearchLength?: number;
  /** Debounce delay for search */
  searchDelay?: number;
  /** Cache duration in ms */
  cacheDuration?: number;
  /** Whether to preload on mount */
  preload?: boolean;
  /** Filter function for loaded entities */
  filter?: (item: T) => boolean;
  /** Sort function for loaded entities */
  sort?: (a: T, b: T) => number;
}

export interface EntityFetchParams extends PaginationParams {
  search?: string;
  status?: EntityStatus;
  excludeIds?: UUID[];
  includeIds?: UUID[];
}

export interface EntityRelationState<T> {
  /** All loaded options */
  options: EntityOption<T>[];
  /** Currently selected values */
  selected: EntityOption<T>[];
  /** Loading state */
  isLoading: boolean;
  /** Search loading state */
  isSearching: boolean;
  /** Creating state */
  isCreating: boolean;
  /** Error state */
  error: Error | null;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Current search query */
  searchQuery: string;
  /** Total available items */
  total: number;
}

export interface EntityRelationHelpers<T> {
  /** Load initial options */
  load: () => Promise<void>;
  /** Load more options (pagination) */
  loadMore: () => Promise<void>;
  /** Search for options */
  search: (query: string) => Promise<void>;
  /** Clear search */
  clearSearch: () => void;
  /** Select an option */
  select: (option: EntityOption<T>) => void;
  /** Deselect an option */
  deselect: (option: EntityOption<T>) => void;
  /** Toggle selection */
  toggle: (option: EntityOption<T>) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Set selections directly */
  setSelected: (options: EntityOption<T>[]) => void;
  /** Create new entity inline */
  create: (data: Partial<T>) => Promise<EntityOption<T>>;
  /** Refresh options from server */
  refresh: () => Promise<void>;
  /** Get option by ID */
  getById: (id: UUID) => EntityOption<T> | undefined;
  /** Check if ID is selected */
  isSelected: (id: UUID) => boolean;
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  params: string;
}

const entityCache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(entityName: string, params: EntityFetchParams): string {
  return `${entityName}:${JSON.stringify(params)}`;
}

function getFromCache<T>(
  entityName: string,
  params: EntityFetchParams,
  duration: number
): T[] | null {
  const key = getCacheKey(entityName, params);
  const entry = entityCache.get(key) as CacheEntry<T> | undefined;
  
  if (entry && Date.now() - entry.timestamp < duration) {
    return entry.data;
  }
  
  return null;
}

function setCache<T>(
  entityName: string,
  params: EntityFetchParams,
  data: T[]
): void {
  const key = getCacheKey(entityName, params);
  entityCache.set(key, {
    data,
    timestamp: Date.now(),
    params: JSON.stringify(params),
  });
}

function clearEntityCache(entityName: string): void {
  for (const key of entityCache.keys()) {
    if (key.startsWith(`${entityName}:`)) {
      entityCache.delete(key);
    }
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useEntityRelations<T extends { id: UUID }>(
  config: EntityRelationConfig<T>,
  initialSelected: T[] = []
): [EntityRelationState<T>, EntityRelationHelpers<T>] {
  const {
    entityName,
    getLabel,
    getGroup,
    isDisabled,
    fetch,
    search: searchFn,
    create: createFn,
    validate,
    defaultValues,
    minSearchLength = 2,
    searchDelay = 300,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    preload = true,
    filter,
    sort,
  } = config;

  // State
  const [options, setOptions] = useState<EntityOption<T>[]>([]);
  const [selected, setSelected] = useState<EntityOption<T>[]>(() =>
    initialSelected.map(item => toOption(item))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  // Refs
  const pageRef = useRef(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Convert entity to option
  function toOption(item: T): EntityOption<T> {
    return {
      id: item.id,
      label: getLabel(item),
      value: item.id,
      data: item,
      isDisabled: isDisabled?.(item),
      group: getGroup?.(item),
    };
  }

  // Apply filter and sort
  const processItems = useCallback((items: T[]): EntityOption<T>[] => {
    let result = items;
    
    if (filter) {
      result = result.filter(filter);
    }
    
    if (sort) {
      result = [...result].sort(sort);
    }
    
    return result.map(toOption);
  }, [filter, sort]);

  // Load options
  const load = useCallback(async () => {
    if (isLoading) return;
    
    // Cancel any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    pageRef.current = 1;

    const params: EntityFetchParams = {
      page: 1,
      pageSize: 50,
    };

    try {
      // Check cache first
      const cached = getFromCache<T>(entityName, params, cacheDuration);
      if (cached) {
        const processed = processItems(cached);
        setOptions(processed);
        setTotal(cached.length);
        setHasMore(false); // Cached data is complete page
        setIsLoading(false);
        return;
      }

      const response = await fetch(params);
      
      setCache(entityName, params, response.data);
      
      const processed = processItems(response.data);
      setOptions(processed);
      setTotal(response.pagination.total);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [entityName, fetch, cacheDuration, processItems, isLoading]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    pageRef.current += 1;

    const params: EntityFetchParams = {
      page: pageRef.current,
      pageSize: 50,
      search: searchQuery || undefined,
    };

    try {
      const response = await fetch(params);
      
      const processed = processItems(response.data);
      setOptions(prev => [...prev, ...processed]);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (err) {
      setError(err as Error);
      pageRef.current -= 1; // Rollback page
    } finally {
      setIsLoading(false);
    }
  }, [fetch, hasMore, isLoading, processItems, searchQuery]);

  // Search
  const search = useCallback(async (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear results if query is too short
    if (query.length < minSearchLength) {
      if (query.length === 0) {
        load(); // Reload initial options
      }
      return;
    }

    // Debounce search
    return new Promise<void>((resolve) => {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        setError(null);
        pageRef.current = 1;

        try {
          let results: T[];

          if (searchFn) {
            results = await searchFn(query);
          } else {
            const response = await fetch({
              page: 1,
              pageSize: 50,
              search: query,
            });
            results = response.data;
          }

          const processed = processItems(results);
          setOptions(processed);
          setHasMore(false); // Search results don't paginate
          resolve();
        } catch (err) {
          setError(err as Error);
          resolve();
        } finally {
          setIsSearching(false);
        }
      }, searchDelay);
    });
  }, [fetch, load, minSearchLength, processItems, searchDelay, searchFn]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    load();
  }, [load]);

  // Select option
  const select = useCallback((option: EntityOption<T>) => {
    setSelected(prev => {
      if (prev.some(o => o.id === option.id)) {
        return prev;
      }
      return [...prev, option];
    });
  }, []);

  // Deselect option
  const deselect = useCallback((option: EntityOption<T>) => {
    setSelected(prev => prev.filter(o => o.id !== option.id));
  }, []);

  // Toggle selection
  const toggle = useCallback((option: EntityOption<T>) => {
    setSelected(prev => {
      if (prev.some(o => o.id === option.id)) {
        return prev.filter(o => o.id !== option.id);
      }
      return [...prev, option];
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  // Set selected directly
  const setSelectedOptions = useCallback((newSelected: EntityOption<T>[]) => {
    setSelected(newSelected);
  }, []);

  // Create new entity
  const create = useCallback(async (data: Partial<T>): Promise<EntityOption<T>> => {
    if (!createFn) {
      throw new Error(`Create function not configured for ${entityName}`);
    }

    const createData = { ...defaultValues, ...data };

    // Validate if function provided
    if (validate) {
      const isValid = await validate(createData);
      if (!isValid) {
        throw new Error('Validation failed');
      }
    }

    setIsCreating(true);
    setError(null);

    try {
      const created = await createFn(createData);
      const option = toOption(created);
      option.isNew = true;

      // Add to options and select
      setOptions(prev => [option, ...prev]);
      
      // Invalidate cache
      clearEntityCache(entityName);

      return option;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [createFn, defaultValues, entityName, validate]);

  // Refresh from server
  const refresh = useCallback(async () => {
    clearEntityCache(entityName);
    await load();
  }, [entityName, load]);

  // Get option by ID
  const getById = useCallback((id: UUID): EntityOption<T> | undefined => {
    return options.find(o => o.id === id) || selected.find(o => o.id === id);
  }, [options, selected]);

  // Check if ID is selected
  const isSelected = useCallback((id: UUID): boolean => {
    return selected.some(o => o.id === id);
  }, [selected]);

  // Preload on mount
  useEffect(() => {
    if (preload) {
      load();
    }
  }, [preload, load]);

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const state: EntityRelationState<T> = {
    options,
    selected,
    isLoading,
    isSearching,
    isCreating,
    error,
    hasMore,
    searchQuery,
    total,
  };

  const helpers: EntityRelationHelpers<T> = {
    load,
    loadMore,
    search,
    clearSearch,
    select,
    deselect,
    toggle,
    clearSelection,
    setSelected: setSelectedOptions,
    create,
    refresh,
    getById,
    isSelected,
  };

  return [state, helpers];
}

// ============================================================================
// SINGLE ENTITY RELATION
// ============================================================================

/**
 * Simplified hook for single entity selection
 */
export function useSingleEntityRelation<T extends { id: UUID }>(
  config: EntityRelationConfig<T>,
  initialValue?: T
): {
  state: Omit<EntityRelationState<T>, 'selected'> & { selected: EntityOption<T> | null };
  value: T | null;
  select: (option: EntityOption<T> | null) => void;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  create: (data: Partial<T>) => Promise<EntityOption<T>>;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [relationState, helpers] = useEntityRelations<T>(
    config,
    initialValue ? [initialValue] : []
  );

  const selected = relationState.selected[0] || null;
  const value = selected?.data || null;

  const select = useCallback((option: EntityOption<T> | null) => {
    helpers.clearSelection();
    if (option) {
      helpers.select(option);
    }
  }, [helpers]);

  return {
    state: { ...relationState, selected },
    value,
    select,
    search: helpers.search,
    clearSearch: helpers.clearSearch,
    create: helpers.create,
    load: helpers.load,
    refresh: helpers.refresh,
  };
}

// ============================================================================
// MULTI ENTITY RELATION
// ============================================================================

/**
 * Simplified hook for multiple entity selection
 */
export function useMultiEntityRelation<T extends { id: UUID }>(
  config: EntityRelationConfig<T>,
  initialValues: T[] = [],
  maxSelection?: number
): {
  state: EntityRelationState<T>;
  values: T[];
  select: (option: EntityOption<T>) => void;
  deselect: (option: EntityOption<T>) => void;
  toggle: (option: EntityOption<T>) => void;
  clear: () => void;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  create: (data: Partial<T>) => Promise<EntityOption<T>>;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  canSelectMore: boolean;
} {
  const [state, helpers] = useEntityRelations<T>(config, initialValues);

  const values = useMemo(
    () => state.selected.map(o => o.data),
    [state.selected]
  );

  const canSelectMore = maxSelection === undefined || state.selected.length < maxSelection;

  const select = useCallback((option: EntityOption<T>) => {
    if (!canSelectMore) return;
    helpers.select(option);
  }, [canSelectMore, helpers]);

  return {
    state,
    values,
    select,
    deselect: helpers.deselect,
    toggle: helpers.toggle,
    clear: helpers.clearSelection,
    search: helpers.search,
    clearSearch: helpers.clearSearch,
    create: helpers.create,
    load: helpers.load,
    refresh: helpers.refresh,
    canSelectMore,
  };
}

export default useEntityRelations;
