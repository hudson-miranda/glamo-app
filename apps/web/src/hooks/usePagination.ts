/**
 * GLAMO - usePagination Hook
 * Pagination state management for lists
 * 
 * @version 1.0.0
 * @description Complete pagination with URL sync support
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
  urlPageParam?: string;
  urlPageSizeParam?: string;
}

export interface PaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  showing: string;
}

export interface UsePaginationReturn extends PaginationState, PaginationMeta {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
  getApiParams: () => { page: number; limit: number; offset: number };
  pageSizeOptions: number[];
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

// ============================================================================
// HOOK
// ============================================================================

export function usePagination(config: PaginationConfig = {}): UsePaginationReturn {
  const {
    initialPage = DEFAULT_PAGE,
    initialPageSize = DEFAULT_PAGE_SIZE,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    syncWithUrl = false,
    urlPageParam = 'page',
    urlPageSizeParam = 'pageSize',
  } = config;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL if syncing
  const getInitialPage = useCallback(() => {
    if (syncWithUrl) {
      const urlPage = searchParams.get(urlPageParam);
      if (urlPage) {
        const parsed = parseInt(urlPage, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    }
    return initialPage;
  }, [syncWithUrl, searchParams, urlPageParam, initialPage]);

  const getInitialPageSize = useCallback(() => {
    if (syncWithUrl) {
      const urlPageSize = searchParams.get(urlPageSizeParam);
      if (urlPageSize) {
        const parsed = parseInt(urlPageSize, 10);
        if (!isNaN(parsed) && pageSizeOptions.includes(parsed)) return parsed;
      }
    }
    return initialPageSize;
  }, [syncWithUrl, searchParams, urlPageSizeParam, initialPageSize, pageSizeOptions]);

  // State
  const [page, setPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  // Update URL when pagination changes
  const updateUrl = useCallback((newPage: number, newPageSize: number) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams.toString());
    
    if (newPage !== DEFAULT_PAGE) {
      params.set(urlPageParam, newPage.toString());
    } else {
      params.delete(urlPageParam);
    }
    
    if (newPageSize !== DEFAULT_PAGE_SIZE) {
      params.set(urlPageSizeParam, newPageSize.toString());
    } else {
      params.delete(urlPageSizeParam);
    }

    const newUrl = params.toString() 
      ? `${pathname}?${params.toString()}`
      : pathname;
    
    router.replace(newUrl, { scroll: false });
  }, [syncWithUrl, searchParams, pathname, router, urlPageParam, urlPageSizeParam]);

  // Sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (syncWithUrl) {
      setPageState(getInitialPage());
      setPageSizeState(getInitialPageSize());
    }
  }, [syncWithUrl, searchParams, getInitialPage, getInitialPageSize]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalPages = useMemo(() => {
    if (totalItems === 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPreviousPage = useMemo(() => page > 1, [page]);

  const startIndex = useMemo(() => {
    if (totalItems === 0) return 0;
    return (page - 1) * pageSize + 1;
  }, [page, pageSize, totalItems]);

  const endIndex = useMemo(() => {
    const end = page * pageSize;
    return end > totalItems ? totalItems : end;
  }, [page, pageSize, totalItems]);

  const showing = useMemo(() => {
    if (totalItems === 0) return 'Nenhum item';
    return `${startIndex}-${endIndex} de ${totalItems}`;
  }, [startIndex, endIndex, totalItems]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const setPage = useCallback((newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPageState(clampedPage);
    updateUrl(clampedPage, pageSize);
  }, [totalPages, pageSize, updateUrl]);

  const setPageSize = useCallback((newPageSize: number) => {
    // When changing page size, try to keep the same first item visible
    const currentFirstItem = (page - 1) * pageSize + 1;
    const newPage = Math.ceil(currentFirstItem / newPageSize);
    
    setPageSizeState(newPageSize);
    setPageState(Math.max(1, newPage));
    updateUrl(Math.max(1, newPage), newPageSize);
  }, [page, pageSize, updateUrl]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  }, [hasNextPage, page, setPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  }, [hasPreviousPage, page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  const goToPage = useCallback((targetPage: number) => {
    setPage(targetPage);
  }, [setPage]);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    setTotalItems(0);
    updateUrl(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, updateUrl]);

  const getApiParams = useCallback(() => ({
    page,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }), [page, pageSize]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    
    // Meta
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    showing,
    
    // Actions
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    goToPage,
    reset,
    
    // API helpers
    getApiParams,
    pageSizeOptions,
  };
}

// ============================================================================
// PAGE NUMBERS HELPER
// ============================================================================

export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  // Calculate start and end of visible range
  let start = Math.max(2, currentPage - halfVisible + 1);
  let end = Math.min(totalPages - 1, currentPage + halfVisible - 1);

  // Adjust if we're near the beginning
  if (currentPage <= halfVisible) {
    end = Math.min(totalPages - 1, maxVisible - 2);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('ellipsis');
  }

  // Add visible pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default usePagination;
