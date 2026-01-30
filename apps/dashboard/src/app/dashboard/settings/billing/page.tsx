'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  CreditCard,
  Check,
  Download,
  Star,
  Zap,
  Users,
  Calendar,
  BarChart3,
  Crown,
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
      <span className="text-gray-900 font-medium">Assinatura</span>
    </nav>
  );
}

export default function BillingSettingsPage() {
  // Mock data
  const currentPlan = {
    name: 'Pro',
    price: 199.90,
    billingCycle: 'monthly',
    nextBilling: '15/02/2026',
    status: 'active',
  };

  const plans = [
    {
      name: 'Starter',
      price: 79.90,
      description: 'Para salões iniciantes',
      features: [
        'Até 2 profissionais',
        '100 agendamentos/mês',
        'Agenda online',
        'Suporte por email',
      ],
      current: false,
    },
    {
      name: 'Pro',
      price: 199.90,
      description: 'Para salões em crescimento',
      features: [
        'Até 10 profissionais',
        'Agendamentos ilimitados',
        'Relatórios avançados',
        'Integrações',
        'Suporte prioritário',
      ],
      current: true,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 499.90,
      description: 'Para grandes redes',
      features: [
        'Profissionais ilimitados',
        'Multi-unidades',
        'API personalizada',
        'Gerente de conta',
        'SLA garantido',
      ],
      current: false,
    },
  ];

  const invoices = [
    { id: 'INV-001', date: '15/01/2026', amount: 199.90, status: 'paid' },
    { id: 'INV-002', date: '15/12/2025', amount: 199.90, status: 'paid' },
    { id: 'INV-003', date: '15/11/2025', amount: 199.90, status: 'paid' },
    { id: 'INV-004', date: '15/10/2025', amount: 199.90, status: 'paid' },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
            <p className="text-gray-500 mt-1">Gerencie seu plano e pagamentos</p>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Plano {currentPlan.name}</h2>
                  <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                </div>
                <p className="text-gray-600">
                  R$ {currentPlan.price.toFixed(2)}/mês • Próxima cobrança: {currentPlan.nextBilling}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Alterar Plano</Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Planos Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.current ? 'border-purple-400 border-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${
                    plan.current
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expira em 12/2027</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Alterar</Button>
            </div>
            <Button variant="outline" className="w-full mt-4">
              + Adicionar Cartão
            </Button>
          </CardContent>
        </Card>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle>Dados de Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Razão Social</p>
              <p className="font-medium">Glamo Beauty Studio LTDA</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CNPJ</p>
              <p className="font-medium">12.345.678/0001-90</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Endereço</p>
              <p className="font-medium">Rua das Flores, 123 - São Paulo, SP</p>
            </div>
            <Button variant="outline" className="w-full">
              Editar Dados
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Suas últimas faturas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">
                      Pago
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
