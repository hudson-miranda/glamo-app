'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-xl border-0 rounded-2xl backdrop-blur-sm',
          title: 'font-semibold text-sm',
          description: 'text-sm opacity-90',
          actionButton: 'bg-ruby-600 text-white rounded-lg px-4 py-2 font-medium',
          cancelButton: 'bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 font-medium',
          closeButton: 'bg-gray-100 dark:bg-gray-800 border-0 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700',
        },
        duration: 4000,
      }}
    />
  );
}

// Custom toast functions with icons
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, {
      description,
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    }),

  error: (message: string, description?: string) =>
    sonnerToast.error(message, {
      description,
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    }),

  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, {
      description,
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
    }),

  info: (message: string, description?: string) =>
    sonnerToast.info(message, {
      description,
      icon: <Info className="w-5 h-5 text-blue-500" />,
    }),

  loading: (message: string) =>
    sonnerToast.loading(message, {
      icon: <Loader2 className="w-5 h-5 text-ruby-500 animate-spin" />,
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) =>
    sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    }),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
