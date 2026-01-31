/**
 * GLAMO - useModal Hook
 * Modal state management with stack support
 * 
 * @version 1.0.0
 * @description Manages modal visibility, data, and stacking behavior
 */

'use client';

import { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { UUID } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalOptions {
  /** Modal size */
  size?: ModalSize;
  /** Prevent closing on backdrop click */
  preventBackdropClose?: boolean;
  /** Prevent closing on escape key */
  preventEscapeClose?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Callback when modal closes */
  onClose?: () => void;
  /** Callback when modal opens */
  onOpen?: () => void;
}

export interface ModalState<T = unknown> {
  /** Whether modal is open */
  isOpen: boolean;
  /** Data passed to the modal */
  data: T | null;
  /** Modal options */
  options: ModalOptions;
  /** Modal unique ID */
  modalId: string;
}

export interface ModalActions<T = unknown> {
  /** Open the modal with optional data */
  open: (data?: T, options?: ModalOptions) => void;
  /** Close the modal */
  close: () => void;
  /** Update modal data */
  setData: (data: T | null) => void;
  /** Toggle modal visibility */
  toggle: (data?: T) => void;
}

export interface UseModalReturn<T = unknown> extends ModalState<T>, ModalActions<T> {}

export interface ModalStackItem<T = unknown> {
  id: string;
  isOpen: boolean;
  data: T | null;
  options: ModalOptions;
  component?: ReactNode;
}

// ============================================================================
// MODAL CONTEXT (for stacking)
// ============================================================================

interface ModalContextValue {
  stack: ModalStackItem[];
  push: <T>(modal: Omit<ModalStackItem<T>, 'id'>) => string;
  pop: () => void;
  remove: (id: string) => void;
  getTopModal: () => ModalStackItem | undefined;
  isTopModal: (id: string) => boolean;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalContext(): ModalContextValue | null {
  return useContext(ModalContext);
}

// ============================================================================
// MODAL PROVIDER
// ============================================================================

interface ModalProviderProps {
  children: ReactNode;
  /** Maximum number of stacked modals */
  maxStack?: number;
}

export function ModalProvider({ children, maxStack = 5 }: ModalProviderProps): JSX.Element {
  const [stack, setStack] = useState<ModalStackItem[]>([]);
  
  const push = useCallback(<T,>(modal: Omit<ModalStackItem<T>, 'id'>): string => {
    const id = `modal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    setStack(prev => {
      if (prev.length >= maxStack) {
        console.warn(`Maximum modal stack size (${maxStack}) reached`);
        return prev;
      }
      return [...prev, { ...modal, id } as ModalStackItem];
    });
    
    return id;
  }, [maxStack]);

  const pop = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      last.options.onClose?.();
      return prev.slice(0, -1);
    });
  }, []);

  const remove = useCallback((id: string) => {
    setStack(prev => {
      const modal = prev.find(m => m.id === id);
      modal?.options.onClose?.();
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const getTopModal = useCallback((): ModalStackItem | undefined => {
    return stack[stack.length - 1];
  }, [stack]);

  const isTopModal = useCallback((id: string): boolean => {
    return stack.length > 0 && stack[stack.length - 1].id === id;
  }, [stack]);

  const closeAll = useCallback(() => {
    stack.forEach(modal => modal.options.onClose?.());
    setStack([]);
  }, [stack]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack.length > 0) {
        const topModal = stack[stack.length - 1];
        if (!topModal.options.preventEscapeClose) {
          pop();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [stack, pop]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (stack.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [stack.length]);

  const value: ModalContextValue = {
    stack,
    push,
    pop,
    remove,
    getTopModal,
    isTopModal,
    closeAll,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

// ============================================================================
// USE MODAL HOOK
// ============================================================================

let modalIdCounter = 0;

export function useModal<T = unknown>(
  defaultOptions: ModalOptions = {}
): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [options, setOptions] = useState<ModalOptions>(defaultOptions);
  const modalId = useRef(`modal_${++modalIdCounter}`);
  
  const context = useModalContext();

  const open = useCallback((newData?: T, newOptions?: ModalOptions) => {
    const mergedOptions = { ...defaultOptions, ...newOptions };
    setData(newData ?? null);
    setOptions(mergedOptions);
    setIsOpen(true);
    mergedOptions.onOpen?.();

    // If using context, push to stack
    if (context) {
      context.push({
        isOpen: true,
        data: newData ?? null,
        options: mergedOptions,
      });
    }
  }, [defaultOptions, context]);

  const close = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();

    // If using context, remove from stack
    if (context) {
      context.remove(modalId.current);
    }
  }, [options, context]);

  const toggle = useCallback((newData?: T) => {
    if (isOpen) {
      close();
    } else {
      open(newData);
    }
  }, [isOpen, open, close]);

  // Handle escape key (when not using provider)
  useEffect(() => {
    if (context) return; // Provider handles this

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !options.preventEscapeClose) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, options.preventEscapeClose, close, context]);

  // Prevent body scroll (when not using provider)
  useEffect(() => {
    if (context) return; // Provider handles this

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (!context) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, context]);

  return {
    isOpen,
    data,
    options,
    modalId: modalId.current,
    open,
    close,
    setData,
    toggle,
  };
}

// ============================================================================
// USE ENTITY MODAL HOOK
// ============================================================================

export type EntityModalMode = 'create' | 'edit' | 'view' | 'duplicate';

export interface EntityModalState<T> {
  isOpen: boolean;
  mode: EntityModalMode;
  entity: T | null;
  entityId: UUID | null;
}

export interface EntityModalActions<T> {
  openCreate: () => void;
  openEdit: (entity: T) => void;
  openView: (entity: T) => void;
  openDuplicate: (entity: T) => void;
  close: () => void;
}

export function useEntityModal<T extends { id: UUID }>(
  options?: ModalOptions
): EntityModalState<T> & EntityModalActions<T> {
  const modal = useModal<{ mode: EntityModalMode; entity: T | null }>(options);

  const openCreate = useCallback(() => {
    modal.open({ mode: 'create', entity: null });
  }, [modal]);

  const openEdit = useCallback((entity: T) => {
    modal.open({ mode: 'edit', entity });
  }, [modal]);

  const openView = useCallback((entity: T) => {
    modal.open({ mode: 'view', entity });
  }, [modal]);

  const openDuplicate = useCallback((entity: T) => {
    modal.open({ mode: 'duplicate', entity });
  }, [modal]);

  return {
    isOpen: modal.isOpen,
    mode: modal.data?.mode ?? 'create',
    entity: modal.data?.entity ?? null,
    entityId: modal.data?.entity?.id ?? null,
    openCreate,
    openEdit,
    openView,
    openDuplicate,
    close: modal.close,
  };
}

// ============================================================================
// USE MULTI MODAL HOOK
// ============================================================================

/**
 * Manages multiple modals by key
 */
export function useMultiModal<TKey extends string, TData = unknown>(): {
  isOpen: (key: TKey) => boolean;
  getData: (key: TKey) => TData | null;
  open: (key: TKey, data?: TData) => void;
  close: (key: TKey) => void;
  toggle: (key: TKey, data?: TData) => void;
  closeAll: () => void;
  openModals: TKey[];
} {
  const [modals, setModals] = useState<Map<TKey, TData | null>>(new Map());

  const isOpen = useCallback((key: TKey): boolean => {
    return modals.has(key);
  }, [modals]);

  const getData = useCallback((key: TKey): TData | null => {
    return modals.get(key) ?? null;
  }, [modals]);

  const open = useCallback((key: TKey, data?: TData) => {
    setModals(prev => new Map(prev).set(key, data ?? null));
  }, []);

  const close = useCallback((key: TKey) => {
    setModals(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const toggle = useCallback((key: TKey, data?: TData) => {
    setModals(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, data ?? null);
      }
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setModals(new Map());
  }, []);

  const openModals = Array.from(modals.keys());

  return {
    isOpen,
    getData,
    open,
    close,
    toggle,
    closeAll,
    openModals,
  };
}

// ============================================================================
// MODAL SIZES
// ============================================================================

export const MODAL_SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function getModalSizeClass(size: ModalSize = 'md'): string {
  return MODAL_SIZES[size];
}

export default useModal;
