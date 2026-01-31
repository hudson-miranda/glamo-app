/**
 * GLAMO - EntityForm Component
 * Dynamic form generator for entity CRUD operations
 * 
 * @version 1.0.0
 * @description Generates forms based on schema with validation and field rendering
 */

'use client';

import React, {
  ReactNode,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '@/lib/utils';
import { useFormWithValidation, type FormState } from '@/hooks/useFormWithValidation';
import type { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'password'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'color'
  | 'cpf'
  | 'cnpj'
  | 'cep'
  | 'custom';

export interface FieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FieldDefinition<T = unknown> {
  /** Field name (key in form values) */
  name: keyof T & string;
  /** Display label */
  label: string;
  /** Field type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Options for select/radio fields */
  options?: FieldOption[];
  /** Custom field component */
  component?: React.ComponentType<FieldComponentProps<T>>;
  /** Field visibility condition */
  visible?: (values: Partial<T>) => boolean;
  /** Field dependency (re-render when this field changes) */
  dependsOn?: (keyof T)[];
  /** Column span (1-12) */
  colSpan?: number;
  /** Additional props for the field */
  props?: Record<string, unknown>;
  /** Custom validation message */
  validationMessage?: string;
  /** Transform value before setting */
  transform?: (value: unknown) => unknown;
  /** Format value for display */
  format?: (value: unknown) => string;
  /** Min value (for number/date) */
  min?: number | string;
  /** Max value (for number/date) */
  max?: number | string;
  /** Step (for number) */
  step?: number;
  /** Max length (for text) */
  maxLength?: number;
  /** Rows (for textarea) */
  rows?: number;
  /** Accept (for file) */
  accept?: string;
  /** Multiple (for select/file) */
  multiple?: boolean;
}

export interface FieldComponentProps<T = unknown> {
  field: FieldDefinition<T>;
  value: unknown;
  error?: string;
  touched: boolean;
  dirty: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
}

export interface FormSection<T = unknown> {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: FieldDefinition<T>[];
  /** Number of columns */
  columns?: number;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Whether section starts collapsed */
  defaultCollapsed?: boolean;
  /** Section visibility condition */
  visible?: (values: Partial<T>) => boolean;
}

export interface EntityFormProps<T extends Record<string, unknown>> {
  /** Form sections with fields */
  sections: FormSection<T>[];
  /** Zod validation schema */
  schema: z.ZodSchema<T>;
  /** Initial form values */
  initialValues?: Partial<T>;
  /** Submit handler */
  onSubmit: (values: T) => void | Promise<void>;
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
  /** Submit button text */
  submitText?: string;
  /** Cancel handler */
  onCancel?: () => void;
  /** Cancel button text */
  cancelText?: string;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Form ID */
  id?: string;
  /** Custom class */
  className?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Show submit button */
  showSubmit?: boolean;
  /** Custom footer renderer */
  renderFooter?: (state: FormState<T>) => ReactNode;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Auto save handler */
  onAutoSave?: (values: Partial<T>) => void;
  /** Auto save delay */
  autoSaveDelay?: number;
}

export interface EntityFormRef<T> {
  /** Get current form values */
  getValues: () => T;
  /** Set form values */
  setValues: (values: Partial<T>) => void;
  /** Reset form */
  reset: () => void;
  /** Submit form */
  submit: () => Promise<void>;
  /** Validate form */
  validate: () => Promise<boolean>;
  /** Get form state */
  getState: () => FormState<T>;
}

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

interface TextInputProps {
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  className?: string;
}

function TextInput({
  name,
  type = 'text',
  value,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  error,
  onChange,
  onBlur,
  className,
}: TextInputProps) {
  return (
    <input
      id={name}
      name={name}
      type={type}
      value={value || ''}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        'w-full px-3 py-2 rounded-lg border',
        'bg-white dark:bg-gray-900',
        'text-gray-900 dark:text-gray-100',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'transition-colors',
        !error && 'border-gray-300 dark:border-gray-600',
        !error && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
        error && 'border-red-500 focus:ring-red-500/20',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
        readOnly && 'bg-gray-50 dark:bg-gray-800',
        className
      )}
    />
  );
}

interface TextareaInputProps {
  name: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  rows?: number;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  className?: string;
}

function TextareaInput({
  name,
  value,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  rows = 3,
  error,
  onChange,
  onBlur,
  className,
}: TextareaInputProps) {
  return (
    <textarea
      id={name}
      name={name}
      value={value || ''}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        'w-full px-3 py-2 rounded-lg border resize-none',
        'bg-white dark:bg-gray-900',
        'text-gray-900 dark:text-gray-100',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'transition-colors',
        !error && 'border-gray-300 dark:border-gray-600',
        !error && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
        error && 'border-red-500 focus:ring-red-500/20',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
        className
      )}
    />
  );
}

interface SelectInputProps {
  name: string;
  value: string | string[];
  options: FieldOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  error?: string;
  onChange: (value: string | string[]) => void;
  onBlur: () => void;
  className?: string;
}

function SelectInput({
  name,
  value,
  options,
  placeholder,
  disabled,
  multiple,
  error,
  onChange,
  onBlur,
  className,
}: SelectInputProps) {
  return (
    <select
      id={name}
      name={name}
      value={value || (multiple ? [] : '')}
      multiple={multiple}
      disabled={disabled}
      onChange={(e) => {
        if (multiple) {
          const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
          onChange(selected);
        } else {
          onChange(e.target.value);
        }
      }}
      onBlur={onBlur}
      className={cn(
        'w-full px-3 py-2 rounded-lg border',
        'bg-white dark:bg-gray-900',
        'text-gray-900 dark:text-gray-100',
        'transition-colors',
        !error && 'border-gray-300 dark:border-gray-600',
        !error && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
        error && 'border-red-500 focus:ring-red-500/20',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface CheckboxInputProps {
  name: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  onBlur: () => void;
  className?: string;
}

function CheckboxInput({
  name,
  label,
  checked,
  disabled,
  onChange,
  onBlur,
  className,
}: CheckboxInputProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked || false}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        className={cn(
          'h-4 w-4 rounded',
          'border-gray-300 dark:border-gray-600',
          'text-pink-500 focus:ring-pink-500',
          'bg-white dark:bg-gray-900'
        )}
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

// ============================================================================
// FIELD RENDERER
// ============================================================================

interface FieldRendererProps<T> {
  field: FieldDefinition<T>;
  value: unknown;
  error?: string;
  touched: boolean;
  dirty: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
}

function FieldRenderer<T>({
  field,
  value,
  error,
  touched,
  dirty,
  onChange,
  onBlur,
  disabled,
}: FieldRendererProps<T>) {
  const isDisabled = disabled || field.disabled;
  const showError = touched && error;

  // Custom component
  if (field.component) {
    const CustomComponent = field.component;
    return (
      <CustomComponent
        field={field}
        value={value}
        error={showError ? error : undefined}
        touched={touched}
        dirty={dirty}
        onChange={onChange}
        onBlur={onBlur}
        disabled={isDisabled}
      />
    );
  }

  // Render based on type
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'phone':
      case 'cpf':
      case 'cnpj':
      case 'cep':
        return (
          <TextInput
            name={field.name}
            type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
            value={value as string}
            placeholder={field.placeholder}
            disabled={isDisabled}
            readOnly={field.readOnly}
            maxLength={field.maxLength}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'number':
      case 'decimal':
      case 'currency':
        return (
          <TextInput
            name={field.name}
            type="number"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            disabled={isDisabled}
            readOnly={field.readOnly}
            error={showError ? error : undefined}
            onChange={(v) => onChange(v ? Number(v) : undefined)}
            onBlur={onBlur}
          />
        );

      case 'textarea':
        return (
          <TextareaInput
            name={field.name}
            value={value as string}
            placeholder={field.placeholder}
            disabled={isDisabled}
            readOnly={field.readOnly}
            maxLength={field.maxLength}
            rows={field.rows}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'select':
        return (
          <SelectInput
            name={field.name}
            value={value as string}
            options={field.options || []}
            placeholder={field.placeholder}
            disabled={isDisabled}
            multiple={field.multiple}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'checkbox':
        return (
          <CheckboxInput
            name={field.name}
            label={field.label}
            checked={value as boolean}
            disabled={isDisabled}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'date':
        return (
          <TextInput
            name={field.name}
            type="date"
            value={value as string}
            disabled={isDisabled}
            readOnly={field.readOnly}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'datetime':
        return (
          <TextInput
            name={field.name}
            type="datetime-local"
            value={value as string}
            disabled={isDisabled}
            readOnly={field.readOnly}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'time':
        return (
          <TextInput
            name={field.name}
            type="time"
            value={value as string}
            disabled={isDisabled}
            readOnly={field.readOnly}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      default:
        return (
          <TextInput
            name={field.name}
            value={value as string}
            placeholder={field.placeholder}
            disabled={isDisabled}
            readOnly={field.readOnly}
            error={showError ? error : undefined}
            onChange={onChange}
            onBlur={onBlur}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-1', field.type === 'checkbox' && 'pt-6')}>
      {/* Label */}
      {field.type !== 'checkbox' && (
        <label
          htmlFor={field.name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      {renderInput()}

      {/* Error / Helper */}
      {showError ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : field.helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{field.helperText}</p>
      ) : null}
    </div>
  );
}

// ============================================================================
// SECTION RENDERER
// ============================================================================

interface SectionRendererProps<T> {
  section: FormSection<T>;
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  onChange: (name: string, value: unknown) => void;
  onBlur: (name: string) => void;
  disabled: boolean;
}

function SectionRenderer<T>({
  section,
  values,
  errors,
  touched,
  dirty,
  onChange,
  onBlur,
  disabled,
}: SectionRendererProps<T>) {
  const [isCollapsed, setIsCollapsed] = React.useState(section.defaultCollapsed || false);

  // Check visibility
  if (section.visible && !section.visible(values)) {
    return null;
  }

  const visibleFields = section.fields.filter(
    (field) => !field.visible || field.visible(values)
  );

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      {(section.title || section.collapsible) && (
        <div
          className={cn(
            'flex items-center justify-between',
            section.collapsible && 'cursor-pointer'
          )}
          onClick={() => section.collapsible && setIsCollapsed(!isCollapsed)}
        >
          <div>
            {section.title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
            )}
            {section.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {section.description}
              </p>
            )}
          </div>
          {section.collapsible && (
            <svg
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                !isCollapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      )}

      {/* Fields Grid */}
      {!isCollapsed && (
        <div
          className={cn(
            'grid gap-4',
            section.columns === 1 && 'grid-cols-1',
            section.columns === 2 && 'grid-cols-1 md:grid-cols-2',
            section.columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            section.columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            !section.columns && 'grid-cols-1 md:grid-cols-2'
          )}
        >
          {visibleFields.map((field) => (
            <div
              key={field.name}
              className={cn(
                field.colSpan === 12 && 'col-span-full',
                field.colSpan && field.colSpan < 12 && `md:col-span-${field.colSpan}`
              )}
              style={
                field.colSpan && field.colSpan < 12
                  ? { gridColumn: `span ${Math.min(field.colSpan, section.columns || 2)}` }
                  : undefined
              }
            >
              <FieldRenderer
                field={field}
                value={values[field.name as keyof T]}
                error={errors[field.name]}
                touched={touched[field.name] || false}
                dirty={dirty[field.name] || false}
                onChange={(value) => onChange(field.name, value)}
                onBlur={() => onBlur(field.name)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function EntityFormInner<T extends Record<string, unknown>>(
  props: EntityFormProps<T>,
  ref: React.ForwardedRef<EntityFormRef<T>>
) {
  const {
    sections,
    schema,
    initialValues = {} as Partial<T>,
    onSubmit,
    mode = 'create',
    submitText = mode === 'create' ? 'Criar' : 'Salvar',
    onCancel,
    cancelText = 'Cancelar',
    isSubmitting = false,
    id,
    className,
    showCancel = !!onCancel,
    showSubmit = true,
    renderFooter,
    validateOnChange = true,
    validateOnBlur = true,
  } = props;

  // Build default values from fields
  const defaultValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      }
    }
    return { ...defaults, ...initialValues } as T;
  }, [sections, initialValues]);

  // Form hook
  const form = useFormWithValidation<T>({
    initialValues: defaultValues,
    schema,
    onSubmit,
    validateOnChange,
    validateOnBlur,
  });

  const isDisabled = mode === 'view' || isSubmitting;

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getValues: () => form.values as T,
    setValues: (values) => {
      for (const [key, value] of Object.entries(values)) {
        form.setFieldValue(key, value);
      }
    },
    reset: form.reset,
    submit: form.submitForm,
    validate: async () => {
      await form.validateForm();
      return form.isValid;
    },
    getState: () => form,
  }));

  // Handle field change
  const handleFieldChange = useCallback(
    (name: string, value: unknown) => {
      const field = sections
        .flatMap((s) => s.fields)
        .find((f) => f.name === name);
      
      const transformedValue = field?.transform ? field.transform(value) : value;
      form.setFieldValue(name, transformedValue);
    },
    [sections, form]
  );

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        form.submitForm();
      }}
      className={cn('space-y-6', className)}
      noValidate
    >
      {/* Sections */}
      {sections.map((section, index) => (
        <SectionRenderer
          key={index}
          section={section}
          values={form.values}
          errors={form.errors}
          touched={form.touched}
          dirty={form.dirty}
          onChange={handleFieldChange}
          onBlur={form.setFieldTouched}
          disabled={isDisabled}
        />
      ))}

      {/* Footer */}
      {renderFooter ? (
        renderFooter(form)
      ) : (showSubmit || showCancel) && mode !== 'view' ? (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
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
          )}
          {showSubmit && (
            <button
              type="submit"
              disabled={isSubmitting || !form.isValid}
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
              {isSubmitting ? 'Salvando...' : submitText}
            </button>
          )}
        </div>
      ) : null}
    </form>
  );
}

// Forward ref wrapper
export const EntityForm = forwardRef(EntityFormInner) as <T extends Record<string, unknown>>(
  props: EntityFormProps<T> & { ref?: React.ForwardedRef<EntityFormRef<T>> }
) => ReturnType<typeof EntityFormInner>;

export default EntityForm;
