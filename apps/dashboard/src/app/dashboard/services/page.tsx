'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Scissors,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Home,
  Clock,
  DollarSign,
  Tag,
  FolderOpen,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Serviços</span>
    </nav>
  );
}

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const services = [
    {
      id: '1',
      name: 'Corte Feminino',
      category: 'Cabelo',
      duration: 60,
      price: 80,
      professionals: 3,
      status: 'active',
      bookings: 45,
    },
    {
      id: '2',
      name: 'Corte Masculino',
      category: 'Cabelo',
      duration: 30,
      price: 50,
      professionals: 2,
      status: 'active',
      bookings: 38,
    },
    {
      id: '3',
      name: 'Coloração',
      category: 'Cabelo',
      duration: 120,
      price: 200,
      professionals: 2,
      status: 'active',
      bookings: 22,
    },
    {
      id: '4',
      name: 'Escova',
      category: 'Cabelo',
      duration: 45,
      price: 60,
      professionals: 3,
      status: 'active',
      bookings: 35,
    },
    {
      id: '5',
      name: 'Barba',
      category: 'Barbearia',
      duration: 30,
      price: 40,
      professionals: 1,
      status: 'active',
      bookings: 28,
    },
    {
      id: '6',
      name: 'Manicure',
      category: 'Unhas',
      duration: 45,
      price: 35,
      professionals: 1,
      status: 'inactive',
      bookings: 0,
    },
  ];

  const stats = [
    { label: 'Total de Serviços', value: '12', icon: Scissors, color: 'text-purple-600' },
    { label: 'Categorias', value: '5', icon: FolderOpen, color: 'text-blue-600' },
    { label: 'Serviços Ativos', value: '10', icon: Tag, color: 'text-green-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-500 mt-1">Gerencie os serviços oferecidos pelo salão</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/services/categories">
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categorias
            </Button>
          </Link>
          <Link href="/dashboard/services/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar serviço..."
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

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            {services.length} serviços cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Profissionais</TableHead>
                <TableHead>Agendamentos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {service.duration} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      R$ {service.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>{service.professionals}</TableCell>
                  <TableCell>{service.bookings}</TableCell>
                  <TableCell>
                    <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                      {service.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/services/${service.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
