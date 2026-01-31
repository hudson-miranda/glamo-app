/**
 * GLAMO - useLocalStorage Hook
 * Persistent state with localStorage
 * 
 * @version 1.0.0
 * @description Type-safe localStorage with SSR support and sync across tabs
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseLocalStorageOptions<T> {
  /** Custom serializer */
  serializer?: (value: T) => string;
  /** Custom deserializer */
  deserializer?: (value: string) => T;
  /** Sync across browser tabs */
  syncTabs?: boolean;
  /** Listen for storage events */
  listenToStorageChanges?: boolean;
  /** Callback when value changes */
  onValueChange?: (newValue: T, oldValue: T | undefined) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseLocalStorageReturn<T> {
  /** Current value */
  value: T;
  /** Set new value */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Remove from storage */
  remove: () => void;
  /** Check if key exists in storage */
  exists: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Refresh value from storage */
  refresh: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function defaultSerializer<T>(value: T): string {
  return JSON.stringify(value);
}

function defaultDeserializer<T>(value: string): T {
  return JSON.parse(value) as T;
}

function isServerSide(): boolean {
  return typeof window === 'undefined';
}

function getStorageValue<T>(
  key: string,
  defaultValue: T,
  deserializer: (value: string) => T
): T {
  if (isServerSide()) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return deserializer(item);
  } catch {
    return defaultValue;
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    syncTabs = true,
    listenToStorageChanges = true,
    onValueChange,
    onError,
  } = options;

  // Initialize state with lazy initializer
  const [storedValue, setStoredValue] = useState<T>(() =>
    getStorageValue(key, defaultValue, deserializer)
  );
  const [error, setError] = useState<Error | null>(null);
  const [exists, setExists] = useState<boolean>(() => {
    if (isServerSide()) return false;
    return window.localStorage.getItem(key) !== null;
  });

  // Refs for stable callbacks
  const prevValueRef = useRef<T | undefined>(undefined);
  const keyRef = useRef(key);

  // Update ref when key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Handle storage events (from other tabs)
  useEffect(() => {
    if (isServerSide() || !syncTabs || !listenToStorageChanges) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== keyRef.current) return;

      try {
        if (e.newValue === null) {
          // Item was removed
          setStoredValue(defaultValue);
          setExists(false);
        } else {
          const newValue = deserializer(e.newValue);
          setStoredValue(newValue);
          setExists(true);
          onValueChange?.(newValue, prevValueRef.current);
        }
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [defaultValue, deserializer, listenToStorageChanges, onError, onValueChange, syncTabs]);

  // Set value function
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    if (isServerSide()) {
      console.warn('useLocalStorage: Cannot set value during SSR');
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Notify about change
      onValueChange?.(valueToStore, prevValueRef.current);
      prevValueRef.current = storedValue;

      // Save to storage
      const serialized = serializer(valueToStore);
      window.localStorage.setItem(key, serialized);
      
      // Update state
      setStoredValue(valueToStore);
      setExists(true);
      setError(null);

      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serialized,
        storageArea: window.localStorage,
      }));
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [key, serializer, storedValue, onValueChange, onError]);

  // Remove from storage
  const remove = useCallback(() => {
    if (isServerSide()) {
      console.warn('useLocalStorage: Cannot remove value during SSR');
      return;
    }

    try {
      prevValueRef.current = storedValue;
      window.localStorage.removeItem(key);
      
      setStoredValue(defaultValue);
      setExists(false);
      setError(null);
      
      onValueChange?.(defaultValue, prevValueRef.current);

      // Dispatch event
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        storageArea: window.localStorage,
      }));
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [key, defaultValue, storedValue, onValueChange, onError]);

  // Refresh from storage
  const refresh = useCallback(() => {
    if (isServerSide()) return;

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        setStoredValue(defaultValue);
        setExists(false);
      } else {
        const value = deserializer(item);
        setStoredValue(value);
        setExists(true);
      }
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [key, defaultValue, deserializer, onError]);

  // Re-read storage when key changes
  useEffect(() => {
    refresh();
  }, [key, refresh]);

  return {
    value: storedValue,
    setValue,
    remove,
    exists,
    error,
    refresh,
  };
}

// ============================================================================
// TYPED STORAGE HOOKS
// ============================================================================

/**
 * Boolean localStorage
 */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean = false
): UseLocalStorageReturn<boolean> {
  return useLocalStorage(key, defaultValue);
}

/**
 * Number localStorage
 */
export function useLocalStorageNumber(
  key: string,
  defaultValue: number = 0
): UseLocalStorageReturn<number> {
  return useLocalStorage(key, defaultValue);
}

/**
 * String localStorage
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string = ''
): UseLocalStorageReturn<string> {
  return useLocalStorage(key, defaultValue);
}

/**
 * Array localStorage with type safety
 */
export function useLocalStorageArray<T>(
  key: string,
  defaultValue: T[] = []
): UseLocalStorageReturn<T[]> & {
  push: (item: T) => void;
  removeAt: (index: number) => void;
  clear: () => void;
  includes: (item: T) => boolean;
  toggle: (item: T, compare?: (a: T, b: T) => boolean) => void;
} {
  const storage = useLocalStorage<T[]>(key, defaultValue);

  const push = useCallback((item: T) => {
    storage.setValue(prev => [...prev, item]);
  }, [storage]);

  const removeAt = useCallback((index: number) => {
    storage.setValue(prev => prev.filter((_, i) => i !== index));
  }, [storage]);

  const clear = useCallback(() => {
    storage.setValue([]);
  }, [storage]);

  const includes = useCallback((item: T): boolean => {
    return storage.value.includes(item);
  }, [storage.value]);

  const toggle = useCallback((item: T, compare?: (a: T, b: T) => boolean) => {
    storage.setValue(prev => {
      const compareFn = compare || ((a: T, b: T) => a === b);
      const exists = prev.some(i => compareFn(i, item));
      if (exists) {
        return prev.filter(i => !compareFn(i, item));
      }
      return [...prev, item];
    });
  }, [storage]);

  return {
    ...storage,
    push,
    removeAt,
    clear,
    includes,
    toggle,
  };
}

/**
 * Object localStorage with merge support
 */
export function useLocalStorageObject<T extends Record<string, unknown>>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> & {
  merge: (partial: Partial<T>) => void;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  removeField: <K extends keyof T>(field: K) => void;
} {
  const storage = useLocalStorage<T>(key, defaultValue);

  const merge = useCallback((partial: Partial<T>) => {
    storage.setValue(prev => ({ ...prev, ...partial }));
  }, [storage]);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    storage.setValue(prev => ({ ...prev, [field]: value }));
  }, [storage]);

  const removeField = useCallback(<K extends keyof T>(field: K) => {
    storage.setValue(prev => {
      const { [field]: _, ...rest } = prev;
      return rest as T;
    });
  }, [storage]);

  return {
    ...storage,
    merge,
    setField,
    removeField,
  };
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Clear all localStorage (with optional prefix filter)
 */
export function clearLocalStorage(prefix?: string): void {
  if (isServerSide()) return;

  if (prefix) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } else {
    window.localStorage.clear();
  }
}

/**
 * Get all keys in localStorage (with optional prefix filter)
 */
export function getLocalStorageKeys(prefix?: string): string[] {
  if (isServerSide()) return [];

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key) {
      if (!prefix || key.startsWith(prefix)) {
        keys.push(key);
      }
    }
  }
  return keys;
}

/**
 * Get localStorage size in bytes
 */
export function getLocalStorageSize(): number {
  if (isServerSide()) return 0;

  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key) {
      const value = window.localStorage.getItem(key) || '';
      total += (key.length + value.length) * 2; // UTF-16 = 2 bytes per char
    }
  }
  return total;
}

/**
 * Check available localStorage space
 */
export function getAvailableLocalStorageSpace(): number {
  if (isServerSide()) return 0;

  const maxSize = 5 * 1024 * 1024; // 5MB is typical limit
  return maxSize - getLocalStorageSize();
}

// ============================================================================
// GLAMO-SPECIFIC STORAGE KEYS
// ============================================================================

export const GLAMO_STORAGE_KEYS = {
  // User preferences
  THEME: 'glamo:theme',
  SIDEBAR_COLLAPSED: 'glamo:sidebar:collapsed',
  TABLE_DENSITY: 'glamo:table:density',
  LOCALE: 'glamo:locale',
  
  // Filters/views
  CUSTOMER_FILTERS: 'glamo:customers:filters',
  SERVICE_FILTERS: 'glamo:services:filters',
  PROFESSIONAL_FILTERS: 'glamo:professionals:filters',
  PRODUCT_FILTERS: 'glamo:products:filters',
  APPOINTMENT_FILTERS: 'glamo:appointments:filters',
  
  // Table states
  CUSTOMER_TABLE_STATE: 'glamo:customers:table',
  SERVICE_TABLE_STATE: 'glamo:services:table',
  PROFESSIONAL_TABLE_STATE: 'glamo:professionals:table',
  PRODUCT_TABLE_STATE: 'glamo:products:table',
  
  // Recent items
  RECENT_CUSTOMERS: 'glamo:recent:customers',
  RECENT_SERVICES: 'glamo:recent:services',
  RECENT_SEARCHES: 'glamo:recent:searches',
  
  // Draft forms
  CUSTOMER_FORM_DRAFT: 'glamo:draft:customer',
  SERVICE_FORM_DRAFT: 'glamo:draft:service',
  PROFESSIONAL_FORM_DRAFT: 'glamo:draft:professional',
  PRODUCT_FORM_DRAFT: 'glamo:draft:product',
} as const;

export type GlamoStorageKey = typeof GLAMO_STORAGE_KEYS[keyof typeof GLAMO_STORAGE_KEYS];

export default useLocalStorage;
