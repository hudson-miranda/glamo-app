import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';

export const settingsKeys = {
  all: ['settings'] as const,
  tenant: () => [...settingsKeys.all, 'tenant'] as const,
  workingHours: () => [...settingsKeys.all, 'working-hours'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  appearance: () => [...settingsKeys.all, 'appearance'] as const,
  billing: () => [...settingsKeys.all, 'billing'] as const,
  subscription: () => [...settingsKeys.all, 'subscription'] as const,
  invoices: () => [...settingsKeys.all, 'invoices'] as const,
};

// Tenant Settings
export function useTenantSettings() {
  return useQuery({
    queryKey: settingsKeys.tenant(),
    queryFn: () => settingsService.getTenantSettings(),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsService.updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
    },
  });
}

// Working Hours
export function useWorkingHours() {
  return useQuery({
    queryKey: settingsKeys.workingHours(),
    queryFn: () => settingsService.getWorkingHours(),
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsService.updateWorkingHours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workingHours() });
    },
  });
}

// Notification Settings
export function useNotificationSettings() {
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => settingsService.getNotificationSettings(),
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsService.updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
    },
  });
}

// Appearance Settings
export function useAppearanceSettings() {
  return useQuery({
    queryKey: settingsKeys.appearance(),
    queryFn: () => settingsService.getAppearanceSettings(),
  });
}

export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsService.updateAppearanceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.appearance() });
    },
  });
}

// Billing & Subscription
export function useSubscription() {
  return useQuery({
    queryKey: settingsKeys.subscription(),
    queryFn: () => settingsService.getSubscription(),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: settingsKeys.invoices(),
    queryFn: () => settingsService.getInvoices(),
  });
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => settingsService.upgradeSubscription(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.subscription() });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.subscription() });
    },
  });
}
