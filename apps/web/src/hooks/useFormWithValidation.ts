/**
 * GLAMO - useFormWithValidation Hook
 * Form management with Zod validation integration
 * 
 * @version 1.0.0
 * @description Complete form state management with validation
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZodSchema, ZodError } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
}

export interface FormConfig<T extends Record<string, unknown>> {
  initialValues: T;
  schema: ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
  resetOnSubmit?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
  onError?: (errors: Partial<Record<keyof T, string>>) => void;
  onSuccess?: (values: T) => void;
}

export interface FormHelpers<T extends Record<string, unknown>> {
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  setFieldError: <K extends keyof T>(field: K, error?: string) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  resetForm: (values?: T) => void;
  resetField: <K extends keyof T>(field: K) => void;
  submitForm: () => Promise<void>;
}

export interface UseFormReturn<T extends Record<string, unknown>> 
  extends FormState<T>, FormHelpers<T> {
  getFieldProps: <K extends keyof T>(field: K) => {
    name: K;
    value: T[K];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | T[K]) => void;
    onBlur: () => void;
  };
  getFieldMeta: <K extends keyof T>(field: K) => {
    error?: string;
    touched: boolean;
    dirty: boolean;
    isValid: boolean;
  };
  formProps: {
    onSubmit: (e: React.FormEvent) => void;
    noValidate: boolean;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useFormWithValidation<T extends Record<string, unknown>>(
  config: FormConfig<T>
): UseFormReturn<T> {
  const {
    initialValues,
    schema,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    resetOnSubmit = false,
    onSubmit,
    onError,
    onSuccess,
  } = config;

  // Refs
  const initialValuesRef = useRef(initialValues);
  const schemaRef = useRef(schema);

  // State
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Update refs
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  // Validate on mount
  useEffect(() => {
    if (validateOnMount) {
      validateFormInternal(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateFormInternal = useCallback((data: T): boolean => {
    try {
      schemaRef.current.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof T;
          if (!newErrors[field]) {
            newErrors[field] = issue.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
      throw error;
    }
  }, []);

  const validateFieldInternal = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ): boolean => {
    try {
      const partialData = { ...values, [field]: value };
      schemaRef.current.parse(partialData);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.issues.find(
          (issue) => issue.path[0] === field
        );
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError.message,
          }));
          return false;
        }
        // Field is valid, clear its error
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
      throw error;
    }
  }, [values]);

  // ============================================================================
  // FIELD SETTERS
  // ============================================================================

  const setFieldValue = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    
    // Mark as dirty if different from initial
    if (value !== initialValuesRef.current[field]) {
      setDirty((prev) => ({ ...prev, [field]: true }));
    } else {
      setDirty((prev) => ({ ...prev, [field]: false }));
    }

    // Validate on change if enabled
    if (validateOnChange) {
      // Use timeout to ensure state is updated
      setTimeout(() => {
        validateFieldInternal(field, value);
      }, 0);
    }
  }, [validateOnChange, validateFieldInternal]);

  const setFieldTouched = useCallback(<K extends keyof T>(
    field: K,
    isTouched = true
  ) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
    
    if (validateOnBlur && isTouched) {
      validateFieldInternal(field, values[field]);
    }
  }, [validateOnBlur, validateFieldInternal, values]);

  const setFieldError = useCallback(<K extends keyof T>(
    field: K,
    error?: string
  ) => {
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
    
    // Update dirty state for each field
    Object.keys(newValues).forEach((key) => {
      const field = key as keyof T;
      if (newValues[field] !== initialValuesRef.current[field]) {
        setDirty((prev) => ({ ...prev, [field]: true }));
      }
    });
  }, []);

  // ============================================================================
  // FORM HELPERS
  // ============================================================================

  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    return validateFieldInternal(field, values[field]);
  }, [validateFieldInternal, values]);

  const validateForm = useCallback((): boolean => {
    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
    
    return validateFormInternal(values);
  }, [validateFormInternal, values]);

  const resetForm = useCallback((newValues?: T) => {
    const resetValues = newValues ?? initialValuesRef.current;
    setValuesState(resetValues);
    setErrors({});
    setTouched({});
    setDirty({});
    setIsSubmitted(false);
    
    if (newValues) {
      initialValuesRef.current = newValues;
    }
  }, []);

  const resetField = useCallback(<K extends keyof T>(field: K) => {
    setValuesState((prev) => ({
      ...prev,
      [field]: initialValuesRef.current[field],
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setTouched((prev) => ({ ...prev, [field]: false }));
    setDirty((prev) => ({ ...prev, [field]: false }));
  }, []);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitCount((prev) => prev + 1);
    
    const isValid = validateForm();
    
    if (!isValid) {
      setIsSubmitting(false);
      onError?.(errors);
      return;
    }
    
    try {
      await onSubmit?.(values);
      setIsSubmitted(true);
      onSuccess?.(values);
      
      if (resetOnSubmit) {
        resetForm();
      }
    } catch (error) {
      // Re-throw for handling by caller
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, values, onSubmit, onError, onSuccess, resetOnSubmit, resetForm, errors]);

  // ============================================================================
  // FIELD PROPS
  // ============================================================================

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | T[K]) => {
      if (e && typeof e === 'object' && 'target' in e) {
        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' 
          ? (target.checked as unknown as T[K])
          : (target.value as unknown as T[K]);
        setFieldValue(field, value);
      } else {
        setFieldValue(field, e as T[K]);
      }
    },
    onBlur: () => setFieldTouched(field, true),
  }), [values, setFieldValue, setFieldTouched]);

  const getFieldMeta = useCallback(<K extends keyof T>(field: K) => ({
    error: errors[field],
    touched: touched[field] ?? false,
    dirty: dirty[field] ?? false,
    isValid: !errors[field],
  }), [errors, touched, dirty]);

  const formProps = useMemo(() => ({
    onSubmit: (e: React.FormEvent) => {
      e.preventDefault();
      submitForm();
    },
    noValidate: true,
  }), [submitForm]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    isSubmitted,
    submitCount,
    
    // Setters
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setValues,
    setErrors,
    
    // Validation
    validateField,
    validateForm,
    
    // Form helpers
    resetForm,
    resetField,
    submitForm,
    
    // Field helpers
    getFieldProps,
    getFieldMeta,
    formProps,
  };
}

export default useFormWithValidation;
