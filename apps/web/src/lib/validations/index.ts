/**
 * GLAMO - Validation Utilities
 * Helper functions for validation with Zod
 * 
 * @version 1.0.0
 * @description Utilities for form validation, error handling
 */

import { z, ZodError, ZodSchema } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

/** Validation result */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  fieldErrors?: Record<string, string>;
}

/** Validation error */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/** Field-level validation state */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate data against a Zod schema
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      return {
        success: false,
        errors,
        fieldErrors,
      };
    }
    throw error;
  }
}

/**
 * Safe validation that returns null on error
 */
export function validateSafe<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate a single field
 */
export function validateField<T>(
  schema: ZodSchema<T>,
  field: keyof T,
  value: unknown
): { isValid: boolean; error?: string } {
  try {
    const partialSchema = (schema as z.ZodObject<any>).pick({ [field]: true });
    partialSchema.parse({ [field]: value });
    return { isValid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message,
      };
    }
    throw error;
  }
}

/**
 * Create async validator for use with forms
 */
export function createAsyncValidator<T>(schema: ZodSchema<T>) {
  return async (data: unknown): Promise<ValidationResult<T>> => {
    return validate(schema, data);
  };
}

// ============================================================================
// ERROR FORMATTERS
// ============================================================================

/**
 * Format Zod errors to flat object for forms
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  
  return errors;
}

/**
 * Format Zod errors to array
 */
export function zodErrorsToArray(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Get first error message for a field
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  if (!errors) return undefined;
  return errors[field];
}

/**
 * Check if field has error
 */
export function hasFieldError(
  errors: Record<string, string> | undefined,
  field: string
): boolean {
  return !!errors?.[field];
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Create form resolver for react-hook-form with Zod
 */
export function createZodResolver<T>(schema: ZodSchema<T>) {
  return async (data: unknown) => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    
    const errors: Record<string, { type: string; message: string }> = {};
    
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    });
    
    return { values: {}, errors };
  };
}

/**
 * Transform form data before validation
 */
export function transformFormData<T extends Record<string, unknown>>(
  data: T,
  transforms: Partial<Record<keyof T, (value: unknown) => unknown>>
): T {
  const result = { ...data };
  
  Object.entries(transforms).forEach(([key, transform]) => {
    if (transform && key in result) {
      (result as Record<string, unknown>)[key] = transform(result[key as keyof T]);
    }
  });
  
  return result;
}

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

/**
 * Make all fields of a schema optional
 */
export function makeOptional<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{
  [K in keyof T]: z.ZodOptional<T[K]>;
}> {
  return schema.partial() as any;
}

/**
 * Pick specific fields from a schema
 */
export function pickFields<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
): z.ZodObject<Pick<T, K>> {
  const shape: Partial<T> = {};
  keys.forEach((key) => {
    shape[key] = schema.shape[key];
  });
  return z.object(shape as Pick<T, K>);
}

/**
 * Omit specific fields from a schema
 */
export function omitFields<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
): z.ZodObject<Omit<T, K>> {
  const shape = { ...schema.shape };
  keys.forEach((key) => {
    delete shape[key];
  });
  return z.object(shape as Omit<T, K>);
}

/**
 * Merge two schemas
 */
export function mergeSchemas<A extends z.ZodRawShape, B extends z.ZodRawShape>(
  schemaA: z.ZodObject<A>,
  schemaB: z.ZodObject<B>
): z.ZodObject<A & B> {
  return schemaA.merge(schemaB);
}

/**
 * Extend a schema with additional fields
 */
export function extendSchema<T extends z.ZodRawShape, U extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  extension: U
): z.ZodObject<T & U> {
  return schema.extend(extension);
}

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Validate that at least one field is filled
 */
export function atLeastOneOf<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  fields: (keyof T)[],
  message = 'Pelo menos um campo deve ser preenchido'
): z.ZodObject<T> {
  return schema.refine(
    (data) => fields.some((field) => {
      const value = (data as Record<string, unknown>)[field as string];
      return value !== undefined && value !== null && value !== '';
    }),
    { message }
  ) as unknown as z.ZodObject<T>;
}

/**
 * Validate conditional required field
 */
export function conditionalRequired<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  field: keyof T,
  condition: (data: z.infer<z.ZodObject<T>>) => boolean,
  message = 'Este campo é obrigatório'
): z.ZodObject<T> {
  return schema.refine(
    (data) => {
      if (!condition(data)) return true;
      const value = (data as Record<string, unknown>)[field as string];
      return value !== undefined && value !== null && value !== '';
    },
    { message, path: [field as string] }
  ) as unknown as z.ZodObject<T>;
}

/**
 * Validate that end date is after start date
 */
export function dateRangeValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  startField: keyof T,
  endField: keyof T,
  message = 'Data final deve ser posterior à data inicial'
): z.ZodObject<T> {
  return schema.refine(
    (data) => {
      const start = (data as Record<string, unknown>)[startField as string] as string | undefined;
      const end = (data as Record<string, unknown>)[endField as string] as string | undefined;
      
      if (!start || !end) return true;
      return new Date(end) >= new Date(start);
    },
    { message, path: [endField as string] }
  ) as unknown as z.ZodObject<T>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './schemas';
