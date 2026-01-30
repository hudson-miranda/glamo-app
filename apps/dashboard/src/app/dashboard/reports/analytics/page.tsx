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
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Scissors,
  Star,
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
      <Link href="/dashboard/reports" className="hover:text-gray-700">
        Relatórios
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Analytics</span>
    </nav>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');

  // Mock data
  const kpis = [
    { label: 'Receita', value: 'R$ 45.680', change: 12.5, icon: DollarSign, color: 'green' },
    { label: 'Agendamentos', value: '486', change: 8.3, icon: Calendar, color: 'purple' },
    { label: 'Ticket Médio', value: 'R$ 94', change: 3.8, icon: TrendingUp, color: 'blue' },
    { label: 'Taxa de Ocupação', value: '78%', change: -2.1, icon: Clock, color: 'yellow' },
    { label: 'Novos Clientes', value: '42', change: 15.2, icon: Users, color: 'pink' },
    { label: 'Avaliação Média', value: '4.8', change: 0.2, icon: Star, color: 'amber' },
  ];

  const topServices = [
    { name: 'Corte Feminino', count: 155, revenue: 12400, growth: 8 },
    { name: 'Coloração', count: 51, revenue: 10200, growth: 15 },
    { name: 'Escova', count: 135, revenue: 8100, growth: 5 },
    { name: 'Manicure', count: 180, revenue: 5400, growth: -3 },
    { name: 'Mechas', count: 22, revenue: 5280, growth: 20 },
  ];

  const topProfessionals = [
    { name: 'Ana Costa', appointments: 120, revenue: 18500, rating: 4.9 },
    { name: 'Fernanda Souza', appointments: 85, revenue: 14200, rating: 4.8 },
    { name: 'Carlos Lima', appointments: 110, revenue: 8500, rating: 4.7 },
    { name: 'Mariana Santos', appointments: 95, revenue: 9800, rating: 4.9 },
  ];

  const hourlyData = [
    { hour: '08:00', appointments: 12, occupation: 60 },
    { hour: '09:00', appointments: 18, occupation: 90 },
    { hour: '10:00', appointments: 20, occupation: 100 },
    { hour: '11:00', appointments: 16, occupation: 80 },
    { hour: '12:00', appointments: 8, occupation: 40 },
    { hour: '13:00', appointments: 10, occupation: 50 },
    { hour: '14:00', appointments: 18, occupation: 90 },
    { hour: '15:00', appointments: 20, occupation: 100 },
    { hour: '16:00', appointments: 16, occupation: 80 },
    { hour: '17:00', appointments: 14, occupation: 70 },
    { hour: '18:00', appointments: 10, occupation: 50 },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Análise detalhada de desempenho</p>
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
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 text-${kpi.color}-600`} />
                <Badge variant={kpi.change >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="schedule">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
                <CardDescription>Comparativo mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2 justify-around">
                  {[35, 42, 48, 45, 52, 58, 55, 62, 68, 65, 72, 78].map((value, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-6 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                        style={{ height: `${(value / 80) * 200}px` }}
                      />
                      <span className="text-xs text-gray-500">
                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Retenção de Clientes</CardTitle>
                <CardDescription>Taxa de retorno</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-purple-600">72%</div>
                  <p className="text-gray-500 mt-2">clientes retornaram este mês</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clientes que retornam em 30 dias</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clientes que retornam em 60 dias</span>
                    <span className="font-semibold">27%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clientes inativos (+90 dias)</span>
                    <span className="font-semibold text-red-600">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Serviço</CardTitle>
              <CardDescription>Ranking dos serviços mais populares</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Crescimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{service.count}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {service.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          service.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {service.growth >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          <span>{Math.abs(service.growth)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>Métricas por profissional</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Receita Gerada</TableHead>
                    <TableHead>Avaliação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProfessionals.map((professional, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {professional.name.charAt(0)}
                          </div>
                          <span className="font-medium">{professional.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{professional.appointments}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {professional.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{professional.rating}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ocupação por Horário</CardTitle>
              <CardDescription>Média de ocupação ao longo do dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hourlyData.map((data) => (
                  <div key={data.hour} className="flex items-center gap-4">
                    <span className="w-14 text-sm text-gray-500">{data.hour}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          data.occupation >= 80 ? 'bg-green-500' :
                          data.occupation >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${data.occupation}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium text-right">{data.occupation}%</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6 mt-6 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Alto ({'>'}80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Médio (50-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Baixo ({'<'}50%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
