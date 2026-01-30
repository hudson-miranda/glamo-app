'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Home,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Scissors,
  PieChart,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Relatórios</span>
    </nav>
  );
}

export default function ReportsPage() {
  // Mock data
  const quickStats = [
    { label: 'Receita Total', value: 'R$ 45.680', change: '+12.5%', positive: true, icon: DollarSign },
    { label: 'Agendamentos', value: '486', change: '+8.3%', positive: true, icon: Calendar },
    { label: 'Novos Clientes', value: '42', change: '+15.2%', positive: true, icon: Users },
    { label: 'Taxa de Ocupação', value: '78%', change: '-2.1%', positive: false, icon: Clock },
  ];

  const reports = [
    {
      title: 'Desempenho Geral',
      description: 'Visão completa do desempenho do salão',
      icon: BarChart3,
      href: '/dashboard/reports/analytics',
      color: 'purple',
    },
    {
      title: 'Receita por Período',
      description: 'Análise financeira detalhada',
      icon: DollarSign,
      href: '/dashboard/financial/reports',
      color: 'green',
    },
    {
      title: 'Serviços Mais Populares',
      description: 'Ranking dos serviços mais procurados',
      icon: Scissors,
      href: '/dashboard/reports/analytics?tab=services',
      color: 'pink',
    },
    {
      title: 'Performance da Equipe',
      description: 'Avaliação por profissional',
      icon: Users,
      href: '/dashboard/reports/analytics?tab=team',
      color: 'blue',
    },
    {
      title: 'Retenção de Clientes',
      description: 'Taxa de retorno e fidelização',
      icon: TrendingUp,
      href: '/dashboard/reports/analytics?tab=customers',
      color: 'yellow',
    },
    {
      title: 'Ocupação de Agenda',
      description: 'Horários de pico e disponibilidade',
      icon: Calendar,
      href: '/dashboard/reports/analytics?tab=schedule',
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Análises e métricas do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Link href="/dashboard/reports/analytics">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-1 text-sm ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.positive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <stat.icon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, index) => {
          const colors = getColorClasses(report.color);
          return (
            <Link key={index} href={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${colors.bg} rounded-lg`}>
                      <report.icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Receita Mensal
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              {/* Chart placeholder */}
              <div className="flex items-end gap-2 h-40">
                {[40, 65, 50, 80, 70, 95].map((height, i) => (
                  <div
                    key={i}
                    className="w-12 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-500">
              <span>Ago</span>
              <span>Set</span>
              <span>Out</span>
              <span>Nov</span>
              <span>Dez</span>
              <span>Jan</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Receita por Categoria
            </CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {/* Pie chart placeholder */}
              <div className="relative w-40 h-40">
                <div className="w-full h-full rounded-full" style={{
                  background: 'conic-gradient(#9333ea 0% 40%, #ec4899 40% 65%, #06b6d4 65% 85%, #f59e0b 85% 100%)'
                }} />
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">100%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <span className="text-sm">Cabelo (40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-sm">Unhas (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-sm">Estética (20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">Outros (15%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Rápidos</CardTitle>
          <CardDescription>Destaques do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Melhor dia da semana</p>
              <p className="text-2xl font-bold text-green-600 mt-1">Sábado</p>
              <p className="text-xs text-green-700 mt-1">R$ 8.500 em média</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-800">Serviço mais lucrativo</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">Coloração</p>
              <p className="text-xs text-purple-700 mt-1">R$ 12.400 no mês</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-medium text-pink-800">Profissional destaque</p>
              <p className="text-2xl font-bold text-pink-600 mt-1">Ana Costa</p>
              <p className="text-xs text-pink-700 mt-1">120 atendimentos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
