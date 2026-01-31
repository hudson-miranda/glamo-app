'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores';
import { usePageData } from '@/hooks';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  SkeletonDashboard,
  AnimatedCard,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

// Interface local para overview analytics
interface AnalyticsOverview {
  revenue: { value: number; previousValue: number; change: number; changePercent: number; trend: 'up' | 'down' | 'stable' };
  appointments: { total: number; completed: number; cancelled: number; noShow: number };
  customers: { total: number; new: number; returning: number };
  averageTicket: { value: number; previousValue: number; change: number; changePercent: number; trend: 'up' | 'down' | 'stable' };
}

// Mock data for demonstration
const mockOverview: AnalyticsOverview = {
  revenue: { value: 45750, previousValue: 40680, change: 5070, changePercent: 12.5, trend: 'up' },
  appointments: { total: 234, completed: 189, cancelled: 23, noShow: 12 },
  customers: { total: 156, new: 28, returning: 128 },
  averageTicket: { value: 195.5, previousValue: 185.8, change: 9.7, changePercent: 5.2, trend: 'up' },
};

// Simula fetch de dados - substituir por chamada real à API
const fetchDashboardData = async (): Promise<AnalyticsOverview> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockOverview;
};

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();
  
  const { data: overview, isLoading } = usePageData(
    fetchDashboardData,
    { cacheKey: 'dashboard-overview', initialData: mockOverview }
  );

  const stats = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(overview?.revenue.value || 0),
      change: `${overview?.revenue.changePercent || 0}%`,
      trend: overview?.revenue.trend || 'stable',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Agendamentos',
      value: overview?.appointments.total.toString() || '0',
      change: `${overview?.appointments.completed || 0} concluídos`,
      trend: 'up' as const,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Clientes',
      value: overview?.customers.total.toString() || '0',
      change: `+${overview?.customers.new || 0} novos`,
      trend: 'up' as const,
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(overview?.averageTicket.value || 0),
      change: `${overview?.averageTicket.changePercent || 0}%`,
      trend: overview?.averageTicket.trend || 'stable',
      icon: TrendingUp,
      color: 'text-ruby-600 dark:text-ruby-400',
      bg: 'bg-ruby-50 dark:bg-ruby-950/30',
    },
  ];

  const quickActions = [
    { label: 'Novo Agendamento', icon: Calendar, href: '/appointments/new', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
    { label: 'Novo Cliente', icon: Users, href: '/customers/new', color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' },
    { label: 'Nova Transação', icon: DollarSign, href: '/financial/transactions', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
  ];

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-950/30">
            <LayoutDashboard className="w-5 h-5 text-ruby-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Olá, {user?.firstName || 'Usuário'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tenant?.name || 'Seu negócio'} • Visão geral
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StaggerItem key={stat.title}>
            <AnimatedCard>
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg} w-fit`}>
                      <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.title}</p>
                    </div>
                    <div className="flex items-center pt-2 border-t border-gray-100/80 dark:border-gray-800/40">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                      ) : stat.trend === 'down' ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-500 mr-1" />
                      ) : null}
                      <span className={`text-xs font-medium ${
                        stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
                        stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium" style={{ letterSpacing: '-0.01em' }}>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <motion.a
                  key={action.label}
                  href={action.href}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100/80 dark:border-gray-800/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 group"
                >
                  <div className={`p-2.5 rounded-xl ${action.color} transition-transform duration-300 group-hover:scale-105`}>
                    <action.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base font-medium" style={{ letterSpacing: '-0.01em' }}>
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-3">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Nenhum agendamento para hoje
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Os próximos agendamentos aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
