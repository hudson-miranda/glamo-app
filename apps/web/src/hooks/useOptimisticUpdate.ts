/**
 * GLAMO - useOptimisticUpdate Hook
 * Optimistic UI updates for mutations
 * 
 * @version 1.0.0
 * @description Provides instant UI feedback while mutations complete
 */

'use client';

import { useState, useCallback, useRef, useTransition } from 'react';
import type { UUID } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type OptimisticAction = 'create' | 'update' | 'delete' | 'reorder';

export interface OptimisticState<T> {
  /** Current data with optimistic updates applied */
  data: T[];
  /** Pending optimistic operations */
  pending: OptimisticOperation<T>[];
  /** Failed operations that need resolution */
  failed: FailedOperation<T>[];
  /** Whether any optimistic updates are in progress */
  isPending: boolean;
}

export interface OptimisticOperation<T> {
  id: string;
  action: OptimisticAction;
  timestamp: number;
  item?: T;
  previousItem?: T;
  index?: number;
  previousIndex?: number;
}

export interface FailedOperation<T> extends OptimisticOperation<T> {
  error: Error;
  retryCount: number;
}

export interface OptimisticConfig<T> {
  /** Function to get unique ID from item */
  getItemId: (item: T) => UUID;
  /** Maximum retry attempts for failed operations */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Callback when operation fails permanently */
  onError?: (error: Error, operation: OptimisticOperation<T>) => void;
  /** Callback when operation succeeds */
  onSuccess?: (operation: OptimisticOperation<T>) => void;
}

export interface OptimisticHelpers<T> {
  /** Optimistically add an item */
  addOptimistic: (item: T, mutation: () => Promise<T>) => Promise<T>;
  /** Optimistically update an item */
  updateOptimistic: (
    id: UUID,
    updates: Partial<T>,
    mutation: () => Promise<T>
  ) => Promise<T>;
  /** Optimistically delete an item */
  deleteOptimistic: (id: UUID, mutation: () => Promise<void>) => Promise<void>;
  /** Optimistically reorder items */
  reorderOptimistic: (
    fromIndex: number,
    toIndex: number,
    mutation: () => Promise<void>
  ) => Promise<void>;
  /** Retry a failed operation */
  retry: (operationId: string) => Promise<void>;
  /** Dismiss a failed operation */
  dismissFailed: (operationId: string) => void;
  /** Reset to server state */
  reset: (serverData: T[]) => void;
  /** Sync with server data */
  sync: (serverData: T[]) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOptimisticUpdate<T>(
  initialData: T[],
  config: OptimisticConfig<T>
): [OptimisticState<T>, OptimisticHelpers<T>] {
  const {
    getItemId,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = config;

  // Core state
  const [data, setData] = useState<T[]>(initialData);
  const [pending, setPending] = useState<OptimisticOperation<T>[]>([]);
  const [failed, setFailed] = useState<FailedOperation<T>[]>([]);
  const [isPending, startTransition] = useTransition();

  // Refs for stable mutation tracking
  const pendingMutations = useRef<Map<string, AbortController>>(new Map());
  const serverDataRef = useRef<T[]>(initialData);

  // Update server data ref when initial data changes
  const sync = useCallback((serverData: T[]) => {
    serverDataRef.current = serverData;
    
    // Reapply pending operations on top of new server data
    startTransition(() => {
      let result = [...serverData];
      
      for (const op of pending) {
        switch (op.action) {
          case 'create':
            if (op.item) {
              result = [...result, op.item];
            }
            break;
          case 'update':
            if (op.item) {
              const id = getItemId(op.item);
              result = result.map(item => 
                getItemId(item) === id ? op.item! : item
              );
            }
            break;
          case 'delete':
            if (op.previousItem) {
              const id = getItemId(op.previousItem);
              result = result.filter(item => getItemId(item) !== id);
            }
            break;
          case 'reorder':
            if (op.index !== undefined && op.previousIndex !== undefined) {
              result = arrayMove(result, op.previousIndex, op.index);
            }
            break;
        }
      }
      
      setData(result);
    });
  }, [pending, getItemId]);

  // Reset to server state
  const reset = useCallback((serverData: T[]) => {
    // Cancel all pending mutations
    pendingMutations.current.forEach(controller => controller.abort());
    pendingMutations.current.clear();
    
    serverDataRef.current = serverData;
    setData(serverData);
    setPending([]);
    setFailed([]);
  }, []);

  // Complete an operation
  const completeOperation = useCallback((operationId: string) => {
    setPending(prev => prev.filter(op => op.id !== operationId));
    pendingMutations.current.delete(operationId);
  }, []);

  // Fail an operation
  const failOperation = useCallback((
    operation: OptimisticOperation<T>,
    error: Error
  ) => {
    // Remove from pending
    setPending(prev => prev.filter(op => op.id !== operation.id));
    pendingMutations.current.delete(operation.id);

    // Add to failed
    setFailed(prev => [
      ...prev,
      { ...operation, error, retryCount: 0 },
    ]);

    // Rollback the change
    startTransition(() => {
      setData(prev => {
        switch (operation.action) {
          case 'create':
            if (operation.item) {
              const id = getItemId(operation.item);
              return prev.filter(item => getItemId(item) !== id);
            }
            break;
          case 'update':
            if (operation.previousItem) {
              const id = getItemId(operation.previousItem);
              return prev.map(item =>
                getItemId(item) === id ? operation.previousItem! : item
              );
            }
            break;
          case 'delete':
            if (operation.previousItem && operation.index !== undefined) {
              const result = [...prev];
              result.splice(operation.index, 0, operation.previousItem);
              return result;
            }
            break;
          case 'reorder':
            if (operation.previousIndex !== undefined && operation.index !== undefined) {
              return arrayMove(prev, operation.index, operation.previousIndex);
            }
            break;
        }
        return prev;
      });
    });

    onError?.(error, operation);
  }, [getItemId, onError]);

  // Add optimistic item
  const addOptimistic = useCallback(async (
    item: T,
    mutation: () => Promise<T>
  ): Promise<T> => {
    const operationId = generateOperationId();
    const operation: OptimisticOperation<T> = {
      id: operationId,
      action: 'create',
      timestamp: Date.now(),
      item,
    };

    // Optimistically add the item
    startTransition(() => {
      setData(prev => [...prev, item]);
      setPending(prev => [...prev, operation]);
    });

    const controller = new AbortController();
    pendingMutations.current.set(operationId, controller);

    try {
      const result = await mutation();
      
      // Replace optimistic item with server response
      startTransition(() => {
        setData(prev => prev.map(i =>
          getItemId(i) === getItemId(item) ? result : i
        ));
      });
      
      completeOperation(operationId);
      onSuccess?.(operation);
      
      return result;
    } catch (error) {
      failOperation(operation, error as Error);
      throw error;
    }
  }, [getItemId, completeOperation, failOperation, onSuccess]);

  // Update optimistic item
  const updateOptimistic = useCallback(async (
    id: UUID,
    updates: Partial<T>,
    mutation: () => Promise<T>
  ): Promise<T> => {
    const operationId = generateOperationId();
    
    // Find current item
    const previousItem = data.find(item => getItemId(item) === id);
    if (!previousItem) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updatedItem = { ...previousItem, ...updates } as T;
    
    const operation: OptimisticOperation<T> = {
      id: operationId,
      action: 'update',
      timestamp: Date.now(),
      item: updatedItem,
      previousItem,
    };

    // Optimistically update the item
    startTransition(() => {
      setData(prev => prev.map(item =>
        getItemId(item) === id ? updatedItem : item
      ));
      setPending(prev => [...prev, operation]);
    });

    const controller = new AbortController();
    pendingMutations.current.set(operationId, controller);

    try {
      const result = await mutation();
      
      // Replace with server response
      startTransition(() => {
        setData(prev => prev.map(item =>
          getItemId(item) === id ? result : item
        ));
      });
      
      completeOperation(operationId);
      onSuccess?.(operation);
      
      return result;
    } catch (error) {
      failOperation(operation, error as Error);
      throw error;
    }
  }, [data, getItemId, completeOperation, failOperation, onSuccess]);

  // Delete optimistic item
  const deleteOptimistic = useCallback(async (
    id: UUID,
    mutation: () => Promise<void>
  ): Promise<void> => {
    const operationId = generateOperationId();
    
    // Find current item and its index
    const index = data.findIndex(item => getItemId(item) === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    const previousItem = data[index];
    
    const operation: OptimisticOperation<T> = {
      id: operationId,
      action: 'delete',
      timestamp: Date.now(),
      previousItem,
      index,
    };

    // Optimistically remove the item
    startTransition(() => {
      setData(prev => prev.filter(item => getItemId(item) !== id));
      setPending(prev => [...prev, operation]);
    });

    const controller = new AbortController();
    pendingMutations.current.set(operationId, controller);

    try {
      await mutation();
      completeOperation(operationId);
      onSuccess?.(operation);
    } catch (error) {
      failOperation(operation, error as Error);
      throw error;
    }
  }, [data, getItemId, completeOperation, failOperation, onSuccess]);

  // Reorder optimistic
  const reorderOptimistic = useCallback(async (
    fromIndex: number,
    toIndex: number,
    mutation: () => Promise<void>
  ): Promise<void> => {
    if (fromIndex === toIndex) return;
    
    const operationId = generateOperationId();
    
    const operation: OptimisticOperation<T> = {
      id: operationId,
      action: 'reorder',
      timestamp: Date.now(),
      previousIndex: fromIndex,
      index: toIndex,
    };

    // Optimistically reorder
    startTransition(() => {
      setData(prev => arrayMove(prev, fromIndex, toIndex));
      setPending(prev => [...prev, operation]);
    });

    const controller = new AbortController();
    pendingMutations.current.set(operationId, controller);

    try {
      await mutation();
      completeOperation(operationId);
      onSuccess?.(operation);
    } catch (error) {
      failOperation(operation, error as Error);
      throw error;
    }
  }, [completeOperation, failOperation, onSuccess]);

  // Retry failed operation
  const retry = useCallback(async (operationId: string): Promise<void> => {
    const failedOp = failed.find(op => op.id === operationId);
    if (!failedOp) return;

    if (failedOp.retryCount >= maxRetries) {
      console.warn(`Maximum retries (${maxRetries}) exceeded for operation ${operationId}`);
      return;
    }

    // Remove from failed
    setFailed(prev => prev.filter(op => op.id !== operationId));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Reapply optimistic update and retry mutation
    // Note: The mutation needs to be stored or reconstructed
    // This is a simplified version - in production, store the mutation closure
    console.warn('Retry functionality requires mutation storage implementation');
  }, [failed, maxRetries, retryDelay]);

  // Dismiss failed operation
  const dismissFailed = useCallback((operationId: string) => {
    setFailed(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const state: OptimisticState<T> = {
    data,
    pending,
    failed,
    isPending: isPending || pending.length > 0,
  };

  const helpers: OptimisticHelpers<T> = {
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    reorderOptimistic,
    retry,
    dismissFailed,
    reset,
    sync,
  };

  return [state, helpers];
}

// ============================================================================
// SIMPLE OPTIMISTIC UPDATE
// ============================================================================

/**
 * Simple optimistic update for single mutations
 */
export function useSimpleOptimisticUpdate<T, R = T>(
  currentValue: T,
  options?: {
    onOptimistic?: (optimisticValue: T) => void;
    onSuccess?: (result: R) => void;
    onError?: (error: Error, previousValue: T) => void;
    onSettled?: (result: R | undefined, error: Error | undefined) => void;
  }
): {
  value: T;
  isPending: boolean;
  error: Error | null;
  mutate: (optimisticValue: T, mutation: () => Promise<R>) => Promise<R>;
} {
  const [value, setValue] = useState<T>(currentValue);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousValue = useRef<T>(currentValue);

  // Sync with current value
  if (!isPending && currentValue !== value) {
    setValue(currentValue);
  }

  const mutate = useCallback(async (
    optimisticValue: T,
    mutation: () => Promise<R>
  ): Promise<R> => {
    setIsPending(true);
    setError(null);
    previousValue.current = value;

    // Apply optimistic update
    setValue(optimisticValue);
    options?.onOptimistic?.(optimisticValue);

    try {
      const result = await mutation();
      options?.onSuccess?.(result);
      options?.onSettled?.(result, undefined);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setValue(previousValue.current);
      options?.onError?.(error, previousValue.current);
      options?.onSettled?.(undefined, error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [value, options]);

  return {
    value,
    isPending,
    error,
    mutate,
  };
}

export default useOptimisticUpdate;
