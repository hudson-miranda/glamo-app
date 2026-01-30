'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

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

  const stats = [
    { label: 'Total de Clientes', value: customers.length, icon: Users },
    { label: 'Novos este mês', value: 12 },
    { label: 'Taxa de Retorno', value: '78%' },
    { label: 'Ticket Médio', value: 'R$ 156' },
  ];

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie sua base de clientes
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StaggerItem key={stat.label}>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ruby-500 focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Customers List */}
      <StaggerContainer className="space-y-3">
        {filteredCustomers.map((customer) => (
          <StaggerItem key={customer.id}>
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold">
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                      {customer.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-medium bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < customer.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700'}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
