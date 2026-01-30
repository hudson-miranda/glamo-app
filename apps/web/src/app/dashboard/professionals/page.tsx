'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  UserCog, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  Calendar,
  Star,
  Phone,
  Mail,
  Briefcase,
  Users,
  TrendingUp
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent,
  StaggerContainer, 
  StaggerItem,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';

// Mock data for professionals
const professionals = [
  {
    id: '1',
    name: 'Ana Costa',
    role: 'Cabeleireira',
    email: 'ana.costa@glamo.com',
    phone: '(11) 99999-1111',
    avatar: null,
    rating: 4.9,
    reviews: 156,
    services: ['Corte Feminino', 'Escova', 'Coloração'],
    schedule: 'Seg a Sáb, 9h - 18h',
    active: true,
    appointmentsToday: 5
  },
  {
    id: '2',
    name: 'Carlos Lima',
    role: 'Barbeiro',
    email: 'carlos.lima@glamo.com',
    phone: '(11) 98888-2222',
    avatar: null,
    rating: 4.8,
    reviews: 203,
    services: ['Corte Masculino', 'Barba', 'Pigmentação'],
    schedule: 'Seg a Sáb, 8h - 17h',
    active: true,
    appointmentsToday: 8
  },
  {
    id: '3',
    name: 'Patrícia Mendes',
    role: 'Colorista',
    email: 'patricia.mendes@glamo.com',
    phone: '(11) 97777-3333',
    avatar: null,
    rating: 5.0,
    reviews: 89,
    services: ['Coloração', 'Mechas', 'Tratamentos'],
    schedule: 'Ter a Sáb, 10h - 19h',
    active: true,
    appointmentsToday: 3
  },
  {
    id: '4',
    name: 'Juliana Santos',
    role: 'Manicure',
    email: 'juliana.santos@glamo.com',
    phone: '(11) 96666-4444',
    avatar: null,
    rating: 4.7,
    reviews: 178,
    services: ['Manicure', 'Pedicure', 'Nail Art'],
    schedule: 'Seg a Sex, 9h - 18h',
    active: true,
    appointmentsToday: 6
  },
  {
    id: '5',
    name: 'Roberto Alves',
    role: 'Cabeleireiro',
    email: 'roberto.alves@glamo.com',
    phone: '(11) 95555-5555',
    avatar: null,
    rating: 4.6,
    reviews: 134,
    services: ['Corte Masculino', 'Corte Feminino'],
    schedule: 'Seg a Sáb, 9h - 18h',
    active: false,
    appointmentsToday: 0
  },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfessionalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Total', value: professionals.length.toString(), icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Ativos', value: professionals.filter(p => p.active).length.toString(), icon: UserCog, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Atendimentos Hoje', value: professionals.reduce((acc, p) => acc + p.appointmentsToday, 0).toString(), icon: Calendar, bg: 'bg-violet-50 dark:bg-violet-950/50', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Média Avaliação', value: '4.8', icon: Star, bg: 'bg-amber-50 dark:bg-amber-950/50', color: 'text-amber-600 dark:text-amber-400' },
  ];

  const filteredProfessionals = professionals.filter(professional => 
    professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    professional.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
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
            <UserCog className="w-7 h-7 text-ruby-500" />
            Profissionais
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie sua equipe de profissionais
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
          <Plus className="h-4 w-4" />
          Novo Profissional
        </Button>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou função..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ruby-500/50 focus:border-ruby-500 transition-all"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-2xl px-5">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </motion.div>

      {/* Professionals Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((professional) => (
            <StaggerItem key={professional.id}>
              <AnimatedCard>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-sm p-5 hover:shadow-xl transition-all ${!professional.active && 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold text-lg">
                        {getInitials(professional.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{professional.name}</h3>
                        <p className="text-sm text-ruby-600 dark:text-ruby-400">{professional.role}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{professional.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">({professional.reviews} avaliações)</span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  {professional.schedule}
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Briefcase className="h-4 w-4" />
                  {professional.services.slice(0, 2).join(', ')}
                  {professional.services.length > 2 && ` +${professional.services.length - 2}`}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {professional.active ? (
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium">
                    Ativo
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-xs font-medium">
                    Inativo
                  </span>
                )}
                {professional.appointmentsToday > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                    {professional.appointmentsToday} agend. hoje
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Ver Agenda
                </Button>
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
