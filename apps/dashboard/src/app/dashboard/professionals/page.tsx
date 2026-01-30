'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Home,
  Calendar,
  Star,
  Clock,
  DollarSign,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Profissionais</span>
    </nav>
  );
}

export default function ProfessionalsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const professionals = [
    {
      id: '1',
      name: 'Ana Costa',
      email: 'ana.costa@email.com',
      phone: '(11) 99999-9999',
      specialty: 'Cabeleireira',
      services: ['Corte', 'Escova', 'Coloração'],
      rating: 4.9,
      appointmentsToday: 5,
      appointmentsMonth: 48,
      commission: 40,
      status: 'active',
      avatar: null,
    },
    {
      id: '2',
      name: 'Carlos Lima',
      email: 'carlos.lima@email.com',
      phone: '(11) 98888-8888',
      specialty: 'Barbeiro',
      services: ['Barba', 'Corte Masculino'],
      rating: 4.7,
      appointmentsToday: 3,
      appointmentsMonth: 35,
      commission: 35,
      status: 'active',
      avatar: null,
    },
    {
      id: '3',
      name: 'Fernanda Souza',
      email: 'fernanda.souza@email.com',
      phone: '(11) 97777-7777',
      specialty: 'Colorista',
      services: ['Coloração', 'Mechas', 'Tratamentos'],
      rating: 4.8,
      appointmentsToday: 2,
      appointmentsMonth: 28,
      commission: 45,
      status: 'active',
      avatar: null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500 mt-1">Gerencie a equipe do seu salão</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/professionals/schedule">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Agenda
            </Button>
          </Link>
          <Link href="/dashboard/professionals/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Profissional
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou especialidade..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Professionals Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {professionals.map((professional) => (
          <Card key={professional.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={professional.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {professional.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{professional.name}</h3>
                    <p className="text-sm text-gray-500">{professional.specialty}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/professionals/${professional.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status & Rating */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={professional.status === 'active' ? 'default' : 'secondary'}>
                  {professional.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{professional.rating}</span>
                </div>
              </div>

              {/* Services */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Serviços:</p>
                <div className="flex flex-wrap gap-1">
                  {professional.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Hoje</span>
                  </div>
                  <p className="font-semibold">{professional.appointmentsToday}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">Mês</span>
                  </div>
                  <p className="font-semibold">{professional.appointmentsMonth}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Comissão</span>
                  </div>
                  <p className="font-semibold">{professional.commission}%</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t">
                <Link href={`/dashboard/professionals/${professional.id}`}>
                  <Button variant="outline" className="w-full">
                    Ver Perfil Completo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
