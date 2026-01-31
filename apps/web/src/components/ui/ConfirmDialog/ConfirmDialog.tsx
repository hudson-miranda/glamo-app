/**
 * GLAMO - ConfirmDialog Component
 * Confirmation dialog with customizable options
 * 
 * @version 1.0.0
 * @description Modal dialog for confirming dangerous/important actions
 */

'use client';

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { ConfirmVariant } from '@/hooks/useConfirmDialog';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog message/content */
  message: string | ReactNode;
  /** Visual variant */
  variant?: ConfirmVariant;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button loading state */
  isConfirming?: boolean;
  /** Confirm button loading text */
  confirmLoadingText?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Whether confirm button should be disabled */
  confirmDisabled?: boolean;
  /** Additional details (shown in expandable section) */
  details?: string;
  /** Type-to-confirm input */
  confirmInput?: {
    label: string;
    value: string;
    inputValue: string;
    onChange: (value: string) => void;
    placeholder?: string;
    caseSensitive?: boolean;
  };
  /** Checkbox confirmation */
  confirmCheckbox?: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    required?: boolean;
  };
  /** Custom class for dialog */
  className?: string;
  /** Z-index for the dialog */
  zIndex?: number;
}

// ============================================================================
// VARIANT ICONS
// ============================================================================

const VariantIcons: Record<ConfirmVariant, ReactNode> = {
  danger: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// ============================================================================
// VARIANT STYLES
// ============================================================================

const VARIANT_STYLES: Record<ConfirmVariant, {
  icon: string;
  iconBg: string;
  button: string;
}> = {
  danger: {
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
  confirmLoadingText = 'Confirmando...',
  icon,
  confirmDisabled = false,
  details,
  confirmInput,
  confirmCheckbox,
  className,
  zIndex = 50,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus confirm input or confirm button
      if (confirmInput) {
        const input = dialogRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }
  }, [isOpen, confirmInput]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isConfirming) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isConfirming, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isConfirming) {
        onClose();
      }
    },
    [isConfirming, onClose]
  );

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirm action failed:', error);
    }
  }, [onConfirm]);

  // Compute if confirm is allowed
  const canConfirm = (() => {
    if (confirmDisabled) return false;
    
    // Check type-to-confirm input
    if (confirmInput) {
      const matches = confirmInput.caseSensitive
        ? confirmInput.inputValue === confirmInput.value
        : confirmInput.inputValue.toLowerCase() === confirmInput.value.toLowerCase();
      if (!matches) return false;
    }

    // Check required checkbox
    if (confirmCheckbox?.required && !confirmCheckbox.checked) {
      return false;
    }

    return true;
  })();

  // Get variant styles
  const styles = VARIANT_STYLES[variant];

  if (!isOpen) return null;

  const dialog = (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm'
      )}
      style={{ zIndex }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full max-w-md',
          'bg-white dark:bg-gray-800',
          'rounded-xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-full',
              'flex items-center justify-center',
              styles.iconBg
            )}
          >
            <span className={styles.icon}>{icon || VariantIcons[variant]}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h3>
            <div
              id="confirm-dialog-description"
              className="mt-2 text-sm text-gray-600 dark:text-gray-300"
            >
              {message}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 space-y-4">
          {/* Details (expandable) */}
          {details && (
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    showDetails && 'rotate-90'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span>Ver detalhes</span>
              </button>
              {showDetails && (
                <div className="mt-2 p-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono whitespace-pre-wrap">
                  {details}
                </div>
              )}
            </div>
          )}

          {/* Type-to-confirm Input */}
          {confirmInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {confirmInput.label}
              </label>
              <input
                type="text"
                value={confirmInput.inputValue}
                onChange={(e) => confirmInput.onChange(e.target.value)}
                placeholder={confirmInput.placeholder}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border',
                  'bg-white dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-gray-600',
                  'focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500'
                )}
              />
            </div>
          )}

          {/* Checkbox Confirmation */}
          {confirmCheckbox && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmCheckbox.checked}
                onChange={(e) => confirmCheckbox.onChange(e.target.checked)}
                className={cn(
                  'mt-0.5 h-4 w-4 rounded',
                  'border-gray-300 dark:border-gray-600',
                  'text-pink-500 focus:ring-pink-500'
                )}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {confirmCheckbox.label}
                {confirmCheckbox.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'text-gray-700 dark:text-gray-300',
              'bg-gray-100 dark:bg-gray-700',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2',
              styles.button
            )}
          >
            {isConfirming && (
              <svg
                className="w-4 h-4 animate-spin"
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
            {isConfirming ? confirmLoadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Render in portal
  if (typeof document !== 'undefined') {
    return createPortal(dialog, document.body);
  }

  return dialog;
}

export default ConfirmDialog;
