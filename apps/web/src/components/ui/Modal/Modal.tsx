/**
 * GLAMO - Modal Component
 * Reusable modal with animations and accessibility
 * 
 * @version 1.0.0
 * @description Base modal component for dialogs and overlays
 */

'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { ModalSize } from '@/hooks/useModal';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string | ReactNode;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Footer content */
  footer?: ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Center the modal vertically */
  centered?: boolean;
  /** Custom class for modal */
  className?: string;
  /** Custom class for overlay */
  overlayClassName?: string;
  /** Custom class for content */
  contentClassName?: string;
  /** Custom class for header */
  headerClassName?: string;
  /** Custom class for body */
  bodyClassName?: string;
  /** Custom class for footer */
  footerClassName?: string;
  /** Z-index for the modal */
  zIndex?: number;
  /** ID for accessibility */
  id?: string;
  /** Initial focus element selector */
  initialFocus?: string;
  /** Whether to trap focus inside modal */
  trapFocus?: boolean;
  /** Whether modal is scrollable */
  scrollable?: boolean;
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether to show footer */
  showFooter?: boolean;
  /** Custom header renderer */
  renderHeader?: () => ReactNode;
  /** Callback when modal opens */
  onOpen?: () => void;
  /** Callback after modal closes */
  onAfterClose?: () => void;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] w-full',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  centered = true,
  className,
  overlayClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  zIndex = 50,
  id,
  initialFocus,
  trapFocus = true,
  scrollable = true,
  showHeader = true,
  showFooter = true,
  renderHeader,
  onOpen,
  onAfterClose,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      onOpen?.();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onOpen]);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && previousFocus.current) {
      previousFocus.current.focus();
      onAfterClose?.();
    }
  }, [isOpen, onAfterClose]);

  // Initial focus
  useEffect(() => {
    if (isOpen && modalRef.current) {
      if (initialFocus) {
        const element = modalRef.current.querySelector(initialFocus) as HTMLElement;
        element?.focus();
      } else {
        // Focus first focusable element
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (focusable[0] as HTMLElement)?.focus();
      }
    }
  }, [isOpen, initialFocus]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }

      // Focus trap
      if (e.key === 'Tab' && trapFocus && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusable[0] as HTMLElement;
        const lastFocusable = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    },
    [closeOnEscape, onClose, trapFocus]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget && closeOnBackdrop) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose]
  );

  if (!isOpen) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id || 'modal'}-title` : undefined}
      aria-describedby={description ? `${id || 'modal'}-description` : undefined}
      className={cn(
        'fixed inset-0 flex',
        centered ? 'items-center' : 'items-start pt-16',
        'justify-center p-4',
        'overflow-y-auto',
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0',
          'bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full',
          SIZE_STYLES[size],
          'bg-white dark:bg-gray-800',
          'rounded-xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          !scrollable && 'max-h-[90vh] overflow-hidden',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {showHeader && (title || renderHeader) && (
          <div
            className={cn(
              'flex items-center justify-between gap-4',
              'px-6 py-4',
              'border-b border-gray-200 dark:border-gray-700',
              headerClassName
            )}
          >
            {renderHeader ? (
              renderHeader()
            ) : (
              <div className="flex-1 min-w-0">
                {typeof title === 'string' ? (
                  <h2
                    id={`${id || 'modal'}-title`}
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {description && (
                  <p
                    id={`${id || 'modal'}-description`}
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex-shrink-0 p-2 rounded-lg',
                  'text-gray-400 hover:text-gray-600',
                  'dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            'px-6 py-4',
            scrollable && 'overflow-y-auto max-h-[60vh]',
            contentClassName,
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && footer && (
          <div
            className={cn(
              'flex items-center justify-end gap-3',
              'px-6 py-4',
              'border-t border-gray-200 dark:border-gray-700',
              'bg-gray-50 dark:bg-gray-900/50',
              'rounded-b-xl',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return modal;
}

// ============================================================================
// MODAL HEADER COMPONENT
// ============================================================================

export interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function ModalHeader({
  children,
  onClose,
  showCloseButton = true,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'px-6 py-4',
        'border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            'text-gray-400 hover:text-gray-600',
            'dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
// MODAL BODY COMPONENT
// ============================================================================

export interface ModalBodyProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
}

export function ModalBody({ children, scrollable = true, className }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'px-6 py-4',
        scrollable && 'overflow-y-auto max-h-[60vh]',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// MODAL FOOTER COMPONENT
// ============================================================================

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4',
        'border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900/50',
        'rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Modal;
