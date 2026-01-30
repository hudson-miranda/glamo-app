'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MoreVertical,
  Check,
  X,
  Phone,
  Sparkles
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  StaggerContainer, 
  StaggerItem,
  SkeletonCard,
  SkeletonList,
  Skeleton,
  AnimatedCard,
} from '@/components/ui';

// Mock data for appointments
const appointments = [
  {
    id: '1',
    client: 'Maria Silva',
    service: 'Corte + Escova',
    professional: 'Ana Costa',
    date: '2026-01-30',
    time: '09:00',
    duration: 60,
    status: 'confirmed',
    phone: '(11) 99999-1234'
  },
  {
    id: '2',
    client: 'João Santos',
    service: 'Barba',
    professional: 'Carlos Lima',
    date: '2026-01-30',
    time: '10:00',
    duration: 30,
    status: 'pending',
    phone: '(11) 98888-5678'
  },
  {
    id: '3',
    client: 'Ana Oliveira',
    service: 'Coloração',
    professional: 'Patrícia Mendes',
    date: '2026-01-30',
    time: '11:00',
    duration: 120,
    status: 'confirmed',
    phone: '(11) 97777-9012'
  },
  {
    id: '4',
    client: 'Pedro Costa',
    service: 'Corte Masculino',
    professional: 'Carlos Lima',
    date: '2026-01-30',
    time: '14:00',
    duration: 30,
    status: 'completed',
    phone: '(11) 96666-3456'
  },
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const stats = [
    { label: 'Total Hoje', value: appointments.length, color: 'text-gray-900 dark:text-white', icon: Calendar, bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: 'Confirmados', value: appointments.filter(a => a.status === 'confirmed').length, color: 'text-emerald-600 dark:text-emerald-400', icon: Check, bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { label: 'Pendentes', value: appointments.filter(a => a.status === 'pending').length, color: 'text-amber-600 dark:text-amber-400', icon: Clock, bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { label: 'Concluídos', value: appointments.filter(a => a.status === 'completed').length, color: 'text-blue-600 dark:text-blue-400', icon: Sparkles, bg: 'bg-blue-50 dark:bg-blue-950/50' },
  ];

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-ruby-500" />
            Agendamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie todos os agendamentos do seu negócio
          </p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Calendar Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-xl" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize ml-2">
                  {formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={view === 'day' ? 'default' : 'outline'} 
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setView('day')}
                >
                  Dia
                </Button>
                <Button 
                  variant={view === 'week' ? 'default' : 'outline'} 
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setView('week')}
                >
                  Semana
                </Button>
                <Button 
                  variant={view === 'month' ? 'default' : 'outline'} 
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setView('month')}
                >
                  Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente ou serviço..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ruby-500/50 focus:border-ruby-500 transition-all"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-2xl px-5">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <StaggerContainer className="space-y-3">
          {appointments.map((appointment) => (
            <StaggerItem key={appointment.id}>
              <AnimatedCard>
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-sm hover:shadow-lg p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-ruby-50 dark:bg-ruby-950/30 rounded-2xl">
                        <span className="text-lg font-bold text-ruby-600 dark:text-ruby-400">{appointment.time}</span>
                        <span className="text-xs text-ruby-500 dark:text-ruby-400">{appointment.duration}min</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.client}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.service}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{appointment.professional}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                        {statusLabels[appointment.status as keyof typeof statusLabels]}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </motion.div>
    </motion.div>
  );
}
