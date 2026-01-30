import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  integrationsService,
  CreateApiKeyRequest,
  CreateWebhookRequest,
} from '@/services/integrations.service';

export const integrationKeys = {
  all: ['integrations'] as const,
  list: () => [...integrationKeys.all, 'list'] as const,
  available: () => [...integrationKeys.all, 'available'] as const,
  apiKeys: () => [...integrationKeys.all, 'api-keys'] as const,
  webhooks: () => [...integrationKeys.all, 'webhooks'] as const,
  webhookEvents: (id: string) => [...integrationKeys.webhooks(), id, 'events'] as const,
};

// Integrations
export function useIntegrations() {
  return useQuery({
    queryKey: integrationKeys.list(),
    queryFn: () => integrationsService.list(),
  });
}

export function useAvailableIntegrations() {
  return useQuery({
    queryKey: integrationKeys.available(),
    queryFn: () => integrationsService.getAvailable(),
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, config }: { provider: string; config: Record<string, any> }) =>
      integrationsService.connect(provider, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list() });
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list() });
    },
  });
}

// API Keys
export function useApiKeys() {
  return useQuery({
    queryKey: integrationKeys.apiKeys(),
    queryFn: () => integrationsService.listApiKeys(),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => integrationsService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.apiKeys() });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.apiKeys() });
    },
  });
}

// Webhooks
export function useWebhooks() {
  return useQuery({
    queryKey: integrationKeys.webhooks(),
    queryFn: () => integrationsService.listWebhooks(),
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => integrationsService.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.webhooks() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebhookRequest> }) =>
      integrationsService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.webhooks() });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.webhooks() });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => integrationsService.testWebhook(id),
  });
}

export function useWebhookEvents(id: string) {
  return useQuery({
    queryKey: integrationKeys.webhookEvents(id),
    queryFn: () => integrationsService.getWebhookEvents(id),
    enabled: !!id,
  });
}
