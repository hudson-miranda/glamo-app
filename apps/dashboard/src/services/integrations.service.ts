import api from '@/lib/api';

export interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'calendar' | 'messaging' | 'crm' | 'accounting' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  type: string;
  provider: string;
  icon: string;
  isConnected: boolean;
  requiredFields: {
    name: string;
    type: 'text' | 'password' | 'select';
    label: string;
    required: boolean;
    options?: { value: string; label: string }[];
  }[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  responseStatus?: number;
  responseBody?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
}

export const integrationsService = {
  // Integrations
  async list(): Promise<Integration[]> {
    const response = await api.get<{ data: Integration[] }>('/integrations');
    return response.data.data;
  },

  async getAvailable(): Promise<AvailableIntegration[]> {
    const response = await api.get<{ data: AvailableIntegration[] }>('/integrations/available');
    return response.data.data;
  },

  async connect(provider: string, config: Record<string, any>): Promise<Integration> {
    const response = await api.post<Integration>('/integrations/connect', { provider, config });
    return response.data;
  },

  async disconnect(id: string): Promise<void> {
    await api.delete(`/integrations/${id}`);
  },

  async sync(id: string): Promise<void> {
    await api.post(`/integrations/${id}/sync`);
  },

  async updateConfig(id: string, config: Record<string, any>): Promise<Integration> {
    const response = await api.patch<Integration>(`/integrations/${id}`, { config });
    return response.data;
  },

  // API Keys
  async listApiKeys(): Promise<ApiKey[]> {
    const response = await api.get<{ data: ApiKey[] }>('/integrations/api-keys');
    return response.data.data;
  },

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey & { fullKey: string }> {
    const response = await api.post<ApiKey & { fullKey: string }>('/integrations/api-keys', data);
    return response.data;
  },

  async revokeApiKey(id: string): Promise<void> {
    await api.delete(`/integrations/api-keys/${id}`);
  },

  // Webhooks
  async listWebhooks(): Promise<Webhook[]> {
    const response = await api.get<{ data: Webhook[] }>('/integrations/webhooks');
    return response.data.data;
  },

  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    const response = await api.post<Webhook>('/integrations/webhooks', data);
    return response.data;
  },

  async updateWebhook(id: string, data: Partial<CreateWebhookRequest>): Promise<Webhook> {
    const response = await api.patch<Webhook>(`/integrations/webhooks/${id}`, data);
    return response.data;
  },

  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/integrations/webhooks/${id}`);
  },

  async testWebhook(id: string): Promise<{ success: boolean; response?: any }> {
    const response = await api.post<{ success: boolean; response?: any }>(`/integrations/webhooks/${id}/test`);
    return response.data;
  },

  async getWebhookEvents(id: string): Promise<WebhookEvent[]> {
    const response = await api.get<{ data: WebhookEvent[] }>(`/integrations/webhooks/${id}/events`);
    return response.data.data;
  },
};
