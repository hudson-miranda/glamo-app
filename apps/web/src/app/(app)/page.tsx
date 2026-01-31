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
  Sparkles,
  ChevronRight,
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
  // TODO: Substituir por: const response = await analyticsService.getOverview();
  // Simula latência de rede
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockOverview;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  // Usa hook de dados assíncronos com cache
  const { data: displayOverview, isLoading } = usePageData(
    fetchDashboardData,
    { 
      cacheKey: 'dashboard-overview',
      initialData: mockOverview,
    }
  );

  const stats = [
    {
      name: 'Receita do Mês',
      value: formatCurrency(displayOverview.revenue.value),
      change: displayOverview.revenue.changePercent,
      trend: displayOverview.revenue.trend,
      icon: DollarSign,
      color: 'emerald',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'Agendamentos',
      value: displayOverview.appointments.total.toString(),
      subtext: `${displayOverview.appointments.completed} concluídos`,
      icon: Calendar,
      color: 'blue',
      bgLight: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Novos Clientes',
      value: displayOverview.customers.new.toString(),
      subtext: `${displayOverview.customers.total} total`,
      icon: Users,
      color: 'violet',
      bgLight: 'bg-violet-50 dark:bg-violet-950/50',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      name: 'Ticket Médio',
      value: formatCurrency(displayOverview.averageTicket.value),
      change: displayOverview.averageTicket.changePercent,
      trend: displayOverview.averageTicket.trend,
      icon: TrendingUp,
      color: 'ruby',
      bgLight: 'bg-ruby-50 dark:bg-ruby-950/50',
      iconColor: 'text-ruby-600 dark:text-ruby-400',
    },
  ];

  const quickActions = [
    { 
      title: 'Novo Agendamento', 
      description: 'Agende um serviço',
      icon: Calendar,
      color: 'ruby',
      bgLight: 'bg-ruby-50 dark:bg-ruby-950/50',
      iconColor: 'text-ruby-600 dark:text-ruby-400',
      href: '/appointments/new',
    },
    { 
      title: 'Novo Cliente', 
      description: 'Cadastre um cliente',
      icon: Users,
      color: 'blue',
      bgLight: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/customers/new',
    },
    { 
      title: 'Nova Venda', 
      description: 'Registre uma transação',
      icon: DollarSign,
      color: 'emerald',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/sales/new',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight" style={{ letterSpacing: '-0.025em' }}>
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Confira o resumo do seu negócio
          </p>
        </div>

      </motion.div>

      {/* Stats Cards */}
      <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StaggerItem key={stat.name}>
            <AnimatedCard>
              <Card className="border-0 bg-white dark:bg-gray-900/80 hover:shadow-soft-lg transition-all duration-400">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                      <stat.icon className={`h-[18px] w-[18px] ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stat.value}</div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</span>
                  </div>
                  {stat.change !== undefined ? (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100/80 dark:border-gray-800/40">
                      <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                        stat.trend === 'up' 
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">vs mês anterior</span>
                    </div>
                  ) : stat.subtext ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{stat.subtext}</p>
                  ) : null}
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={{ letterSpacing: '-0.015em' }}>
          Ações Rápidas
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <AnimatedCard key={action.title}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card className="border-0 hover:shadow-soft-lg transition-all duration-400 cursor-pointer group bg-white dark:bg-gray-900/80">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`p-3 rounded-xl ${action.bgLight} group-hover:scale-105 transition-transform duration-400`}>
                      <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-ruby-600 dark:group-hover:text-ruby-400 transition-colors duration-300">{action.title}</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-ruby-500 group-hover:translate-x-0.5 transition-all duration-300" />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedCard>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border-0 bg-white dark:bg-gray-900/80">
          <CardHeader className="border-b border-gray-100/80 dark:border-gray-800/40 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2" style={{ letterSpacing: '-0.015em' }}>
                <Clock className="w-4 h-4 text-gray-400" />
                Próximos Agendamentos
              </CardTitle>
              <button className="text-sm text-ruby-600 dark:text-ruby-400 font-medium hover:text-ruby-700 dark:hover:text-ruby-300 transition-colors duration-300 flex items-center gap-1">
                Ver todos
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-center py-14">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mx-auto mb-4"
              >
                <Calendar className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              </motion.div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1.5">Nenhum agendamento próximo</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-5 max-w-xs mx-auto">
                Seus próximos agendamentos aparecerão aqui
              </p>
              <motion.button 
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-ruby-500 to-ruby-600 text-white rounded-xl hover:shadow-[0_4px_16px_rgba(177,35,61,0.18)] transition-all duration-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Criar Agendamento
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
