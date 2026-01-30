'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports for Recharts to avoid SSR hydration issues
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), {
  ssr: false,
});

// Mock data for when API is unavailable
const mockOverview = {
  revenue: { value: 45750, changePercent: 12.5, trend: 'up' as const },
  appointments: { total: 234, completed: 189, cancelled: 23, noShow: 12 },
  customers: { total: 156, new: 28, returning: 128 },
  averageTicket: { value: 195.5, changePercent: 5.2, trend: 'up' as const },
};

const mockRevenueData = [
  { date: '2026-01-01', revenue: 12500 },
  { date: '2026-01-08', revenue: 15200 },
  { date: '2026-01-15', revenue: 18900 },
  { date: '2026-01-22', revenue: 22100 },
  { date: '2026-01-29', revenue: 24800 },
];

const mockTopServices = [
  { name: 'Corte Feminino', count: 85, revenue: 12750 },
  { name: 'Coloração', count: 62, revenue: 18600 },
  { name: 'Manicure', count: 120, revenue: 4800 },
  { name: 'Hidratação', count: 45, revenue: 5400 },
  { name: 'Escova', count: 78, revenue: 6240 },
];

const mockTopProfessionals = [
  { id: '1', name: 'Maria Silva', appointments: 45, revenue: 8775, rating: 4.9 },
  { id: '2', name: 'João Santos', appointments: 38, revenue: 7410, rating: 4.8 },
  { id: '3', name: 'Ana Oliveira', appointments: 42, revenue: 6300, rating: 4.7 },
  { id: '4', name: 'Carlos Souza', appointments: 35, revenue: 5425, rating: 4.6 },
  { id: '5', name: 'Paula Costa', appointments: 28, revenue: 4340, rating: 4.8 },
];

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview, error: overviewError } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsService.getOverview(),
    retry: 1,
  });

  const { data: revenueData, error: revenueError } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsService.getRevenueChart(),
    retry: 1,
  });

  const { data: topServices, error: servicesError } = useQuery({
    queryKey: ['analytics', 'topServices'],
    queryFn: () => analyticsService.getTopServices(),
    retry: 1,
  });

  const { data: topProfessionals, error: professionalsError } = useQuery({
    queryKey: ['analytics', 'topProfessionals'],
    queryFn: () => analyticsService.getTopProfessionals(),
    retry: 1,
  });

  // Use mock data if API fails
  const displayOverview = overviewError ? mockOverview : overview;
  const displayRevenueData = revenueError ? mockRevenueData : revenueData;
  const displayTopServices = servicesError ? mockTopServices : topServices;
  const displayTopProfessionals = professionalsError ? mockTopProfessionals : topProfessionals;

  const stats = [
    {
      name: 'Receita do Mês',
      value: displayOverview ? formatCurrency(displayOverview.revenue.value) : '-',
      change: displayOverview?.revenue.changePercent || 0,
      trend: displayOverview?.revenue.trend || 'stable',
      icon: DollarSign,
    },
    {
      name: 'Agendamentos',
      value: displayOverview?.appointments.total || 0,
      change: 0,
      trend: 'stable',
      icon: Calendar,
    },
    {
      name: 'Novos Clientes',
      value: displayOverview?.customers.new || 0,
      change: 0,
      trend: 'stable',
      icon: Users,
    },
    {
      name: 'Ticket Médio',
      value: displayOverview ? formatCurrency(displayOverview.averageTicket.value) : '-',
      change: displayOverview?.averageTicket.changePercent || 0,
      trend: displayOverview?.averageTicket.trend || 'stable',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
        {(overviewError || revenueError) && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ API não disponível - exibindo dados de demonstração
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingOverview && !displayOverview ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                    <span>vs. mês anterior</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {displayRevenueData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })
                      }
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('pt-BR', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString('pt-BR')
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartSkeleton />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Serviços Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {displayTopServices ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayTopServices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'count') return [value, 'Atendimentos'];
                        return [formatCurrency(value), 'Receita'];
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartSkeleton />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Professionals */}
        <Card>
          <CardHeader>
            <CardTitle>Profissionais em Destaque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(displayTopProfessionals || []).slice(0, 5).map((prof, index) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{prof.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {prof.appointments} atendimentos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(prof.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {prof.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointments Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Concluídos</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          displayOverview
                            ? (displayOverview.appointments.completed /
                                displayOverview.appointments.total) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {displayOverview?.appointments.completed || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelados</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{
                        width: `${
                          displayOverview
                            ? (displayOverview.appointments.cancelled /
                                displayOverview.appointments.total) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {displayOverview?.appointments.cancelled || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">No-show</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{
                        width: `${
                          displayOverview
                            ? (displayOverview.appointments.noShow /
                                displayOverview.appointments.total) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {displayOverview?.appointments.noShow || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
