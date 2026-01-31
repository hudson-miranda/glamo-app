/**
 * GLAMO - useToast Hook
 * Toast notifications with queue management
 * 
 * @version 1.0.0
 * @description Provides toast notifications with auto-dismiss and stacking
 */

'use client';

import { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface Toast {
  /** Unique ID for the toast */
  id: string;
  /** Toast type for styling */
  type: ToastType;
  /** Toast title */
  title: string;
  /** Optional description/message */
  description?: string | ReactNode;
  /** Custom icon */
  icon?: ReactNode;
  /** Duration in ms (0 = persistent) */
  duration?: number;
  /** Whether the toast is dismissable */
  dismissable?: boolean;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Cancel button */
  cancel?: {
    label: string;
    onClick: () => void;
  };
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Callback when toast auto-closes */
  onAutoClose?: () => void;
  /** Custom CSS class */
  className?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Whether toast is being removed (for animations) */
  isRemoving?: boolean;
  /** Progress (for loading toasts) */
  progress?: number;
}

export type ToastInput = Omit<Toast, 'id' | 'createdAt' | 'isRemoving'>;

export interface ToastConfig {
  /** Default position for toasts */
  position?: ToastPosition;
  /** Default duration in ms */
  duration?: number;
  /** Maximum number of visible toasts */
  maxToasts?: number;
  /** Gap between toasts */
  gap?: number;
  /** Offset from edges */
  offset?: number;
  /** Whether to expand on hover */
  expandOnHover?: boolean;
  /** Whether to pause on hover */
  pauseOnHover?: boolean;
  /** Rich colors mode */
  richColors?: boolean;
}

export interface ToasterState {
  toasts: Toast[];
  position: ToastPosition;
}

export interface ToastActions {
  /** Show a success toast */
  success: (title: string, options?: Partial<ToastInput>) => string;
  /** Show an error toast */
  error: (title: string, options?: Partial<ToastInput>) => string;
  /** Show a warning toast */
  warning: (title: string, options?: Partial<ToastInput>) => string;
  /** Show an info toast */
  info: (title: string, options?: Partial<ToastInput>) => string;
  /** Show a loading toast */
  loading: (title: string, options?: Partial<ToastInput>) => string;
  /** Show a custom toast */
  custom: (toast: ToastInput) => string;
  /** Update an existing toast */
  update: (id: string, toast: Partial<ToastInput>) => void;
  /** Dismiss a toast */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
  /** Promise-based toast (loading -> success/error) */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => Promise<T>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0, // Persistent until dismissed
};

const DEFAULT_CONFIG: ToastConfig = {
  position: 'bottom-right',
  duration: 4000,
  maxToasts: 5,
  gap: 12,
  offset: 16,
  expandOnHover: true,
  pauseOnHover: true,
  richColors: false,
};

// ============================================================================
// TOAST CONTEXT
// ============================================================================

interface ToastContextValue extends ToasterState, ToastActions {
  config: ToastConfig;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue | null {
  return useContext(ToastContext);
}

// ============================================================================
// TOAST PROVIDER
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
  config?: Partial<ToastConfig>;
}

export function ToastProvider({ children, config: userConfig }: ToastProviderProps): JSX.Element {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const { toasts, ...actions } = useToastState(config);

  const value: ToastContextValue = {
    toasts,
    position: config.position!,
    config,
    ...actions,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// ============================================================================
// USE TOAST STATE (Internal)
// ============================================================================

function useToastState(config: ToastConfig): ToasterState & ToastActions {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pausedRef = useRef<Set<string>>(new Set());

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  // Clear timer for a toast
  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // Set auto-dismiss timer
  const setTimer = useCallback((id: string, duration: number, onAutoClose?: () => void) => {
    if (duration <= 0) return;
    if (pausedRef.current.has(id)) return;

    clearTimer(id);
    
    const timer = setTimeout(() => {
      setToasts(prev => 
        prev.map(t => t.id === id ? { ...t, isRemoving: true } : t)
      );

      // Remove after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        onAutoClose?.();
      }, 200);

      timersRef.current.delete(id);
    }, duration);

    timersRef.current.set(id, timer);
  }, [clearTimer]);

  // Add a toast
  const addToast = useCallback((input: ToastInput): string => {
    const id = generateId();
    const duration = input.duration ?? DEFAULT_DURATIONS[input.type] ?? config.duration!;
    
    const toast: Toast = {
      ...input,
      id,
      createdAt: Date.now(),
      duration,
      dismissable: input.dismissable ?? true,
    };

    setToasts(prev => {
      const newToasts = [...prev, toast];
      // Limit number of toasts
      if (newToasts.length > config.maxToasts!) {
        const removed = newToasts.shift();
        if (removed) {
          clearTimer(removed.id);
          removed.onDismiss?.();
        }
      }
      return newToasts;
    });

    // Set auto-dismiss timer
    if (duration > 0) {
      setTimer(id, duration, input.onAutoClose);
    }

    return id;
  }, [config.duration, config.maxToasts, generateId, setTimer, clearTimer]);

  // Create typed toast functions
  const success = useCallback((title: string, options?: Partial<ToastInput>): string => {
    return addToast({ type: 'success', title, ...options });
  }, [addToast]);

  const error = useCallback((title: string, options?: Partial<ToastInput>): string => {
    return addToast({ type: 'error', title, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, options?: Partial<ToastInput>): string => {
    return addToast({ type: 'warning', title, ...options });
  }, [addToast]);

  const info = useCallback((title: string, options?: Partial<ToastInput>): string => {
    return addToast({ type: 'info', title, ...options });
  }, [addToast]);

  const loading = useCallback((title: string, options?: Partial<ToastInput>): string => {
    return addToast({ type: 'loading', title, duration: 0, dismissable: false, ...options });
  }, [addToast]);

  const custom = useCallback((toast: ToastInput): string => {
    return addToast(toast);
  }, [addToast]);

  // Update existing toast
  const update = useCallback((id: string, updates: Partial<ToastInput>) => {
    setToasts(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updated = { ...t, ...updates };
      
      // If duration changed, reset timer
      if (updates.duration !== undefined && updates.duration > 0) {
        setTimer(id, updates.duration, updates.onAutoClose);
      }
      
      return updated;
    }));
  }, [setTimer]);

  // Dismiss a toast
  const dismiss = useCallback((id: string) => {
    clearTimer(id);
    
    setToasts(prev => 
      prev.map(t => t.id === id ? { ...t, isRemoving: true } : t)
    );

    // Remove after animation
    setTimeout(() => {
      setToasts(prev => {
        const toast = prev.find(t => t.id === id);
        toast?.onDismiss?.();
        return prev.filter(t => t.id !== id);
      });
    }, 200);
  }, [clearTimer]);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    timersRef.current.forEach((_, id) => clearTimer(id));
    setToasts([]);
  }, [clearTimer]);

  // Promise-based toast
  const promise = useCallback(async <T,>(
    promiseValue: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ): Promise<T> => {
    const id = loading(options.loading);

    try {
      const result = await promiseValue;
      const successMessage = typeof options.success === 'function'
        ? options.success(result)
        : options.success;
      
      update(id, { 
        type: 'success', 
        title: successMessage,
        duration: DEFAULT_DURATIONS.success,
        dismissable: true,
      });
      
      setTimer(id, DEFAULT_DURATIONS.success);
      
      return result;
    } catch (err) {
      const errorMessage = typeof options.error === 'function'
        ? options.error(err)
        : options.error;
      
      update(id, { 
        type: 'error', 
        title: errorMessage,
        duration: DEFAULT_DURATIONS.error,
        dismissable: true,
      });
      
      setTimer(id, DEFAULT_DURATIONS.error);
      
      throw err;
    }
  }, [loading, update, setTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return {
    toasts,
    position: config.position!,
    success,
    error,
    warning,
    info,
    loading,
    custom,
    update,
    dismiss,
    dismissAll,
    promise,
  };
}

// ============================================================================
// USE TOAST HOOK
// ============================================================================

export function useToast(): ToastActions {
  const context = useToastContext();
  
  if (!context) {
    // Return no-op functions if used outside provider
    // This prevents errors but logs warning
    console.warn('useToast must be used within a ToastProvider');
    
    return {
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
      loading: () => '',
      custom: () => '',
      update: () => {},
      dismiss: () => {},
      dismissAll: () => {},
      promise: async (p) => p,
    };
  }

  return {
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,
    loading: context.loading,
    custom: context.custom,
    update: context.update,
    dismiss: context.dismiss,
    dismissAll: context.dismissAll,
    promise: context.promise,
  };
}

// ============================================================================
// TOAST STYLING HELPERS
// ============================================================================

export const TOAST_TYPE_STYLES: Record<ToastType, {
  icon: string;
  bg: string;
  border: string;
  title: string;
}> = {
  success: {
    icon: 'text-green-500',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-green-200 dark:border-green-800',
    title: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: 'text-red-500',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-red-200 dark:border-red-800',
    title: 'text-red-800 dark:text-red-200',
  },
  warning: {
    icon: 'text-amber-500',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-amber-200 dark:border-amber-800',
    title: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    icon: 'text-blue-500',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-blue-200 dark:border-blue-800',
    title: 'text-blue-800 dark:text-blue-200',
  },
  loading: {
    icon: 'text-gray-500 animate-spin',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    title: 'text-gray-800 dark:text-gray-200',
  },
};

export const TOAST_RICH_STYLES: Record<ToastType, {
  bg: string;
  border: string;
  text: string;
}> = {
  success: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-white',
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
  },
  loading: {
    bg: 'bg-gray-500',
    border: 'border-gray-600',
    text: 'text-white',
  },
};

export const TOAST_POSITION_STYLES: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

export function getToastStyles(type: ToastType, richColors: boolean = false) {
  return richColors ? TOAST_RICH_STYLES[type] : TOAST_TYPE_STYLES[type];
}

export function getToastPositionStyles(position: ToastPosition) {
  return TOAST_POSITION_STYLES[position];
}

export default useToast;
