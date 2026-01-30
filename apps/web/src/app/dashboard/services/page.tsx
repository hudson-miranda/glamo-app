'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

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

  const stats = [
    { label: 'Total de Serviços', value: services.length },
    { label: 'Serviços Ativos', value: services.filter(s => s.active).length },
    { label: 'Mais Popular', value: 'Corte Masc.' },
    { label: 'Ticket Médio', value: 'R$ 98' },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Serviços</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os serviços oferecidos pelo seu negócio
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex-shrink-0"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviço..."
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

      {/* Services Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <StaggerItem key={service.id}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-xl transition-all ${!service.active && 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-ruby-100 dark:bg-ruby-900/30">
                    <Scissors className="h-5 w-5 text-ruby-600 dark:text-ruby-400" />
                  </div>
                  {service.popular && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      Popular
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
