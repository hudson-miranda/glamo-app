/**
 * GLAMO - usePrevious Hook
 * Track previous values
 * 
 * @version 1.0.0
 * @description Utilities for tracking previous state and detecting changes
 */

'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// USE PREVIOUS
// ============================================================================

/**
 * Returns the previous value of a variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Returns the previous value with initial value support
 */
export function usePreviousWithInitial<T>(value: T, initialValue: T): T {
  const ref = useRef<T>(initialValue);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// ============================================================================
// USE PREVIOUS DISTINCT
// ============================================================================

/**
 * Returns the previous value only when it actually changed
 * (ignores reference changes for equal values)
 */
export function usePreviousDistinct<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = Object.is
): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prevRef = useRef<T | undefined>(undefined);
  
  if (!compare(ref.current, value)) {
    prevRef.current = ref.current;
    ref.current = value;
  }
  
  return prevRef.current;
}

// ============================================================================
// USE HAS CHANGED
// ============================================================================

/**
 * Returns whether the value has changed since last render
 */
export function useHasChanged<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = Object.is
): boolean {
  const prev = usePrevious(value);
  return !compare(prev, value);
}

/**
 * Returns whether any of the values have changed
 */
export function useHaveAnyChanged<T extends unknown[]>(
  values: T
): boolean {
  const prev = usePrevious(values);
  
  if (!prev) return true;
  if (prev.length !== values.length) return true;
  
  return values.some((value, index) => !Object.is(value, prev[index]));
}

// ============================================================================
// USE VALUE HISTORY
// ============================================================================

interface ValueHistoryOptions {
  /** Maximum history length */
  maxLength?: number;
  /** Whether to include the current value */
  includeCurrent?: boolean;
}

export interface ValueHistory<T> {
  /** History of values (oldest first) */
  history: T[];
  /** Clear the history */
  clear: () => void;
  /** Get value at specific index from end (0 = most recent) */
  get: (indexFromEnd: number) => T | undefined;
  /** Check if value exists in history */
  includes: (value: T) => boolean;
  /** Number of items in history */
  length: number;
}

/**
 * Tracks a history of values
 */
export function useValueHistory<T>(
  value: T,
  options: ValueHistoryOptions = {}
): ValueHistory<T> {
  const { maxLength = 10, includeCurrent = true } = options;
  
  const historyRef = useRef<T[]>([]);
  const prevValue = usePrevious(value);
  
  // Add to history when value changes
  if (prevValue !== undefined && !Object.is(prevValue, value)) {
    historyRef.current = [
      ...historyRef.current.slice(-(maxLength - 1)),
      prevValue,
    ];
  }
  
  const history = useMemo(() => {
    if (includeCurrent) {
      return [...historyRef.current, value];
    }
    return historyRef.current;
  }, [value, includeCurrent]);
  
  const clear = useCallback(() => {
    historyRef.current = [];
  }, []);
  
  const get = useCallback((indexFromEnd: number): T | undefined => {
    const actualHistory = includeCurrent 
      ? [...historyRef.current, value]
      : historyRef.current;
    return actualHistory[actualHistory.length - 1 - indexFromEnd];
  }, [value, includeCurrent]);
  
  const includes = useCallback((searchValue: T): boolean => {
    return historyRef.current.some(v => Object.is(v, searchValue)) ||
      (includeCurrent && Object.is(value, searchValue));
  }, [value, includeCurrent]);
  
  return {
    history,
    clear,
    get,
    includes,
    length: history.length,
  };
}

// ============================================================================
// USE FIRST RENDER
// ============================================================================

/**
 * Returns true only on the first render
 */
export function useIsFirstRender(): boolean {
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    isFirstRender.current = false;
  }, []);
  
  return isFirstRender.current;
}

/**
 * Returns true after the first render
 */
export function useHasMounted(): boolean {
  const hasMounted = useRef(false);
  
  useEffect(() => {
    hasMounted.current = true;
  }, []);
  
  return hasMounted.current;
}

// ============================================================================
// USE RENDER COUNT
// ============================================================================

/**
 * Returns the number of times the component has rendered
 */
export function useRenderCount(): number {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// ============================================================================
// USE EFFECT SKIP FIRST
// ============================================================================

/**
 * useEffect that skips the first render
 */
export function useEffectSkipFirst(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isFirst = useRef(true);
  
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================================
// USE UPDATE EFFECT
// ============================================================================

/**
 * useEffect that only runs on updates, not initial mount
 */
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isMounted = useRef(false);
  
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================================
// USE CHANGED DEPS
// ============================================================================

/**
 * Debug hook to identify which dependencies changed
 */
export function useChangedDeps(
  deps: Record<string, unknown>,
  name: string = 'Component'
): void {
  const prev = useRef<Record<string, unknown>>({});
  
  useEffect(() => {
    const changedDeps: Record<string, { from: unknown; to: unknown }> = {};
    let hasChanges = false;
    
    for (const key of Object.keys(deps)) {
      if (!Object.is(prev.current[key], deps[key])) {
        hasChanges = true;
        changedDeps[key] = {
          from: prev.current[key],
          to: deps[key],
        };
      }
    }
    
    if (hasChanges) {
      console.group(`[${name}] Dependency changes`);
      for (const [key, { from, to }] of Object.entries(changedDeps)) {
        console.log(`  ${key}:`, from, '→', to);
      }
      console.groupEnd();
    }
    
    prev.current = { ...deps };
  });
}

// ============================================================================
// USE STABLE VALUE
// ============================================================================

/**
 * Returns a stable reference to a value
 * Only updates when the value actually changes (deep comparison)
 */
export function useStableValue<T>(
  value: T,
  compare?: (a: T, b: T) => boolean
): T {
  const ref = useRef<T>(value);
  
  const isEqual = compare 
    ? compare(ref.current, value)
    : JSON.stringify(ref.current) === JSON.stringify(value);
  
  if (!isEqual) {
    ref.current = value;
  }
  
  return ref.current;
}

// ============================================================================
// USE DIFF
// ============================================================================

export interface ValueDiff<T> {
  previous: T | undefined;
  current: T;
  changed: boolean;
  changedKeys?: string[];
}

/**
 * Returns detailed diff information between renders
 */
export function useDiff<T extends Record<string, unknown>>(
  value: T
): ValueDiff<T> {
  const prev = usePrevious(value);
  
  const changedKeys = useMemo(() => {
    if (!prev) return undefined;
    
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(value)]);
    const changed: string[] = [];
    
    for (const key of allKeys) {
      if (!Object.is((prev as Record<string, unknown>)[key], value[key])) {
        changed.push(key);
      }
    }
    
    return changed.length > 0 ? changed : undefined;
  }, [prev, value]);
  
  return {
    previous: prev,
    current: value,
    changed: changedKeys !== undefined && changedKeys.length > 0,
    changedKeys,
  };
}

// ============================================================================
// USE COMPARE
// ============================================================================

export type CompareResult = 'initial' | 'same' | 'changed';

/**
 * Returns comparison result between current and previous value
 */
export function useCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = Object.is
): CompareResult {
  const prev = usePrevious(value);
  
  if (prev === undefined) {
    return 'initial';
  }
  
  return compare(prev, value) ? 'same' : 'changed';
}

export default usePrevious;
