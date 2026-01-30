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
  Calendar,
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
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Agendamentos</span>
    </nav>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    scheduled: { label: 'Agendado', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    confirmed: { label: 'Confirmado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    cancelled: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    no_show: { label: 'Não Compareceu', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const config = statusConfig[status] || statusConfig.scheduled;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - will be replaced with API call
  const appointments = [
    {
      id: '1',
      customer: 'Maria Silva',
      service: 'Corte + Escova',
      professional: 'Ana Costa',
      date: '29/01/2026',
      time: '14:00',
      duration: '1h 30min',
      status: 'confirmed',
      price: 'R$ 120,00',
    },
    {
      id: '2',
      customer: 'João Santos',
      service: 'Barba',
      professional: 'Carlos Lima',
      date: '29/01/2026',
      time: '15:30',
      duration: '30min',
      status: 'scheduled',
      price: 'R$ 45,00',
    },
    {
      id: '3',
      customer: 'Paula Oliveira',
      service: 'Coloração',
      professional: 'Fernanda Souza',
      date: '29/01/2026',
      time: '16:00',
      duration: '2h',
      status: 'completed',
      price: 'R$ 280,00',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os agendamentos do seu salão</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/appointments/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendário
            </Button>
          </Link>
          <Link href="/dashboard/appointments/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
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
                placeholder="Buscar por cliente, serviço ou profissional..."
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

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
          <CardDescription>
            {appointments.length} agendamentos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.customer}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>{appointment.professional}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{appointment.date}</span>
                      <span className="text-gray-500 text-sm">{appointment.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{appointment.duration}</TableCell>
                  <TableCell>
                    <StatusBadge status={appointment.status} />
                  </TableCell>
                  <TableCell className="font-medium">{appointment.price}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/appointments/${appointment.id}`}>
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
                          Cancelar
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
