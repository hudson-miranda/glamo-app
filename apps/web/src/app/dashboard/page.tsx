'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores';
import { analyticsService, AnalyticsOverview } from '@/services';
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
  Activity,
  Bell,
} from 'lucide-react';

// Mock data for demonstration
const mockOverview: AnalyticsOverview = {
  revenue: { value: 45750, previousValue: 40680, change: 5070, changePercent: 12.5, trend: 'up' },
  appointments: { total: 234, completed: 189, cancelled: 23, noShow: 12 },
  customers: { total: 156, new: 28, returning: 128 },
  averageTicket: { value: 195.5, previousValue: 185.8, change: 9.7, changePercent: 5.2, trend: 'up' },
};

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await analyticsService.getOverview();
        setOverview(data);
      } catch (error) {
        console.warn('API not available, using mock data');
        setOverview(mockOverview);
        setUseMockData(true);
      } finally {
        // Simular loading para demonstração
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchData();
  }, []);

  const displayOverview = overview || mockOverview;

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
      href: '/dashboard/appointments/new',
    },
    { 
      title: 'Novo Cliente', 
      description: 'Cadastre um cliente',
      icon: Users,
      color: 'blue',
      bgLight: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/dashboard/customers/new',
    },
    { 
      title: 'Nova Venda', 
      description: 'Registre uma transação',
      icon: DollarSign,
      color: 'emerald',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/dashboard/sales/new',
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
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}
            <motion.div
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              <Sparkles className="w-6 h-6 text-amber-500" />
            </motion.div>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Confira o resumo do seu negócio
          </p>
          {useMockData && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-lg w-fit">
              <Activity className="h-3.5 w-3.5" />
              Dados de demonstração
            </p>
          )}
        </div>

      </motion.div>

      {/* Stats Cards */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StaggerItem key={stat.name}>
            <AnimatedCard>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</span>
                    <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  {stat.change !== undefined ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                        stat.trend === 'up' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                      }`}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        <span className="text-xs font-semibold">
                          {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">vs mês anterior</span>
                    </div>
                  ) : stat.subtext ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">{stat.subtext}</p>
                  ) : null}
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-ruby-500" />
          Ações Rápidas
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <AnimatedCard key={action.title}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white dark:bg-gray-900">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`p-3.5 rounded-2xl ${action.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-ruby-600 dark:group-hover:text-ruby-400 transition-colors">{action.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-ruby-500 group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedCard>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-ruby-500" />
                Próximos Agendamentos
              </CardTitle>
              <button className="text-sm text-ruby-600 dark:text-ruby-400 font-medium hover:text-ruby-700 dark:hover:text-ruby-300 transition-colors flex items-center gap-1">
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"
              >
                <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum agendamento próximo</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Seus próximos agendamentos aparecerão aqui. Comece criando o primeiro!
              </p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl hover:shadow-lg hover:shadow-ruby-500/25 transition-all text-sm font-medium"
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
