'use client';

import { useState } from 'react';
import {
  Key,
  Webhook,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface ApiKeyType {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
  status: string;
}

interface WebhookType {
  id: string;
  url: string;
  events: string[];
  status: string;
  createdAt: Date;
  lastDelivery: { status: string; timestamp: Date } | null;
}

// Mock API Keys
const mockApiKeys: ApiKeyType[] = [
  {
    id: '1',
    name: 'Integração Website',
    key: 'glamo_live_sk_1234567890abcdef',
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date('2024-01-28'),
    status: 'active',
  },
  {
    id: '2',
    name: 'App Mobile',
    key: 'glamo_live_sk_0987654321fedcba',
    createdAt: new Date('2024-01-10'),
    lastUsed: new Date('2024-01-27'),
    status: 'active',
  },
];

// Mock Webhooks
const mockWebhooks: WebhookType[] = [
  {
    id: '1',
    url: 'https://meusite.com/webhooks/glamo',
    events: ['appointment.created', 'appointment.updated', 'appointment.cancelled'],
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastDelivery: {
      status: 'success',
      timestamp: new Date('2024-01-28T10:30:00'),
    },
  },
  {
    id: '2',
    url: 'https://api.erp.com/glamo-webhook',
    events: ['payment.received', 'payment.refunded'],
    status: 'active',
    createdAt: new Date('2024-01-20'),
    lastDelivery: {
      status: 'failed',
      timestamp: new Date('2024-01-28T09:15:00'),
    },
  },
];

const webhookEvents = [
  { category: 'Agendamentos', events: ['appointment.created', 'appointment.updated', 'appointment.cancelled', 'appointment.completed'] },
  { category: 'Pagamentos', events: ['payment.received', 'payment.refunded', 'payment.failed'] },
  { category: 'Clientes', events: ['customer.created', 'customer.updated', 'customer.deleted'] },
  { category: 'Profissionais', events: ['professional.created', 'professional.updated'] },
];

export default function ApiPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyType[]>(mockApiKeys);
  const [webhooks, setWebhooks] = useState<WebhookType[]>(mockWebhooks);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newWebhookDialog, setNewWebhookDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const createApiKey = () => {
    const newKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: `glamo_live_sk_${Math.random().toString(36).substring(2, 18)}`,
      createdAt: new Date(),
      lastUsed: null,
      status: 'active',
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyDialog(false);
    setNewKeyName('');
    toast.success('API Key criada com sucesso');
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast.success('API Key revogada');
  };

  const createWebhook = () => {
    const newWebhook = {
      id: String(Date.now()),
      url: newWebhookUrl,
      events: newWebhookEvents,
      status: 'active',
      createdAt: new Date(),
      lastDelivery: null,
    };
    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookDialog(false);
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
    toast.success('Webhook criado com sucesso');
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success('Webhook removido');
  };

  const testWebhook = (id: string) => {
    toast.info('Enviando teste...');
    setTimeout(() => {
      toast.success('Webhook de teste enviado com sucesso');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">API & Webhooks</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas chaves de API e configure webhooks para integrações
        </p>
      </div>

      {/* Docs Link */}
      <Card className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-purple-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Documentação da API</p>
              <p className="text-sm text-muted-foreground">
                Consulte nossa documentação completa para integrar com o Glamo
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="https://docs.glamo.com.br/api" target="_blank" rel="noopener noreferrer">
              Ver Documentação
            </a>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Chaves de API</h2>
              <p className="text-sm text-muted-foreground">
                Use chaves de API para autenticar requisições à nossa API
              </p>
            </div>
            <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Dê um nome para identificar esta chave de API
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Nome da Chave</Label>
                    <Input
                      id="keyName"
                      placeholder="Ex: Integração Website"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewKeyDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createApiKey} disabled={!newKeyName}>
                    Criar Chave
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Key className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma API Key criada</p>
                  <Button onClick={() => setNewKeyDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Chave
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{apiKey.name}</p>
                          <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                            {apiKey.status === 'active' ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {showKey === apiKey.id
                              ? apiKey.key
                              : apiKey.key.substring(0, 20) + '••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showKey === apiKey.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Criada em {apiKey.createdAt.toLocaleDateString('pt-BR')}
                          {apiKey.lastUsed && ` • Último uso: ${apiKey.lastUsed.toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteApiKey(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Mantenha suas chaves seguras</p>
              <p className="text-sm text-amber-700">
                Nunca compartilhe suas chaves de API publicamente. Use variáveis de ambiente
                para armazená-las em seus projetos.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Webhooks</h2>
              <p className="text-sm text-muted-foreground">
                Receba notificações em tempo real sobre eventos no Glamo
              </p>
            </div>
            <Dialog open={newWebhookDialog} onOpenChange={setNewWebhookDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Novo Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a URL e os eventos que você deseja receber
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL do Webhook</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://seu-site.com/webhooks/glamo"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eventos</Label>
                    <div className="border rounded-lg p-4 space-y-4 max-h-60 overflow-y-auto">
                      {webhookEvents.map((category) => (
                        <div key={category.category}>
                          <p className="text-sm font-medium mb-2">{category.category}</p>
                          <div className="space-y-2">
                            {category.events.map((event) => (
                              <label key={event} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={newWebhookEvents.includes(event)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewWebhookEvents([...newWebhookEvents, event]);
                                    } else {
                                      setNewWebhookEvents(newWebhookEvents.filter(e => e !== event));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {event}
                                </code>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewWebhookDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={createWebhook}
                    disabled={!newWebhookUrl || newWebhookEvents.length === 0}
                  >
                    Criar Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Webhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum webhook configurado</p>
                  <Button onClick={() => setNewWebhookDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Webhook
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{webhook.url}</code>
                            <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                              {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => testWebhook(webhook.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Enviar Teste
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteWebhook(webhook.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {webhook.lastDelivery && (
                        <div className="flex items-center gap-2 text-sm">
                          {webhook.lastDelivery.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-muted-foreground">
                            Última entrega: {webhook.lastDelivery.timestamp.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
