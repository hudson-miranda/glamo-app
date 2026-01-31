'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
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

// Tipo para agendamentos
interface Appointment {
  id: string;
  client: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  phone: string;
}

// Mock data for appointments
const mockAppointments: Appointment[] = [
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

// Função para buscar agendamentos - substituir por API real
const fetchAppointments = async (): Promise<Appointment[]> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockAppointments;
};

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  
  // Hook de dados assíncronos com cache
  const { data: appointments = [], isLoading } = usePageData(
    fetchAppointments,
    { cacheKey: 'appointments-list', initialData: mockAppointments }
  );

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
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3" style={{ letterSpacing: '-0.02em' }}>
            <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-950/30">
              <Calendar className="w-5 h-5 text-ruby-500" />
            </div>
            Agendamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Gerencie todos os agendamentos do seu negócio
          </p>
        </div>
        <Link href="/appointments/new">
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-500 to-ruby-600 hover:shadow-[0_4px_16px_rgba(177,35,61,0.2)] transition-all duration-300">
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
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg} w-fit`}>
                      <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-semibold ${stat.color}`} style={{ letterSpacing: '-0.02em' }}>{stat.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-lg border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}>
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </Button>
                <span className="text-base font-medium text-gray-900 dark:text-white capitalize ml-2" style={{ letterSpacing: '-0.01em' }}>
                  {formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant={view === 'day' ? 'default' : 'outline'} 
                  size="sm"
                  className={`rounded-lg transition-all duration-300 ${view === 'day' ? 'bg-gradient-to-r from-ruby-500 to-ruby-600' : 'border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'}`}
                  onClick={() => setView('day')}
                >
                  Dia
                </Button>
                <Button 
                  variant={view === 'week' ? 'default' : 'outline'} 
                  size="sm"
                  className={`rounded-lg transition-all duration-300 ${view === 'week' ? 'bg-gradient-to-r from-ruby-500 to-ruby-600' : 'border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'}`}
                  onClick={() => setView('week')}
                >
                  Semana
                </Button>
                <Button 
                  variant={view === 'month' ? 'default' : 'outline'} 
                  size="sm"
                  className={`rounded-lg transition-all duration-300 ${view === 'month' ? 'bg-gradient-to-r from-ruby-500 to-ruby-600' : 'border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'}`}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente ou serviço..."
            className="w-full pl-11 pr-4 py-3 border border-gray-100/80 dark:border-gray-800/40 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-400 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl px-5 border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300">
          <Filter className="h-[18px] w-[18px]" />
          Filtros
        </Button>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <StaggerContainer className="space-y-2">
          {appointments.map((appointment) => (
            <StaggerItem key={appointment.id}>
              <AnimatedCard>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] p-5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-ruby-50 dark:bg-ruby-950/30 rounded-xl">
                        <span className="text-base font-semibold text-ruby-600 dark:text-ruby-400" style={{ letterSpacing: '-0.01em' }}>{appointment.time}</span>
                        <span className="text-[10px] text-ruby-500 dark:text-ruby-400">{appointment.duration}min</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>{appointment.client}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.service}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{appointment.professional}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                        {statusLabels[appointment.status as keyof typeof statusLabels]}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300">
                          <Phone className="h-[15px] w-[15px]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors duration-300">
                          <Check className="h-[15px] w-[15px]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300">
                          <MoreVertical className="h-[15px] w-[15px]" />
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
