'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Home,
  Settings,
  User,
  Users,
  Bell,
  Link as LinkIcon,
  CreditCard,
  Building2,
  Shield,
  Palette,
  Globe,
  Key,
  Webhook,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Configurações</span>
    </nav>
  );
}

export default function SettingsPage() {
  const settingsGroups = [
    {
      title: 'Conta',
      items: [
        {
          title: 'Dados do Salão',
          description: 'Nome, endereço e informações gerais',
          icon: Building2,
          href: '/dashboard/settings/general',
        },
        {
          title: 'Meu Perfil',
          description: 'Dados pessoais e senha',
          icon: User,
          href: '/dashboard/settings/profile',
        },
        {
          title: 'Usuários',
          description: 'Gerenciar acessos e permissões',
          icon: Users,
          href: '/dashboard/settings/users',
          badge: '3 usuários',
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          title: 'Notificações',
          description: 'Configurar alertas e lembretes',
          icon: Bell,
          href: '/dashboard/settings/notifications',
        },
        {
          title: 'Integrações',
          description: 'Conectar com outros serviços',
          icon: LinkIcon,
          href: '/dashboard/settings/integrations',
          badge: '2 ativas',
        },
        {
          title: 'API & Webhooks',
          description: 'Chaves de API e integrações',
          icon: Key,
          href: '/dashboard/settings/api',
        },
      ],
    },
    {
      title: 'Faturamento',
      items: [
        {
          title: 'Assinatura',
          description: 'Plano e faturamento',
          icon: CreditCard,
          href: '/dashboard/settings/billing',
          badge: 'Pro',
        },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie as configurações do seu salão</p>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">{group.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {group.items.map((item, itemIndex) => (
              <Link key={itemIndex} href={item.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <item.icon className="h-5 w-5 text-purple-600" />
                      </div>
                      {item.badge && (
                        <Badge variant="outline">{item.badge}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Plano Atual</p>
              <p className="text-lg font-semibold">Glamo Pro</p>
              <p className="text-xs text-gray-500 mt-1">Renovação em 15/02/2026</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Último Login</p>
              <p className="text-lg font-semibold">Hoje, 08:30</p>
              <p className="text-xs text-gray-500 mt-1">IP: 189.xxx.xxx.xx</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Versão do Sistema</p>
              <p className="text-lg font-semibold">v2.5.0</p>
              <p className="text-xs text-green-600 mt-1">✓ Atualizado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Exportar todos os dados</p>
              <p className="text-sm text-red-600">Baixe uma cópia de todos os seus dados</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Exportar
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Excluir conta</p>
              <p className="text-sm text-red-600">Esta ação é permanente e não pode ser desfeita</p>
            </div>
            <Button variant="destructive">
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
