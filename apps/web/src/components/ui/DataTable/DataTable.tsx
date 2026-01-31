/**
 * GLAMO - DataTable Component
 * Advanced data table with sorting, filtering, and selection
 * 
 * @version 1.0.0
 * @description Enterprise-grade data table for management modules
 */

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '@/lib/utils';
import type { UUID, SortDirection, PaginationMeta } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type ColumnAlign = 'left' | 'center' | 'right';

export interface ColumnDefinition<T> {
  /** Unique column ID */
  id: string;
  /** Column header text */
  header: string | ReactNode;
  /** Accessor key or function to get cell value */
  accessor: keyof T | ((row: T) => unknown);
  /** Cell renderer */
  cell?: (value: unknown, row: T, index: number) => ReactNode;
  /** Header renderer */
  headerCell?: () => ReactNode;
  /** Column width (px or %) */
  width?: string | number;
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Text alignment */
  align?: ColumnAlign;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Whether column is visible */
  visible?: boolean;
  /** Column is sticky */
  sticky?: 'left' | 'right';
  /** Column can be resized */
  resizable?: boolean;
  /** Custom class for cells */
  cellClassName?: string | ((value: unknown, row: T) => string);
  /** Custom class for header */
  headerClassName?: string;
  /** Tooltip for header */
  tooltip?: string;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Filter type */
  filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean';
  /** Filter options (for select type) */
  filterOptions?: { value: string; label: string }[];
}

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface FilterState {
  [columnId: string]: unknown;
}

export interface SelectionState<T> {
  /** Whether all rows are selected */
  all: boolean;
  /** Set of selected row IDs */
  ids: Set<UUID>;
  /** Selected rows */
  rows: T[];
}

export interface DataTableProps<T extends { id: UUID }> {
  /** Data to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Empty state message */
  emptyMessage?: string | ReactNode;
  /** Empty state with search/filters */
  noResultsMessage?: string | ReactNode;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Selection mode */
  selectionMode?: 'single' | 'multiple';
  /** Controlled selection */
  selectedIds?: UUID[];
  /** Selection change callback */
  onSelectionChange?: (selection: SelectionState<T>) => void;
  /** Row click callback */
  onRowClick?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Row double click callback */
  onRowDoubleClick?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Row context menu callback */
  onRowContextMenu?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Sort state */
  sortState?: SortState;
  /** Sort change callback */
  onSortChange?: (sort: SortState) => void;
  /** Whether sorting is handled server-side */
  serverSideSort?: boolean;
  /** Filter state */
  filterState?: FilterState;
  /** Filter change callback */
  onFilterChange?: (filters: FilterState) => void;
  /** Pagination metadata */
  pagination?: PaginationMeta;
  /** Page change callback */
  onPageChange?: (page: number) => void;
  /** Page size change callback */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page sizes */
  pageSizes?: number[];
  /** Show pagination */
  showPagination?: boolean;
  /** Table density */
  density?: 'compact' | 'normal' | 'comfortable';
  /** Striped rows */
  striped?: boolean;
  /** Bordered cells */
  bordered?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Table height (for sticky header) */
  maxHeight?: string | number;
  /** Custom row key extractor */
  getRowKey?: (row: T) => string;
  /** Custom row class */
  getRowClassName?: (row: T, index: number) => string;
  /** Row actions renderer */
  rowActions?: (row: T, index: number) => ReactNode;
  /** Bulk actions renderer */
  bulkActions?: (selection: SelectionState<T>) => ReactNode;
  /** Header actions */
  headerActions?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Custom class */
  className?: string;
  /** Container class */
  containerClassName?: string;
  /** ID for the table */
  id?: string;
  /** Virtualization threshold */
  virtualizationThreshold?: number;
  /** Custom empty component */
  emptyComponent?: ReactNode;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom error component */
  errorComponent?: ReactNode;
}

export interface DataTableRef<T> {
  /** Get selected rows */
  getSelection: () => SelectionState<T>;
  /** Select all rows */
  selectAll: () => void;
  /** Deselect all rows */
  deselectAll: () => void;
  /** Select rows by IDs */
  selectByIds: (ids: UUID[]) => void;
  /** Scroll to row */
  scrollToRow: (id: UUID) => void;
  /** Get current data (filtered/sorted) */
  getData: () => T[];
}

// ============================================================================
// DENSITY STYLES
// ============================================================================

const DENSITY_STYLES = {
  compact: {
    cell: 'px-3 py-1.5 text-sm',
    header: 'px-3 py-2 text-xs',
  },
  normal: {
    cell: 'px-4 py-3 text-sm',
    header: 'px-4 py-3 text-sm',
  },
  comfortable: {
    cell: 'px-5 py-4 text-base',
    header: 'px-5 py-4 text-sm',
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface SortIconProps {
  direction: SortDirection | null;
  className?: string;
}

function SortIcon({ direction, className }: SortIconProps) {
  return (
    <span className={cn('ml-1 inline-flex flex-col', className)}>
      <svg
        className={cn(
          'w-3 h-3 -mb-1',
          direction === 'asc' ? 'text-pink-500' : 'text-gray-300 dark:text-gray-600'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 10l5-7 5 7H5z" />
      </svg>
      <svg
        className={cn(
          'w-3 h-3 -mt-1',
          direction === 'desc' ? 'text-pink-500' : 'text-gray-300 dark:text-gray-600'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M15 10l-5 7-5-7h10z" />
      </svg>
    </span>
  );
}

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  className,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={cn(
        'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
        'text-pink-500 focus:ring-pink-500 dark:focus:ring-pink-400',
        'bg-white dark:bg-gray-800',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-600 border-t-pink-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando...
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  message: string | ReactNode;
  hasFilters?: boolean;
}

function EmptyState({ message, hasFilters }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={
                hasFilters
                  ? 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  : 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              }
            />
          </svg>
        </div>
        <div className="text-gray-500 dark:text-gray-400">{message}</div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: number[];
  density?: 'compact' | 'normal' | 'comfortable';
}

function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50, 100],
  density = 'normal',
}: PaginationProps) {
  const { page, totalPages, total, pageSize } = pagination;

  const pages = useMemo(() => {
    const result: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      result.push(1);

      if (page > halfVisible + 2) {
        result.push('ellipsis');
      }

      const start = Math.max(2, page - halfVisible);
      const end = Math.min(totalPages - 1, page + halfVisible);

      for (let i = start; i <= end; i++) {
        result.push(i);
      }

      if (page < totalPages - halfVisible - 1) {
        result.push('ellipsis');
      }

      result.push(totalPages);
    }

    return result;
  }, [page, totalPages]);

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'border-t border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        density === 'compact' && 'px-3 py-2',
        density === 'normal' && 'px-4 py-3',
        density === 'comfortable' && 'px-5 py-4'
      )}
    >
      {/* Left: Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Mostrando {startItem} a {endItem} de {total} itens
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm py-1 px-2"
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'p-1.5 rounded text-gray-500 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-gray-400 dark:text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[32px] h-8 rounded text-sm font-medium',
                p === page
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'p-1.5 rounded text-gray-500 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DataTableInner<T extends { id: UUID }>(
  props: DataTableProps<T>,
  ref: React.ForwardedRef<DataTableRef<T>>
) {
  const {
    data,
    columns,
    isLoading = false,
    error = null,
    emptyMessage = 'Nenhum registro encontrado',
    noResultsMessage = 'Nenhum resultado para os filtros aplicados',
    selectable = false,
    selectionMode = 'multiple',
    selectedIds: controlledSelectedIds,
    onSelectionChange,
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    sortState: controlledSortState,
    onSortChange,
    serverSideSort = false,
    filterState,
    pagination,
    onPageChange,
    onPageSizeChange,
    pageSizes,
    showPagination = true,
    density = 'normal',
    striped = true,
    bordered = false,
    hoverable = true,
    stickyHeader = false,
    maxHeight,
    getRowKey,
    getRowClassName,
    rowActions,
    bulkActions,
    headerActions,
    footer,
    className,
    containerClassName,
    id,
    emptyComponent,
    loadingComponent,
    errorComponent,
  } = props;

  // State
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<UUID>>(new Set());
  const [internalSortState, setInternalSortState] = useState<SortState | null>(null);

  // Determine controlled vs uncontrolled
  const selectedIds = controlledSelectedIds
    ? new Set(controlledSelectedIds)
    : internalSelectedIds;
  const sortState = controlledSortState ?? internalSortState;

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns]
  );

  // Get cell value
  const getCellValue = useCallback((row: T, column: ColumnDefinition<T>): unknown => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  }, []);

  // Process data (sort)
  const processedData = useMemo(() => {
    // Ensure data is always an array
    const safeData = data ?? [];
    
    if (!sortState || serverSideSort) return safeData;

    const column = columns.find((col) => col.id === sortState.columnId);
    if (!column) return safeData;

    const sorted = [...safeData].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b);
      }

      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, 'pt-BR');
      }

      return aValue < bValue ? -1 : 1;
    });

    return sortState.direction === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortState, serverSideSort, columns, getCellValue]);

  // Selection helpers
  const selectedRows = useMemo(
    () => processedData.filter((row) => selectedIds.has(row.id)),
    [processedData, selectedIds]
  );

  const allSelected = processedData.length > 0 && processedData.every((row) => selectedIds.has(row.id));
  const someSelected = processedData.some((row) => selectedIds.has(row.id)) && !allSelected;

  const updateSelection = useCallback(
    (newIds: Set<UUID>) => {
      if (!controlledSelectedIds) {
        setInternalSelectedIds(newIds);
      }
      onSelectionChange?.({
        all: processedData.every((row) => newIds.has(row.id)),
        ids: newIds,
        rows: processedData.filter((row) => newIds.has(row.id)),
      });
    },
    [controlledSelectedIds, onSelectionChange, processedData]
  );

  const toggleRow = useCallback(
    (row: T) => {
      const newIds = new Set(selectedIds);
      if (selectionMode === 'single') {
        newIds.clear();
      }
      if (newIds.has(row.id)) {
        newIds.delete(row.id);
      } else {
        newIds.add(row.id);
      }
      updateSelection(newIds);
    },
    [selectedIds, selectionMode, updateSelection]
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      updateSelection(new Set());
    } else {
      updateSelection(new Set(processedData.map((row) => row.id)));
    }
  }, [allSelected, processedData, updateSelection]);

  // Sort handler
  const handleSort = useCallback(
    (columnId: string) => {
      let newSort: SortState;

      if (sortState?.columnId === columnId) {
        if (sortState.direction === 'asc') {
          newSort = { columnId, direction: 'desc' };
        } else {
          newSort = { columnId, direction: 'asc' };
        }
      } else {
        newSort = { columnId, direction: 'asc' };
      }

      if (!controlledSortState) {
        setInternalSortState(newSort);
      }
      onSortChange?.(newSort);
    },
    [sortState, controlledSortState, onSortChange]
  );

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getSelection: () => ({
      all: allSelected,
      ids: selectedIds,
      rows: selectedRows,
    }),
    selectAll: toggleAll,
    deselectAll: () => updateSelection(new Set()),
    selectByIds: (ids) => updateSelection(new Set(ids)),
    scrollToRow: () => {
      // TODO: Implement with virtualization
    },
    getData: () => processedData,
  }));

  // Density styles
  const densityStyles = DENSITY_STYLES[density];

  // Row key extractor
  const getKey = (row: T): string => {
    if (getRowKey) return getRowKey(row);
    return row.id;
  };

  // Render
  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-red-500">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasFilters = filterState && Object.keys(filterState).length > 0;

  return (
    <div className={cn('flex flex-col', containerClassName)}>
      {/* Bulk Actions Bar */}
      {selectable && selectedIds.size > 0 && bulkActions && (
        <div className="flex items-center gap-4 px-4 py-3 bg-pink-50 dark:bg-pink-900/20 border-b border-pink-200 dark:border-pink-800">
          <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
            {selectedIds.size} item(ns) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            {bulkActions({
              all: allSelected,
              ids: selectedIds,
              rows: selectedRows,
            })}
          </div>
          <button
            onClick={() => updateSelection(new Set())}
            className="ml-auto text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Header Actions */}
      {headerActions && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {headerActions}
        </div>
      )}

      {/* Table Container */}
      <div
        className={cn(
          'overflow-auto',
          stickyHeader && maxHeight && `max-h-[${typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight}]`
        )}
      >
        <table
          id={id}
          className={cn(
            'w-full border-collapse',
            bordered && 'border border-gray-200 dark:border-gray-700',
            className
          )}
        >
          <thead
            className={cn(
              'bg-gray-50 dark:bg-gray-800',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th
                  className={cn(
                    densityStyles.header,
                    'w-12 text-center',
                    bordered && 'border-b border-gray-200 dark:border-gray-700'
                  )}
                >
                  {selectionMode === 'multiple' && (
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  )}
                </th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    densityStyles.header,
                    'font-semibold text-gray-600 dark:text-gray-300',
                    'whitespace-nowrap',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
                    bordered && 'border-b border-gray-200 dark:border-gray-700',
                    column.headerClassName
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                  title={column.tooltip}
                >
                  <div className="flex items-center">
                    {column.headerCell ? column.headerCell() : column.header}
                    {column.sortable && (
                      <SortIcon
                        direction={
                          sortState?.columnId === column.id ? sortState.direction : null
                        }
                      />
                    )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th
                  className={cn(
                    densityStyles.header,
                    'w-20 text-right',
                    bordered && 'border-b border-gray-200 dark:border-gray-700'
                  )}
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)
                  }
                >
                  {loadingComponent || <LoadingState />}
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)
                  }
                >
                  {emptyComponent || (
                    <EmptyState
                      message={hasFilters ? noResultsMessage : emptyMessage}
                      hasFilters={!!hasFilters}
                    />
                  )}
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr
                  key={getKey(row)}
                  className={cn(
                    'transition-colors',
                    striped && rowIndex % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50',
                    hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800',
                    selectedIds.has(row.id) && 'bg-pink-50 dark:bg-pink-900/20',
                    onRowClick && 'cursor-pointer',
                    getRowClassName?.(row, rowIndex)
                  )}
                  onClick={(e) => onRowClick?.(row, rowIndex, e)}
                  onDoubleClick={(e) => onRowDoubleClick?.(row, rowIndex, e)}
                  onContextMenu={(e) => onRowContextMenu?.(row, rowIndex, e)}
                >
                  {selectable && (
                    <td
                      className={cn(
                        densityStyles.cell,
                        'text-center',
                        bordered && 'border-b border-gray-200 dark:border-gray-700'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row)}
                      />
                    </td>
                  )}
                  {visibleColumns.map((column) => {
                    const value = getCellValue(row, column);
                    const cellClassName =
                      typeof column.cellClassName === 'function'
                        ? column.cellClassName(value, row)
                        : column.cellClassName;

                    return (
                      <td
                        key={column.id}
                        className={cn(
                          densityStyles.cell,
                          'text-gray-900 dark:text-gray-100',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          bordered && 'border-b border-gray-200 dark:border-gray-700',
                          cellClassName
                        )}
                      >
                        {column.cell
                          ? column.cell(value, row, rowIndex)
                          : (value as ReactNode)}
                      </td>
                    );
                  })}
                  {rowActions && (
                    <td
                      className={cn(
                        densityStyles.cell,
                        'text-right',
                        bordered && 'border-b border-gray-200 dark:border-gray-700'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rowActions(row, rowIndex)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700">{footer}</div>
      )}

      {/* Pagination */}
      {showPagination && pagination && onPageChange && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizes={pageSizes}
          density={density}
        />
      )}
    </div>
  );
}

// Forward ref wrapper with proper typing
export const DataTable = forwardRef(DataTableInner) as <T extends { id: UUID }>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<DataTableRef<T>> }
) => ReturnType<typeof DataTableInner>;

export default DataTable;
