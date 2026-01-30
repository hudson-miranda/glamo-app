'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Link as LinkIcon,
  Calendar,
  CreditCard,
  MessageSquare,
  Instagram,
  Facebook,
  Mail,
  Smartphone,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/settings" className="hover:text-gray-700">
        Configurações
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Integrações</span>
    </nav>
  );
}

export default function IntegrationsSettingsPage() {
  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sincronize agendamentos com seu Google Calendar',
      icon: Calendar,
      category: 'Calendário',
      connected: true,
      status: 'Sincronizado',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Processe pagamentos online de forma segura',
      icon: CreditCard,
      category: 'Pagamentos',
      connected: true,
      status: 'Ativo',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Envie lembretes e confirmações via WhatsApp',
      icon: MessageSquare,
      category: 'Comunicação',
      connected: false,
      status: null,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Botão de agendamento no seu perfil',
      icon: Instagram,
      category: 'Redes Sociais',
      connected: false,
      status: null,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Integração com página do Facebook',
      icon: Facebook,
      category: 'Redes Sociais',
      connected: false,
      status: null,
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Campanhas de e-mail marketing',
      icon: Mail,
      category: 'Marketing',
      connected: false,
      status: null,
    },
  ];

  const categories = ['Todos', 'Calendário', 'Pagamentos', 'Comunicação', 'Redes Sociais', 'Marketing'];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
            <p className="text-gray-500 mt-1">Conecte com outros serviços</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.connected).length}
                </p>
                <p className="text-sm text-gray-500">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => !i.connected).length}
                </p>
                <p className="text-sm text-gray-500">Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <LinkIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integrações Conectadas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.filter(i => i.connected).map((integration) => (
            <Card key={integration.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <integration.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          {integration.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Switch checked={true} />
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integrações Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.filter(i => !i.connected).map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gray-100 rounded-lg mb-4">
                    <integration.icon className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <Badge variant="outline" className="my-2">{integration.category}</Badge>
                  <p className="text-sm text-gray-500 mb-4">{integration.description}</p>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle>API do Glamo</CardTitle>
          <CardDescription>
            Acesse nossa API para criar integrações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Documentação da API</p>
              <p className="text-sm text-gray-500">Consulte nossa documentação completa</p>
            </div>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Documentação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
