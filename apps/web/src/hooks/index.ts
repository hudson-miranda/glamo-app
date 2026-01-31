/**
 * GLAMO - Custom Hooks Index
 * Central export for all custom hooks
 * 
 * @version 1.0.0
 * @description Reusable hooks for the platform
 */

// Async Data Hooks
export { useAsyncData, usePageData, usePageLoading, clearDataCache } from './use-async-data';

// Form & Validation Hooks
export * from './useFormWithValidation';
export * from './useFieldValidation';

// Data Hooks
export * from './usePagination';
export * from './useDebounce';
export * from './useOptimisticUpdate';
export * from './useEntityRelations';

// UI Hooks
export * from './useModal';
export * from './useConfirmDialog';
export * from './useToast';

// Utility Hooks
export * from './useLocalStorage';
export * from './usePrevious';
