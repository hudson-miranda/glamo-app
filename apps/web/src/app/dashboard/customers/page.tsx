'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  Star,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  DollarSign,
  UserPlus
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
  SkeletonList,
} from '@/components/ui';

// Mock data for customers
const customers = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 99999-1234',
    totalAppointments: 24,
    lastVisit: '2026-01-28',
    totalSpent: 2450.00,
    avatar: null,
    rating: 5,
    tags: ['VIP', 'Fidelidade']
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao.santos@email.com',
    phone: '(11) 98888-5678',
    totalAppointments: 12,
    lastVisit: '2026-01-25',
    totalSpent: 890.00,
    avatar: null,
    rating: 4,
    tags: ['Novo']
  },
  {
    id: '3',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@email.com',
    phone: '(11) 97777-9012',
    totalAppointments: 45,
    lastVisit: '2026-01-30',
    totalSpent: 5670.00,
    avatar: null,
    rating: 5,
    tags: ['VIP', 'Fidelidade', 'Premium']
  },
  {
    id: '4',
    name: 'Pedro Costa',
    email: 'pedro.costa@email.com',
    phone: '(11) 96666-3456',
    totalAppointments: 8,
    lastVisit: '2026-01-20',
    totalSpent: 320.00,
    avatar: null,
    rating: 4,
    tags: []
  },
  {
    id: '5',
    name: 'Carla Mendes',
    email: 'carla.mendes@email.com',
    phone: '(11) 95555-7890',
    totalAppointments: 31,
    lastVisit: '2026-01-29',
    totalSpent: 3890.00,
    avatar: null,
    rating: 5,
    tags: ['Fidelidade']
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

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Total de Clientes', value: customers.length.toString(), icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Novos este mês', value: '12', icon: UserPlus, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Taxa de Retorno', value: '78%', icon: TrendingUp, bg: 'bg-violet-50 dark:bg-violet-950/50', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Ticket Médio', value: 'R$ 156', icon: DollarSign, bg: 'bg-ruby-50 dark:bg-ruby-950/50', color: 'text-ruby-600 dark:text-ruby-400' },
  ];

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
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
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <SkeletonList rows={5} />
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
            <Users className="w-7 h-7 text-ruby-500" />
            Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie sua base de clientes
          </p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
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
            placeholder="Buscar por nome, email ou telefone..."
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

      {/* Customers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StaggerContainer className="space-y-3">
          {filteredCustomers.map((customer) => (
            <StaggerItem key={customer.id}>
              <AnimatedCard>
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-sm hover:shadow-lg p-5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold">
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                          {customer.tags.map(tag => (
                            <span 
                              key={tag}
                              className="px-2 py-0.5 text-[10px] font-medium bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400 rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {customer.totalAppointments} visitas
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          R$ {customer.totalSpent.toFixed(2)}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3.5 w-3.5 ${i < customer.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700'}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                          <ChevronRight className="h-4 w-4" />
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
