'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Scissors, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
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

// Mock data for services
const services = [
  {
    id: '1',
    name: 'Corte Feminino',
    description: 'Corte personalizado com lavagem e finalização',
    duration: 60,
    price: 120.00,
    category: 'Cabelo',
    active: true,
    popular: true,
    bookings: 156
  },
  {
    id: '2',
    name: 'Corte Masculino',
    description: 'Corte moderno com acabamento na máquina',
    duration: 30,
    price: 50.00,
    category: 'Cabelo',
    active: true,
    popular: true,
    bookings: 234
  },
  {
    id: '3',
    name: 'Coloração',
    description: 'Coloração completa com produtos premium',
    duration: 120,
    price: 250.00,
    category: 'Químicos',
    active: true,
    popular: false,
    bookings: 89
  },
  {
    id: '4',
    name: 'Escova',
    description: 'Escova modeladora com finalização',
    duration: 45,
    price: 80.00,
    category: 'Cabelo',
    active: true,
    popular: false,
    bookings: 112
  },
  {
    id: '5',
    name: 'Manicure',
    description: 'Manicure completa com esmaltação',
    duration: 40,
    price: 45.00,
    category: 'Unhas',
    active: true,
    popular: true,
    bookings: 198
  },
  {
    id: '6',
    name: 'Pedicure',
    description: 'Pedicure completa com esmaltação',
    duration: 50,
    price: 55.00,
    category: 'Unhas',
    active: true,
    popular: false,
    bookings: 145
  },
  {
    id: '7',
    name: 'Barba',
    description: 'Modelagem de barba com toalha quente',
    duration: 30,
    price: 40.00,
    category: 'Barbearia',
    active: true,
    popular: false,
    bookings: 167
  },
  {
    id: '8',
    name: 'Hidratação',
    description: 'Tratamento hidratante profundo',
    duration: 60,
    price: 150.00,
    category: 'Tratamentos',
    active: false,
    popular: false,
    bookings: 34
  },
];

const categories = ['Todos', 'Cabelo', 'Químicos', 'Unhas', 'Barbearia', 'Tratamentos'];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Total de Serviços', value: services.length.toString(), icon: Package, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Serviços Ativos', value: services.filter(s => s.active).length.toString(), icon: Eye, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Mais Popular', value: 'Corte Masc.', icon: Star, bg: 'bg-amber-50 dark:bg-amber-950/50', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Ticket Médio', value: 'R$ 98', icon: TrendingUp, bg: 'bg-ruby-50 dark:bg-ruby-950/50', color: 'text-ruby-600 dark:text-ruby-400' },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
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
            <Scissors className="w-7 h-7 text-ruby-500" />
            Serviços
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os serviços oferecidos pelo seu negócio
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
          <Plus className="h-4 w-4" />
          Novo Serviço
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

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
      >
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 rounded-xl ${selectedCategory === category ? 'bg-gradient-to-r from-ruby-600 to-ruby-700' : ''}`}
          >
            {category}
          </Button>
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviço..."
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

      {/* Services Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <StaggerItem key={service.id}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-sm p-5 hover:shadow-xl transition-all ${!service.active && 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-ruby-100 dark:bg-ruby-900/30">
                    <Scissors className="h-5 w-5 text-ruby-600 dark:text-ruby-400" />
                  </div>
                  {service.popular && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      Popular
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{service.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    {service.duration}min
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  {service.bookings} agend.
                </span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className={`flex items-center gap-1 text-xs font-medium ${service.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {service.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
        </StaggerContainer>
      </motion.div>
    </motion.div>
  );
}
