/**
 * GLAMO - useDebounce Hook
 * Debounce values and callbacks
 * 
 * @version 1.0.0
 * @description Performance optimization for frequent updates
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// USE DEBOUNCED VALUE
// ============================================================================

/**
 * Returns a debounced version of the value
 * The debounced value will only change after the specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// USE DEBOUNCED CALLBACK
// ============================================================================

/**
 * Returns a debounced version of the callback
 * The callback will only be invoked after the delay has passed
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300
): {
  debouncedFn: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  isPending: boolean;
} {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout>();
  const pendingArgsRef = useRef<Parameters<T>>();
  const [isPending, setIsPending] = useState(false);

  // Update callback ref on change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      pendingArgsRef.current = undefined;
      setIsPending(false);
    }
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current && pendingArgsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      const args = pendingArgsRef.current;
      pendingArgsRef.current = undefined;
      setIsPending(false);
      callbackRef.current(...args);
    }
  }, []);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    pendingArgsRef.current = args;
    setIsPending(true);

    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      pendingArgsRef.current = undefined;
      setIsPending(false);
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  return {
    debouncedFn,
    cancel,
    flush,
    isPending,
  };
}

// ============================================================================
// USE DEBOUNCED STATE
// ============================================================================

/**
 * State with debounced updates
 * Provides both immediate and debounced values
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
  setValueImmediate: (value: T) => void;
  isPending: boolean;
} {
  const [value, setValueInternal] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const setValue = useCallback((newValue: T) => {
    setValueInternal(newValue);
    setIsPending(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
      setIsPending(false);
    }, delay);
  }, [delay]);

  const setValueImmediate = useCallback((newValue: T) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setValueInternal(newValue);
    setDebouncedValue(newValue);
    setIsPending(false);
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    setValueImmediate,
    isPending,
  };
}

// ============================================================================
// USE THROTTLE
// ============================================================================

/**
 * Throttles a value - only updates at most once per delay period
 */
export function useThrottle<T>(value: T, delay: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= delay) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay - timeSinceLastExecution);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

// ============================================================================
// USE THROTTLED CALLBACK
// ============================================================================

/**
 * Returns a throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastExecuted = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= delay) {
      lastExecuted.current = now;
      callbackRef.current(...args);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        lastExecuted.current = Date.now();
        callbackRef.current(...args);
      }, delay - timeSinceLastExecution);
    }
  }, [delay]);
}

// ============================================================================
// USE SEARCH DEBOUNCE
// ============================================================================

/**
 * Specialized debounce for search inputs
 * Includes loading state and clear functionality
 */
export function useSearchDebounce(
  delay: number = 300
): {
  search: string;
  debouncedSearch: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
} {
  const { value, debouncedValue, setValue, setValueImmediate, isPending } = 
    useDebouncedState('', delay);

  const clearSearch = useCallback(() => {
    setValueImmediate('');
  }, [setValueImmediate]);

  return {
    search: value,
    debouncedSearch: debouncedValue,
    setSearch: setValue,
    clearSearch,
    isSearching: isPending,
  };
}

export default useDebounce;
