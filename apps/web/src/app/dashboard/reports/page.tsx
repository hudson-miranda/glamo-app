'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerContainer, StaggerItem, AnimatedCard } from '@/components/ui/page-transition';

// Mock data
const stats = [
  { label: 'Receita Total', value: 'R$ 24.580', change: '+12.5%', trend: 'up' },
  { label: 'Agendamentos', value: '342', change: '+8.2%', trend: 'up' },
  { label: 'Novos Clientes', value: '47', change: '+23.1%', trend: 'up' },
  { label: 'Taxa Cancelamento', value: '4.2%', change: '-1.5%', trend: 'down' },
];

const topServices = [
  { name: 'Corte Masculino', count: 89, revenue: 4450 },
  { name: 'Corte Feminino', count: 67, revenue: 8040 },
  { name: 'Manicure', count: 54, revenue: 2430 },
  { name: 'Coloração', count: 32, revenue: 8000 },
  { name: 'Barba', count: 45, revenue: 1800 },
];

const topProfessionals = [
  { name: 'Carlos Lima', appointments: 87, revenue: 6520, rating: 4.8 },
  { name: 'Ana Costa', appointments: 72, revenue: 8640, rating: 4.9 },
  { name: 'Patrícia Mendes', appointments: 45, revenue: 11250, rating: 5.0 },
  { name: 'Juliana Santos', appointments: 68, revenue: 3060, rating: 4.7 },
];

const revenueByDay = [
  { day: 'Seg', value: 2450 },
  { day: 'Ter', value: 3200 },
  { day: 'Qua', value: 2890 },
  { day: 'Qui', value: 3450 },
  { day: 'Sex', value: 4200 },
  { day: 'Sáb', value: 5100 },
  { day: 'Dom', value: 1200 },
];

export default function ReportsPage() {
  const maxRevenue = Math.max(...revenueByDay.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Análise de desempenho do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Janeiro 2026
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </span>
              </div>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ruby-600" />
            Receita por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {revenueByDay.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.value / maxRevenue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full bg-gradient-to-t from-ruby-500 to-ruby-400 rounded-t-lg relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    R$ {day.value.toLocaleString('pt-BR')}
                  </div>
                </motion.div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.name} className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{service.count} agend.</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(service.count / topServices[0].count) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-ruby-500 to-ruby-400 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    R$ {service.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Professionals */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProfessionals.map((professional, index) => (
                <motion.div
                  key={professional.name}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index === 0 
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : index === 1
                      ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      : index === 2
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{professional.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {professional.appointments} atendimentos • ⭐ {professional.rating}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    R$ {professional.revenue.toLocaleString('pt-BR')}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
