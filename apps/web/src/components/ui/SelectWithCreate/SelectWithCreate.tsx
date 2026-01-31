/**
 * GLAMO - SelectWithCreate Component
 * Select with inline creation capability
 * 
 * @version 1.0.0
 * @description Allows selecting existing entities or creating new ones inline
 */

'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  useMemo,
  KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';
import type { UUID } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SelectOption<T = unknown> {
  id: UUID;
  label: string;
  value: UUID;
  data?: T;
  disabled?: boolean;
  group?: string;
  icon?: ReactNode;
  description?: string;
}

export interface SelectWithCreateProps<T = unknown> {
  /** Input name */
  name: string;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current selected value(s) */
  value: UUID | UUID[] | null;
  /** Change handler */
  onChange: (value: UUID | UUID[] | null, option?: SelectOption<T> | SelectOption<T>[]) => void;
  /** Available options */
  options: SelectOption<T>[];
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  /** Maximum selections (for multiple mode) */
  maxSelections?: number;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is loading options */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether search is enabled */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether creation is enabled */
  creatable?: boolean;
  /** Create button label */
  createLabel?: string;
  /** Create option handler */
  onCreate?: (inputValue: string) => void | Promise<void>;
  /** Whether inline create form should be shown */
  showInlineCreate?: boolean;
  /** Inline create form renderer */
  inlineCreateForm?: (props: InlineCreateFormProps) => ReactNode;
  /** Option renderer */
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => ReactNode;
  /** Selected value renderer */
  renderValue?: (option: SelectOption<T>) => ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** No results message */
  noResultsMessage?: string;
  /** Option groups */
  groupBy?: (option: SelectOption<T>) => string | undefined;
  /** Clear button */
  clearable?: boolean;
  /** Custom filter function */
  filterOption?: (option: SelectOption<T>, searchValue: string) => boolean;
  /** Async search handler */
  onSearch?: (query: string) => void | Promise<void>;
  /** Search debounce delay */
  searchDelay?: number;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Custom class */
  className?: string;
  /** Container class */
  containerClassName?: string;
  /** Dropdown class */
  dropdownClassName?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** On blur callback */
  onBlur?: () => void;
  /** On focus callback */
  onFocus?: () => void;
}

export interface InlineCreateFormProps {
  /** Initial value (from search input) */
  initialValue: string;
  /** Submit handler */
  onSubmit: (data: unknown) => void | Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether form is submitting */
  isSubmitting: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function defaultFilterOption<T>(option: SelectOption<T>, searchValue: string): boolean {
  const search = searchValue.toLowerCase();
  return (
    option.label.toLowerCase().includes(search) ||
    (option.description?.toLowerCase().includes(search) ?? false)
  );
}

function groupOptions<T>(
  options: SelectOption<T>[],
  groupBy?: (option: SelectOption<T>) => string | undefined
): Map<string, SelectOption<T>[]> {
  const groups = new Map<string, SelectOption<T>[]>();
  
  if (!groupBy) {
    groups.set('', options);
    return groups;
  }

  for (const option of options) {
    const group = groupBy(option) || '';
    const existing = groups.get(group) || [];
    groups.set(group, [...existing, option]);
  }

  return groups;
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================

interface OptionItemProps<T> {
  option: SelectOption<T>;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => ReactNode;
}

function OptionItem<T>({
  option,
  isSelected,
  isHighlighted,
  onClick,
  renderOption,
}: OptionItemProps<T>) {
  if (renderOption) {
    return (
      <div
        onClick={option.disabled ? undefined : onClick}
        className={cn(
          'cursor-pointer',
          option.disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {renderOption(option, isSelected)}
      </div>
    );
  }

  return (
    <div
      onClick={option.disabled ? undefined : onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 cursor-pointer',
        'transition-colors',
        isHighlighted && 'bg-gray-100 dark:bg-gray-700',
        isSelected && 'bg-pink-50 dark:bg-pink-900/20',
        option.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {option.label}
        </div>
        {option.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {option.description}
          </div>
        )}
      </div>
      {isSelected && (
        <svg
          className="w-4 h-4 text-pink-500 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}

interface SelectedTagProps<T> {
  option: SelectOption<T>;
  onRemove: () => void;
  renderValue?: (option: SelectOption<T>) => ReactNode;
}

function SelectedTag<T>({ option, onRemove, renderValue }: SelectedTagProps<T>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-pink-100 dark:bg-pink-900/30',
        'text-pink-700 dark:text-pink-300 text-sm'
      )}
    >
      {renderValue ? renderValue(option) : option.label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SelectWithCreate<T = unknown>(props: SelectWithCreateProps<T>) {
  const {
    name,
    label,
    placeholder = 'Selecione...',
    value,
    onChange,
    options,
    multiple = false,
    maxSelections,
    required = false,
    disabled = false,
    isLoading = false,
    error,
    helperText,
    searchable = true,
    searchPlaceholder = 'Buscar...',
    creatable = false,
    createLabel = 'Criar novo',
    onCreate,
    showInlineCreate = false,
    inlineCreateForm,
    renderOption,
    renderValue,
    emptyMessage = 'Nenhuma opção disponível',
    noResultsMessage = 'Nenhum resultado encontrado',
    groupBy,
    clearable = true,
    filterOption = defaultFilterOption,
    onSearch,
    searchDelay = 300,
    onLoadMore,
    hasMore = false,
    className,
    containerClassName,
    dropdownClassName,
    autoFocus = false,
    onBlur,
    onFocus,
  } = props;

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchValue, searchDelay);

  // Handle async search
  useEffect(() => {
    if (onSearch && debouncedSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!searchValue || onSearch) return options;
    return options.filter((opt) => filterOption(opt, searchValue));
  }, [options, searchValue, filterOption, onSearch]);

  // Grouped options
  const groupedOptions = useMemo(
    () => groupOptions(filteredOptions, groupBy),
    [filteredOptions, groupBy]
  );

  // Flat list for keyboard navigation
  const flatOptions = useMemo(
    () => Array.from(groupedOptions.values()).flat(),
    [groupedOptions]
  );

  // Selected options
  const selectedOptions = useMemo(() => {
    if (value === null) return [];
    const ids = Array.isArray(value) ? value : [value];
    return options.filter((opt) => ids.includes(opt.id));
  }, [value, options]);

  // Can add more selections
  const canAddMore = !maxSelections || selectedOptions.length < maxSelections;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setSearchValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handlers
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      onFocus?.();
    }
  }, [disabled, isOpen, onFocus]);

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;

      if (multiple) {
        const currentIds = Array.isArray(value) ? value : value ? [value] : [];
        const isSelected = currentIds.includes(option.id);

        if (isSelected) {
          const newIds = currentIds.filter((id) => id !== option.id);
          const newOptions = selectedOptions.filter((opt) => opt.id !== option.id);
          onChange(newIds.length > 0 ? newIds : null, newOptions);
        } else if (canAddMore) {
          const newIds = [...currentIds, option.id];
          const newOptions = [...selectedOptions, option];
          onChange(newIds, newOptions);
        }
      } else {
        onChange(option.id, option);
        setIsOpen(false);
        setSearchValue('');
      }
    },
    [multiple, value, selectedOptions, canAddMore, onChange]
  );

  const handleRemove = useCallback(
    (option: SelectOption<T>) => {
      if (multiple) {
        const currentIds = Array.isArray(value) ? value : [];
        const newIds = currentIds.filter((id) => id !== option.id);
        const newOptions = selectedOptions.filter((opt) => opt.id !== option.id);
        onChange(newIds.length > 0 ? newIds : null, newOptions);
      } else {
        onChange(null, undefined);
      }
    },
    [multiple, value, selectedOptions, onChange]
  );

  const handleClear = useCallback(() => {
    onChange(null, undefined);
    setSearchValue('');
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!onCreate) return;

    if (showInlineCreate && inlineCreateForm) {
      setShowCreateForm(true);
    } else {
      setIsCreating(true);
      try {
        await onCreate(searchValue);
        setSearchValue('');
      } finally {
        setIsCreating(false);
      }
    }
  }, [onCreate, searchValue, showInlineCreate, inlineCreateForm]);

  const handleInlineCreateSubmit = useCallback(
    async (data: unknown) => {
      if (!onCreate) return;
      setIsCreating(true);
      try {
        await onCreate(data as string);
        setShowCreateForm(false);
        setSearchValue('');
      } finally {
        setIsCreating(false);
      }
    },
    [onCreate]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
            handleSelect(flatOptions[highlightedIndex]);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setShowCreateForm(false);
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < flatOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : flatOptions.length - 1
            );
          }
          break;

        case 'Backspace':
          if (searchValue === '' && selectedOptions.length > 0) {
            handleRemove(selectedOptions[selectedOptions.length - 1]);
          }
          break;
      }
    },
    [
      disabled,
      highlightedIndex,
      flatOptions,
      isOpen,
      searchValue,
      selectedOptions,
      handleSelect,
      handleRemove,
    ]
  );

  // Infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || !onLoadMore || isLoading) return;

      const target = e.target as HTMLDivElement;
      const nearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 50;

      if (nearBottom) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore, isLoading]
  );

  return (
    <div ref={containerRef} className={cn('relative', containerClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${name}-listbox`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={handleToggle}
        onBlur={() => {
          if (!isOpen) onBlur?.();
        }}
        className={cn(
          'relative w-full min-h-[40px]',
          'flex items-center flex-wrap gap-1',
          'px-3 py-1.5 rounded-lg border',
          'bg-white dark:bg-gray-900',
          'text-gray-900 dark:text-gray-100',
          'transition-colors cursor-pointer',
          !disabled && !error && 'border-gray-300 dark:border-gray-600',
          !disabled && !error && 'hover:border-gray-400 dark:hover:border-gray-500',
          !disabled && !error && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
          error && 'border-red-500 focus:ring-red-500/20',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
          className
        )}
      >
        {/* Selected Values */}
        {multiple ? (
          <>
            {selectedOptions.map((opt) => (
              <SelectedTag
                key={opt.id}
                option={opt}
                onRemove={() => handleRemove(opt)}
                renderValue={renderValue}
              />
            ))}
            {searchable && isOpen && (
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={selectedOptions.length === 0 ? placeholder : searchPlaceholder}
                className={cn(
                  'flex-1 min-w-[100px] bg-transparent outline-none',
                  'text-sm placeholder-gray-400 dark:placeholder-gray-500'
                )}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {!searchable || !isOpen ? (
              selectedOptions.length === 0 && (
                <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
              )
            ) : null}
          </>
        ) : (
          <>
            {selectedOptions[0] ? (
              <span className="flex-1 text-sm truncate">
                {renderValue
                  ? renderValue(selectedOptions[0])
                  : selectedOptions[0].label}
              </span>
            ) : (
              <span className="flex-1 text-sm text-gray-400 dark:text-gray-500">
                {placeholder}
              </span>
            )}
          </>
        )}

        {/* Icons */}
        <div className="flex items-center gap-1 ml-2">
          {isLoading && (
            <svg
              className="w-4 h-4 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {clearable && selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <svg
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Error/Helper Text */}
      {(error || helperText) && (
        <p
          className={cn(
            'mt-1 text-sm',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error || helperText}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-lg',
            'max-h-[300px] overflow-hidden',
            dropdownClassName
          )}
        >
          {/* Search Input (for single select) */}
          {searchable && !multiple && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'bg-gray-50 dark:bg-gray-900',
                  'border border-gray-200 dark:border-gray-600',
                  'text-sm placeholder-gray-400 dark:placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-pink-500/20'
                )}
              />
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            id={`${name}-listbox`}
            role="listbox"
            aria-multiselectable={multiple}
            className="overflow-y-auto max-h-[240px]"
            onScroll={handleScroll}
          >
            {showCreateForm && inlineCreateForm ? (
              <div className="p-4">
                {inlineCreateForm({
                  initialValue: searchValue,
                  onSubmit: handleInlineCreateSubmit,
                  onCancel: () => setShowCreateForm(false),
                  isSubmitting: isCreating,
                })}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                {searchValue ? noResultsMessage : emptyMessage}
              </div>
            ) : (
              Array.from(groupedOptions.entries()).map(([group, groupOptions]) => (
                <div key={group || 'default'}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option, index) => {
                    const flatIndex = flatOptions.indexOf(option);
                    const isSelected = selectedOptions.some((o) => o.id === option.id);

                    return (
                      <OptionItem
                        key={option.id}
                        option={option}
                        isSelected={isSelected}
                        isHighlighted={flatIndex === highlightedIndex}
                        onClick={() => handleSelect(option)}
                        renderOption={renderOption}
                      />
                    );
                  })}
                </div>
              ))
            )}

            {/* Loading More */}
            {isLoading && filteredOptions.length > 0 && (
              <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-sm">
                Carregando mais...
              </div>
            )}
          </div>

          {/* Create Option */}
          {creatable && onCreate && searchValue && !showCreateForm && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className={cn(
                  'w-full px-3 py-2 text-left',
                  'flex items-center gap-2',
                  'text-sm text-pink-600 dark:text-pink-400',
                  'hover:bg-pink-50 dark:hover:bg-pink-900/20',
                  'transition-colors'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>
                  {createLabel}: "{searchValue}"
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SelectWithCreate;
