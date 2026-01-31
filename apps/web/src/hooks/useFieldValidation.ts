/**
 * GLAMO - useFieldValidation Hook
 * Single field validation with Zod
 * 
 * @version 1.0.0
 * @description Real-time field validation with debounce support
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ZodSchema, ZodError } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface FieldValidationState {
  value: string;
  error?: string;
  isValid: boolean;
  isValidating: boolean;
  touched: boolean;
  dirty: boolean;
}

export interface FieldValidationConfig {
  schema: ZodSchema;
  initialValue?: string;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  transform?: (value: string) => unknown;
}

export interface UseFieldValidationReturn extends FieldValidationState {
  setValue: (value: string) => void;
  setTouched: (touched?: boolean) => void;
  validate: () => boolean;
  reset: (value?: string) => void;
  inputProps: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useFieldValidation(
  config: FieldValidationConfig
): UseFieldValidationReturn {
  const {
    schema,
    initialValue = '',
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true,
    transform,
  } = config;

  // Refs
  const initialValueRef = useRef(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const schemaRef = useRef(schema);

  // State
  const [value, setValueState] = useState(initialValue);
  const [error, setError] = useState<string>();
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouchedState] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Update schema ref
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateInternal = useCallback((val: string): boolean => {
    try {
      const valueToValidate = transform ? transform(val) : val;
      schemaRef.current.parse(valueToValidate);
      setError(undefined);
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message);
        return false;
      }
      throw err;
    }
  }, [transform]);

  const validateDebounced = useCallback((val: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsValidating(true);

    debounceTimerRef.current = setTimeout(() => {
      validateInternal(val);
      setIsValidating(false);
    }, debounceMs);
  }, [validateInternal, debounceMs]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    
    // Mark as dirty if different from initial
    if (newValue !== initialValueRef.current) {
      setDirty(true);
    } else {
      setDirty(false);
    }

    // Validate on change if enabled
    if (validateOnChange) {
      validateDebounced(newValue);
    }
  }, [validateOnChange, validateDebounced]);

  const setTouched = useCallback((isTouched = true) => {
    setTouchedState(isTouched);
    
    if (isTouched && validateOnBlur) {
      // Cancel debounce and validate immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsValidating(false);
      validateInternal(value);
    }
  }, [validateOnBlur, validateInternal, value]);

  const validate = useCallback((): boolean => {
    // Cancel debounce and validate immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsValidating(false);
    setTouchedState(true);
    return validateInternal(value);
  }, [validateInternal, value]);

  const reset = useCallback((newValue?: string) => {
    const resetValue = newValue ?? initialValueRef.current;
    setValueState(resetValue);
    setError(undefined);
    setTouchedState(false);
    setDirty(false);
    setIsValidating(false);
    
    if (newValue !== undefined) {
      initialValueRef.current = newValue;
    }

    // Clear any pending validation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // ============================================================================
  // INPUT PROPS
  // ============================================================================

  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    onBlur: () => setTouched(true),
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    value,
    error,
    isValid: !error,
    isValidating,
    touched,
    dirty,
    setValue,
    setTouched,
    validate,
    reset,
    inputProps,
  };
}

// ============================================================================
// COMPOUND FIELD VALIDATION HOOK
// ============================================================================

export interface CompoundFieldConfig {
  [key: string]: FieldValidationConfig;
}

export function useCompoundFieldValidation<T extends CompoundFieldConfig>(
  config: T
): {
  fields: { [K in keyof T]: UseFieldValidationReturn };
  validateAll: () => boolean;
  resetAll: () => void;
  isValid: boolean;
  isDirty: boolean;
  getValues: () => { [K in keyof T]: string };
} {
  const fieldEntries = Object.entries(config) as [keyof T, FieldValidationConfig][];
  
  // Create field hooks dynamically (this is a pattern exception for compound fields)
  const fields = {} as { [K in keyof T]: UseFieldValidationReturn };
  
  fieldEntries.forEach(([key, fieldConfig]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    fields[key] = useFieldValidation(fieldConfig);
  });

  const validateAll = useCallback(() => {
    let allValid = true;
    Object.values(fields).forEach((field) => {
      const valid = (field as UseFieldValidationReturn).validate();
      if (!valid) allValid = false;
    });
    return allValid;
  }, [fields]);

  const resetAll = useCallback(() => {
    Object.values(fields).forEach((field) => {
      (field as UseFieldValidationReturn).reset();
    });
  }, [fields]);

  const isValid = Object.values(fields).every(
    (field) => (field as UseFieldValidationReturn).isValid
  );

  const isDirty = Object.values(fields).some(
    (field) => (field as UseFieldValidationReturn).dirty
  );

  const getValues = useCallback(() => {
    const values = {} as { [K in keyof T]: string };
    Object.entries(fields).forEach(([key, field]) => {
      values[key as keyof T] = (field as UseFieldValidationReturn).value;
    });
    return values;
  }, [fields]);

  return {
    fields,
    validateAll,
    resetAll,
    isValid,
    isDirty,
    getValues,
  };
}

export default useFieldValidation;
