/**
 * GLAMO - InlineCreateModal Component
 * Modal wrapper for inline entity creation with form support
 * 
 * @version 1.0.0
 * @description Used when creating related entities inline (e.g., new customer while scheduling)
 */

'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import type { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type EntityType = 
  | 'customer'
  | 'service'
  | 'professional'
  | 'product'
  | 'category'
  | 'supplier'
  | 'appointment';

export interface InlineCreateModalProps<T extends Record<string, unknown>> {
  /** Whether modal is open */
  isOpen?: boolean;
  /** Alias for isOpen (backwards compatibility) */
  open?: boolean;
  /** Close handler */
  onClose: () => void;
  /** Entity type being created (optional) */
  entityType?: EntityType;
  /** Submit handler */
  onSubmit: (data: T) => void | Promise<void>;
  /** Title override */
  title?: string;
  /** Description */
  description?: string;
  /** Form content */
  children?: ReactNode;
  /** Form ID for external submit */
  formId?: string;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional class */
  className?: string;
  /** Placeholder for simple input mode */
  placeholder?: string;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface QuickCreateField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface QuickCreateModalProps<T> {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Entity type */
  entityType: EntityType;
  /** Fields to show */
  fields: QuickCreateField[];
  /** Validation schema */
  schema?: z.ZodSchema<T>;
  /** Submit handler */
  onSubmit: (data: T) => void | Promise<void>;
  /** Initial values */
  initialValues?: Partial<T>;
  /** Custom class */
  className?: string;
}

// ============================================================================
// ENTITY LABELS
// ============================================================================

const ENTITY_LABELS: Record<EntityType, { singular: string; plural: string }> = {
  customer: { singular: 'Cliente', plural: 'Clientes' },
  service: { singular: 'Serviço', plural: 'Serviços' },
  professional: { singular: 'Profissional', plural: 'Profissionais' },
  product: { singular: 'Produto', plural: 'Produtos' },
  category: { singular: 'Categoria', plural: 'Categorias' },
  supplier: { singular: 'Fornecedor', plural: 'Fornecedores' },
  appointment: { singular: 'Agendamento', plural: 'Agendamentos' },
};

const ENTITY_ICONS: Record<EntityType, ReactNode> = {
  customer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  service: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  professional: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  product: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  category: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  supplier: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  appointment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

// ============================================================================
// INLINE CREATE MODAL
// ============================================================================

export function InlineCreateModal<T extends Record<string, unknown>>({
  isOpen,
  open,
  onClose,
  entityType,
  onSubmit,
  title,
  description,
  children,
  formId = 'inline-create-form',
  isSubmitting = false,
  submitText,
  cancelText = 'Cancelar',
  size = 'md',
  className,
  placeholder,
  icon: IconComponent,
}: InlineCreateModalProps<T>) {
  const [inputValue, setInputValue] = useState('');
  
  // Support both isOpen and open props
  const modalIsOpen = isOpen ?? open ?? false;
  
  // Get entity label and icon (with fallback for when entityType is not provided)
  const entityLabel = entityType ? ENTITY_LABELS[entityType] : { singular: 'Item', plural: 'Itens' };
  const entityIcon = entityType ? ENTITY_ICONS[entityType] : null;
  const modalTitle = title || `Novo ${entityLabel.singular}`;
  const submitLabel = submitText || `Criar ${entityLabel.singular}`;
  
  // Render custom icon if provided
  const renderIcon = () => {
    if (IconComponent) {
      return <IconComponent className="w-5 h-5" />;
    }
    return entityIcon;
  };
  
  // Handle simple mode submit (when placeholder is provided but no children)
  const handleSimpleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit({ name: inputValue.trim() } as T);
      setInputValue('');
    }
  }, [inputValue, onSubmit]);
  
  // Reset input when modal closes
  React.useEffect(() => {
    if (!modalIsOpen) {
      setInputValue('');
    }
  }, [modalIsOpen]);

  return (
    <Modal
      isOpen={modalIsOpen}
      onClose={onClose}
      size={size}
      closeOnEscape={!isSubmitting}
      closeOnBackdropClick={!isSubmitting}
      className={className}
    >
      <ModalHeader onClose={!isSubmitting ? onClose : undefined}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-500">
            {renderIcon()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {modalTitle}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {children ? (
          children
        ) : placeholder ? (
          <form id={formId} onSubmit={handleSimpleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                'border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-pink-500',
                'placeholder:text-gray-400'
              )}
              autoFocus
            />
          </form>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            'text-gray-700 dark:text-gray-300',
            'bg-gray-100 dark:bg-gray-700',
            'hover:bg-gray-200 dark:hover:bg-gray-600',
            'transition-colors',
            'disabled:opacity-50'
          )}
        >
          {cancelText}
        </button>
        <button
          type="submit"
          form={formId}
          disabled={isSubmitting}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            'text-white bg-pink-500',
            'hover:bg-pink-600',
            'transition-colors',
            'disabled:opacity-50',
            'flex items-center gap-2'
          )}
        >
          {isSubmitting && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
          {isSubmitting ? 'Criando...' : submitLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// QUICK CREATE MODAL
// ============================================================================

export function QuickCreateModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  entityType,
  fields,
  schema,
  onSubmit,
  initialValues = {},
  className,
}: QuickCreateModalProps<T>) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate if schema provided
      if (schema) {
        const result = schema.safeParse(values);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          for (const error of result.error.errors) {
            const path = error.path.join('.');
            fieldErrors[path] = error.message;
          }
          setErrors(fieldErrors);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values as T);
        onClose();
      } catch (error) {
        console.error('Quick create error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, schema, onSubmit, onClose]
  );

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setValues(initialValues);
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const entityLabel = ENTITY_LABELS[entityType];

  return (
    <InlineCreateModal
      isOpen={isOpen}
      onClose={onClose}
      entityType={entityType}
      onSubmit={onSubmit}
      formId="quick-create-form"
      isSubmitting={isSubmitting}
      size="sm"
      className={className}
    >
      <form id="quick-create-form" onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={(values[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border',
                  'bg-white dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  !errors[field.name] && 'border-gray-300 dark:border-gray-600',
                  !errors[field.name] && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                  errors[field.name] && 'border-red-500'
                )}
              >
                <option value="">{field.placeholder || `Selecione ${field.label}`}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={(values[field.name] as string) || ''}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border',
                  'bg-white dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder-gray-400 dark:placeholder-gray-500',
                  !errors[field.name] && 'border-gray-300 dark:border-gray-600',
                  !errors[field.name] && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                  errors[field.name] && 'border-red-500'
                )}
              />
            )}

            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        ))}

        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
          Complete o cadastro completo depois em {entityLabel.plural}.
        </p>
      </form>
    </InlineCreateModal>
  );
}

// ============================================================================
// HOOK FOR INLINE CREATE
// ============================================================================

export interface UseInlineCreateOptions<T> {
  entityType: EntityType;
  onCreated?: (entity: T) => void;
}

export interface UseInlineCreateReturn<T> {
  isOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  handleCreate: (data: T) => Promise<void>;
  isCreating: boolean;
}

export function useInlineCreate<T>(
  options: UseInlineCreateOptions<T>
): UseInlineCreateReturn<T> {
  const { onCreated } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const openCreate = useCallback(() => setIsOpen(true), []);
  const closeCreate = useCallback(() => setIsOpen(false), []);

  const handleCreate = useCallback(
    async (data: T) => {
      setIsCreating(true);
      try {
        // Simulate API call - in real implementation, this would call the API
        await new Promise((resolve) => setTimeout(resolve, 500));
        onCreated?.(data);
        closeCreate();
      } finally {
        setIsCreating(false);
      }
    },
    [onCreated, closeCreate]
  );

  return {
    isOpen,
    openCreate,
    closeCreate,
    handleCreate,
    isCreating,
  };
}

export default InlineCreateModal;
