'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Scissors,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb({ id }: { id: string }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/appointments" className="hover:text-gray-700">
        Agendamentos
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">#{id}</span>
    </nav>
  );
}

export default function AppointmentDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  // Mock data - will be replaced with API call
  const appointment = {
    id,
    status: 'confirmed',
    customer: {
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      avatar: null,
    },
    service: {
      name: 'Corte + Escova',
      duration: '1h 30min',
      price: 120.0,
    },
    professional: {
      name: 'Ana Costa',
      specialty: 'Cabeleireira',
    },
    date: '29/01/2026',
    time: '14:00',
    endTime: '15:30',
    notes: 'Cliente preferiu corte mais curto na última visita.',
    paymentStatus: 'pending',
    createdAt: '25/01/2026 10:30',
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb id={id} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Agendamento #{id}
              </h1>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Confirmado
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">Criado em {appointment.createdAt}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-purple-600" />
                Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{appointment.service.name}</h3>
                  <p className="text-gray-500">Duração: {appointment.service.duration}</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  R$ {appointment.service.price.toFixed(2)}
                </span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium">{appointment.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horário</p>
                    <p className="font-medium">{appointment.time} - {appointment.endTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Profissional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {appointment.professional.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{appointment.professional.name}</h3>
                  <p className="text-gray-500">{appointment.professional.specialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {appointment.notes || 'Nenhuma observação registrada.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-medium">
                  {appointment.customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{appointment.customer.name}</h3>
                  <Link href="#" className="text-sm text-purple-600 hover:underline">
                    Ver perfil
                  </Link>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{appointment.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{appointment.customer.email}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <Badge variant="secondary">Pendente</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Valor Total</span>
                <span className="font-bold">R$ {appointment.service.price.toFixed(2)}</span>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Reagendar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Enviar Lembrete
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Agendamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
