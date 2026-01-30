'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Scissors,
  PieChart,
  BarChart3,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/financial" className="hover:text-gray-700">
        Financeiro
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Relatórios</span>
    </nav>
  );
}

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState('month');

  // Mock data
  const reports = [
    {
      title: 'Receita por Serviço',
      description: 'Faturamento detalhado por tipo de serviço',
      icon: Scissors,
      value: 'R$ 45.680,00',
    },
    {
      title: 'Receita por Profissional',
      description: 'Performance financeira da equipe',
      icon: Users,
      value: 'R$ 45.680,00',
    },
    {
      title: 'Formas de Pagamento',
      description: 'Distribuição por método de pagamento',
      icon: DollarSign,
      value: '5 métodos',
    },
    {
      title: 'Tendência de Vendas',
      description: 'Evolução do faturamento ao longo do tempo',
      icon: TrendingUp,
      value: '+12.5%',
    },
  ];

  const topServices = [
    { name: 'Corte Feminino', revenue: 12400, count: 155, percentage: 27 },
    { name: 'Coloração', revenue: 10200, count: 51, percentage: 22 },
    { name: 'Escova', revenue: 8100, count: 135, percentage: 18 },
    { name: 'Corte Masculino', revenue: 6500, count: 130, percentage: 14 },
    { name: 'Mechas', revenue: 5480, count: 22, percentage: 12 },
  ];

  const topProfessionals = [
    { name: 'Ana Costa', revenue: 18500, appointments: 120, commission: 7400 },
    { name: 'Fernanda Souza', revenue: 14200, appointments: 85, commission: 6390 },
    { name: 'Carlos Lima', revenue: 8500, appointments: 110, commission: 2975 },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/financial">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
            <p className="text-gray-500 mt-1">Análises detalhadas do seu negócio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <report.icon className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="outline">{report.value}</Badge>
              </div>
              <h3 className="font-semibold mt-4">{report.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Por Serviço</TabsTrigger>
          <TabsTrigger value="professionals">Por Profissional</TabsTrigger>
          <TabsTrigger value="payments">Por Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Top Serviços por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-purple-600 font-semibold">
                          R$ {service.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{service.percentage}%</span>
                      </div>
                      <p className="text-sm text-gray-500">{service.count} atendimentos</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Gráfico de Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico será implementado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="professionals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Profissional</CardTitle>
              <CardDescription>Receita e comissões da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topProfessionals.map((professional, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{professional.name}</h3>
                        <p className="text-sm text-gray-500">
                          {professional.appointments} atendimentos
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        R$ {professional.revenue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Receita Gerada</p>
                        <p className="font-semibold">R$ {professional.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Comissão</p>
                        <p className="font-semibold text-green-600">
                          R$ {professional.commission.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Dinheiro</p>
                  <p className="text-2xl font-bold">R$ 12.500</p>
                  <p className="text-sm text-gray-500">27%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Cartão Crédito</p>
                  <p className="text-2xl font-bold">R$ 18.200</p>
                  <p className="text-sm text-gray-500">40%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Cartão Débito</p>
                  <p className="text-2xl font-bold">R$ 8.500</p>
                  <p className="text-sm text-gray-500">19%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">PIX</p>
                  <p className="text-2xl font-bold">R$ 6.480</p>
                  <p className="text-sm text-gray-500">14%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
