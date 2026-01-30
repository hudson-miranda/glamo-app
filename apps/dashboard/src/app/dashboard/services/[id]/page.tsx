'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb({ id }: { id: string }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/services" className="hover:text-gray-700">
        Serviços
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Detalhes</span>
    </nav>
  );
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  // Mock data
  const service = {
    id,
    name: 'Corte Feminino',
    description: 'Corte feminino com lavagem, corte personalizado e finalização. Inclui análise do tipo de cabelo e recomendações de produtos.',
    category: 'Cabelo',
    duration: 60,
    price: 80,
    status: 'active',
    createdAt: '15/03/2024',
    bookingsThisMonth: 45,
    bookingsTotal: 320,
    revenue: 25600,
    rating: 4.8,
    professionals: [
      { id: '1', name: 'Ana Costa', avatar: null },
      { id: '2', name: 'Fernanda Souza', avatar: null },
      { id: '3', name: 'Juliana Lima', avatar: null },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb id={id} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
              <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                {service.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-gray-500 mt-1">
              <Badge variant="outline">{service.category}</Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{service.rating}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Duração</p>
                <p className="text-2xl font-bold">{service.duration} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Preço</p>
                <p className="text-2xl font-bold">R$ {service.price.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Este Mês</p>
                <p className="text-2xl font-bold">{service.bookingsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Faturamento</p>
                <p className="text-2xl font-bold">R$ {service.revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{service.description}</p>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Desempenho</CardTitle>
              <CardDescription>Estatísticas do serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Total de Agendamentos</p>
                  <p className="text-3xl font-bold">{service.bookingsTotal}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Receita Total</p>
                  <p className="text-3xl font-bold">R$ {service.revenue.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                  <p className="text-3xl font-bold">R$ {service.price.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Avaliação Média</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{service.rating}</p>
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Professionals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Profissionais
              </CardTitle>
              <CardDescription>
                Quem realiza este serviço
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.professionals.map((professional) => (
                <div key={professional.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={professional.avatar || undefined} />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {professional.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{professional.name}</span>
                </div>
              ))}
              <Separator />
              <Button variant="outline" className="w-full">
                Gerenciar Profissionais
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Categoria</span>
                <Badge variant="outline">{service.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Criado em</span>
                <span>{service.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                  {service.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
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
                Ver Agendamentos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
