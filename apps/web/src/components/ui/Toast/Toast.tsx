/**
 * GLAMO - Toast Component
 * Toast notification with animations and actions
 * 
 * @version 1.0.0
 * @description Displays toast notifications with various types and actions
 */

'use client';

import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { Toast as ToastData, ToastType, ToastPosition } from '@/hooks/useToast';

// ============================================================================
// ICONS
// ============================================================================

const ToastIcons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
  ),
};

// ============================================================================
// STYLES
// ============================================================================

const TYPE_STYLES: Record<ToastType, {
  container: string;
  icon: string;
}> = {
  success: {
    container: 'bg-white dark:bg-gray-800 border-l-4 border-l-green-500',
    icon: 'text-green-500',
  },
  error: {
    container: 'bg-white dark:bg-gray-800 border-l-4 border-l-red-500',
    icon: 'text-red-500',
  },
  warning: {
    container: 'bg-white dark:bg-gray-800 border-l-4 border-l-amber-500',
    icon: 'text-amber-500',
  },
  info: {
    container: 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500',
    icon: 'text-blue-500',
  },
  loading: {
    container: 'bg-white dark:bg-gray-800 border-l-4 border-l-gray-400',
    icon: 'text-gray-500',
  },
};

const POSITION_STYLES: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

const ANIMATION_ORIGINS: Record<ToastPosition, string> = {
  'top-left': 'slide-in-from-left',
  'top-center': 'slide-in-from-top',
  'top-right': 'slide-in-from-right',
  'bottom-left': 'slide-in-from-left',
  'bottom-center': 'slide-in-from-bottom',
  'bottom-right': 'slide-in-from-right',
};

// ============================================================================
// SINGLE TOAST COMPONENT
// ============================================================================

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  position: ToastPosition;
}

function ToastItem({ toast, onDismiss, position }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = TYPE_STYLES[toast.type];

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [onDismiss, toast.id]);

  // Handle isRemoving state from parent
  useEffect(() => {
    if (toast.isRemoving) {
      setIsExiting(true);
    }
  }, [toast.isRemoving]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 w-full max-w-sm p-4',
        'rounded-lg shadow-lg',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-200',
        styles.container,
        toast.className,
        // Animations
        !isExiting && 'animate-in fade-in',
        !isExiting && ANIMATION_ORIGINS[position],
        isExiting && 'animate-out fade-out',
        isExiting && position.includes('left') && 'slide-out-to-left',
        isExiting && position.includes('right') && 'slide-out-to-right',
        isExiting && position === 'top-center' && 'slide-out-to-top',
        isExiting && position === 'bottom-center' && 'slide-out-to-bottom'
      )}
    >
      {/* Icon */}
      <span className={cn('flex-shrink-0', styles.icon)}>
        {toast.icon || ToastIcons[toast.type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toast.title}
        </p>
        {toast.description && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {toast.description}
          </div>
        )}

        {/* Actions */}
        {(toast.action || toast.cancel) && (
          <div className="flex items-center gap-2 mt-3">
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded',
                  'bg-gray-900 dark:bg-gray-100',
                  'text-white dark:text-gray-900',
                  'hover:bg-gray-800 dark:hover:bg-gray-200',
                  'transition-colors'
                )}
              >
                {toast.action.label}
              </button>
            )}
            {toast.cancel && (
              <button
                onClick={() => {
                  toast.cancel?.onClick();
                  handleDismiss();
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded',
                  'text-gray-600 dark:text-gray-400',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
              >
                {toast.cancel.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {toast.type === 'loading' && toast.progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-pink-500 transition-all duration-300"
            style={{ width: `${toast.progress}%` }}
          />
        </div>
      )}

      {/* Dismiss Button */}
      {toast.dismissable && (
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded',
            'text-gray-400 hover:text-gray-600',
            'dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// TOASTER CONTAINER
// ============================================================================

export interface ToasterProps {
  /** Toasts to display */
  toasts: ToastData[];
  /** Dismiss handler */
  onDismiss: (id: string) => void;
  /** Position for toasts */
  position?: ToastPosition;
  /** Gap between toasts */
  gap?: number;
  /** Expand on hover */
  expandOnHover?: boolean;
  /** Custom class */
  className?: string;
}

export function Toaster({
  toasts,
  onDismiss,
  position = 'bottom-right',
  gap = 12,
  expandOnHover = true,
  className,
}: ToasterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toaster = (
    <div
      className={cn(
        'fixed z-[100] flex flex-col pointer-events-none',
        POSITION_STYLES[position],
        className
      )}
      style={{ gap }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} position={position} />
        </div>
      ))}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(toaster, document.body);
  }

  return toaster;
}

// ============================================================================
// STANDALONE TOAST COMPONENT
// ============================================================================

export interface ToastProps {
  /** Toast type */
  type: ToastType;
  /** Title text */
  title: string;
  /** Description text */
  description?: string | ReactNode;
  /** Custom icon */
  icon?: ReactNode;
  /** Whether the toast is visible */
  visible?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Show close button */
  showClose?: boolean;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom class */
  className?: string;
}

export function Toast({
  type,
  title,
  description,
  icon,
  visible = true,
  onClose,
  showClose = true,
  action,
  className,
}: ToastProps) {
  const styles = TYPE_STYLES[type];

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm p-4',
        'rounded-lg shadow-lg',
        'border border-gray-200 dark:border-gray-700',
        styles.container,
        className
      )}
    >
      {/* Icon */}
      <span className={cn('flex-shrink-0', styles.icon)}>
        {icon || ToastIcons[type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </p>
        {description && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}

        {/* Action */}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-3 px-3 py-1.5 text-xs font-medium rounded',
              'bg-gray-900 dark:bg-gray-100',
              'text-white dark:text-gray-900',
              'hover:bg-gray-800 dark:hover:bg-gray-200',
              'transition-colors'
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      {showClose && onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded',
            'text-gray-400 hover:text-gray-600',
            'dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Toast;
