/**
 * GLAMO - useConfirmDialog Hook
 * Confirmation dialogs with async/await support
 * 
 * @version 1.0.0
 * @description Handles confirmation prompts with customizable actions
 */

'use client';

import { useState, useCallback, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogConfig {
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string | ReactNode;
  /** Visual variant for styling */
  variant?: ConfirmVariant;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button loading text */
  confirmLoadingText?: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Additional details (collapsible) */
  details?: string;
  /** Whether the dialog is destructive action */
  isDestructive?: boolean;
  /** Input for type-to-confirm */
  confirmInput?: {
    label: string;
    value: string;
    placeholder?: string;
    caseSensitive?: boolean;
  };
  /** Checkbox confirmation */
  confirmCheckbox?: {
    label: string;
    required?: boolean;
  };
}

export interface ConfirmDialogState extends ConfirmDialogConfig {
  isOpen: boolean;
  isConfirming: boolean;
  inputValue: string;
  isCheckboxChecked: boolean;
}

export interface ConfirmDialogActions {
  /** Open confirm dialog and wait for result */
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>;
  /** Programmatically close dialog */
  close: () => void;
  /** Handle confirm action */
  handleConfirm: () => void;
  /** Handle cancel action */
  handleCancel: () => void;
  /** Update input value (for type-to-confirm) */
  setInputValue: (value: string) => void;
  /** Update checkbox state */
  setCheckboxChecked: (checked: boolean) => void;
}

export interface UseConfirmDialogReturn extends ConfirmDialogState, ConfirmDialogActions {
  /** Whether confirm button should be enabled */
  canConfirm: boolean;
}

// ============================================================================
// CONFIRM DIALOG CONTEXT
// ============================================================================

interface ConfirmDialogContextValue {
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>;
  state: ConfirmDialogState;
  actions: Omit<ConfirmDialogActions, 'confirm'>;
  canConfirm: boolean;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialogContext(): ConfirmDialogContextValue | null {
  return useContext(ConfirmDialogContext);
}

// ============================================================================
// CONFIRM DIALOG PROVIDER
// ============================================================================

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

const defaultConfig: ConfirmDialogConfig = {
  title: 'Confirmar',
  message: 'Deseja confirmar esta ação?',
  variant: 'info',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
};

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps): JSX.Element {
  const { confirm, ...rest } = useConfirmDialog();
  
  const value: ConfirmDialogContextValue = {
    confirm,
    state: rest,
    actions: {
      close: rest.close,
      handleConfirm: rest.handleConfirm,
      handleCancel: rest.handleCancel,
      setInputValue: rest.setInputValue,
      setCheckboxChecked: rest.setCheckboxChecked,
    },
    canConfirm: rest.canConfirm,
  };

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
    </ConfirmDialogContext.Provider>
  );
}

// ============================================================================
// USE CONFIRM DIALOG HOOK
// ============================================================================

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [config, setConfig] = useState<ConfirmDialogConfig>(defaultConfig);
  const [inputValue, setInputValue] = useState('');
  const [isCheckboxChecked, setCheckboxChecked] = useState(false);

  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const onConfirmRef = useRef<(() => Promise<void> | void) | null>(null);

  // Calculate if confirm is allowed
  const canConfirm = (() => {
    // Check type-to-confirm input
    if (config.confirmInput) {
      const expected = config.confirmInput.value;
      const actual = inputValue;
      const matches = config.confirmInput.caseSensitive
        ? actual === expected
        : actual.toLowerCase() === expected.toLowerCase();
      if (!matches) return false;
    }

    // Check required checkbox
    if (config.confirmCheckbox?.required && !isCheckboxChecked) {
      return false;
    }

    return true;
  })();

  const resetState = useCallback(() => {
    setInputValue('');
    setCheckboxChecked(false);
    setIsConfirming(false);
  }, []);

  const confirm = useCallback((dialogConfig: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({ ...defaultConfig, ...dialogConfig });
      setIsOpen(true);
      resetState();
      resolveRef.current = resolve;
    });
  }, [resetState]);

  const close = useCallback(() => {
    setIsOpen(false);
    resetState();
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, [resetState]);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;

    setIsConfirming(true);

    try {
      // Execute any async confirm action
      if (onConfirmRef.current) {
        await onConfirmRef.current();
      }

      setIsOpen(false);
      resetState();
      
      if (resolveRef.current) {
        resolveRef.current(true);
        resolveRef.current = null;
      }
    } catch (error) {
      // Keep dialog open on error
      setIsConfirming(false);
      throw error;
    }
  }, [canConfirm, resetState]);

  const handleCancel = useCallback(() => {
    close();
  }, [close]);

  return {
    // State
    isOpen,
    isConfirming,
    inputValue,
    isCheckboxChecked,
    canConfirm,
    // Config
    ...config,
    // Actions
    confirm,
    close,
    handleConfirm,
    handleCancel,
    setInputValue,
    setCheckboxChecked,
  };
}

// ============================================================================
// SPECIALIZED CONFIRM HOOKS
// ============================================================================

/**
 * Confirm deletion of an entity
 */
export function useDeleteConfirm(): (
  entityName: string,
  itemName?: string
) => Promise<boolean> {
  const { confirm } = useConfirmDialog();

  return useCallback(async (entityName: string, itemName?: string): Promise<boolean> => {
    const displayName = itemName || entityName;
    
    return confirm({
      title: `Excluir ${entityName}`,
      message: `Tem certeza que deseja excluir ${displayName}? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmText: 'Excluir',
      isDestructive: true,
    });
  }, [confirm]);
}

/**
 * Confirm bulk deletion
 */
export function useBulkDeleteConfirm(): (
  count: number,
  entityName: string
) => Promise<boolean> {
  const { confirm } = useConfirmDialog();

  return useCallback(async (count: number, entityName: string): Promise<boolean> => {
    const plural = count > 1 ? 's' : '';
    
    return confirm({
      title: `Excluir ${count} ${entityName}${plural}`,
      message: `Tem certeza que deseja excluir ${count} ${entityName}${plural}? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmText: `Excluir ${count} item${plural}`,
      isDestructive: true,
      confirmCheckbox: {
        label: 'Entendo que esta ação não pode ser desfeita',
        required: true,
      },
    });
  }, [confirm]);
}

/**
 * Confirm unsaved changes
 */
export function useUnsavedChangesConfirm(): () => Promise<boolean> {
  const { confirm } = useConfirmDialog();

  return useCallback(async (): Promise<boolean> => {
    return confirm({
      title: 'Alterações não salvas',
      message: 'Você tem alterações não salvas. Deseja sair sem salvar?',
      variant: 'warning',
      confirmText: 'Sair sem salvar',
      cancelText: 'Continuar editando',
    });
  }, [confirm]);
}

/**
 * Confirm status change
 */
export function useStatusChangeConfirm(): (
  entityName: string,
  currentStatus: string,
  newStatus: string
) => Promise<boolean> {
  const { confirm } = useConfirmDialog();

  return useCallback(async (
    entityName: string,
    currentStatus: string,
    newStatus: string
  ): Promise<boolean> => {
    return confirm({
      title: `Alterar status`,
      message: `Deseja alterar o status de "${entityName}" de "${currentStatus}" para "${newStatus}"?`,
      variant: 'warning',
      confirmText: 'Alterar status',
    });
  }, [confirm]);
}

/**
 * Confirm dangerous action with type-to-confirm
 */
export function useDangerousActionConfirm(): (
  action: string,
  confirmWord: string
) => Promise<boolean> {
  const { confirm } = useConfirmDialog();

  return useCallback(async (action: string, confirmWord: string): Promise<boolean> => {
    return confirm({
      title: `Ação perigosa`,
      message: `Esta ação é irreversível. Para continuar, digite "${confirmWord}" no campo abaixo.`,
      variant: 'danger',
      confirmText: action,
      isDestructive: true,
      confirmInput: {
        label: `Digite "${confirmWord}" para confirmar`,
        value: confirmWord,
        placeholder: confirmWord,
        caseSensitive: false,
      },
    });
  }, [confirm]);
}

// ============================================================================
// VARIANT STYLING
// ============================================================================

export const CONFIRM_VARIANT_STYLES: Record<ConfirmVariant, {
  icon: string;
  iconBg: string;
  confirmButton: string;
}> = {
  danger: {
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

export function getConfirmVariantStyles(variant: ConfirmVariant = 'info') {
  return CONFIRM_VARIANT_STYLES[variant];
}

export default useConfirmDialog;
