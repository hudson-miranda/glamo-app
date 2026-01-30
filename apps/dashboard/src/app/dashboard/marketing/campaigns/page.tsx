'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Plus,
  Search,
  Megaphone,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/marketing" className="hover:text-gray-700">
        Marketing
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Campanhas</span>
    </nav>
  );
}

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const campaigns = [
    {
      id: '1',
      name: 'Verão 2026',
      description: '20% de desconto em todos os serviços de tratamento capilar',
      type: 'discount',
      status: 'active',
      startDate: '01/01/2026',
      endDate: '28/02/2026',
      reach: 450,
      conversions: 65,
      discount: 20,
    },
    {
      id: '2',
      name: 'Dia das Mães',
      description: 'Pacote especial para mães: corte + escova + manicure',
      type: 'package',
      status: 'scheduled',
      startDate: '01/05/2026',
      endDate: '15/05/2026',
      reach: 0,
      conversions: 0,
      discount: 0,
    },
    {
      id: '3',
      name: 'Black Friday',
      description: '50% de desconto na segunda coloração',
      type: 'discount',
      status: 'completed',
      startDate: '24/11/2025',
      endDate: '30/11/2025',
      reach: 1200,
      conversions: 180,
      discount: 50,
    },
    {
      id: '4',
      name: 'Indique e Ganhe',
      description: 'Ganhe 10% de desconto para cada amigo indicado',
      type: 'referral',
      status: 'active',
      startDate: '01/01/2026',
      endDate: '31/12/2026',
      reach: 320,
      conversions: 42,
      discount: 10,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Ativa</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">Agendada</Badge>;
      case 'completed':
        return <Badge variant="outline">Finalizada</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700">Pausada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'discount':
        return <Badge variant="outline">Desconto</Badge>;
      case 'package':
        return <Badge variant="outline">Pacote</Badge>;
      case 'referral':
        return <Badge variant="outline">Indicação</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
            <p className="text-gray-500 mt-1">Gerencie suas campanhas promocionais</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha promocional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input placeholder="Ex: Promoção de Verão" />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="package">Pacote</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva a campanha..." rows={3} />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término *</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input type="number" min="0" max="100" placeholder="20" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{campaigns.filter(c => c.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{campaigns.filter(c => c.status === 'scheduled').length}</p>
            <p className="text-sm text-gray-500">Agendadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{campaigns.reduce((acc, c) => acc + c.reach, 0)}</p>
            <p className="text-sm text-gray-500">Alcance Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-pink-600">{campaigns.reduce((acc, c) => acc + c.conversions, 0)}</p>
            <p className="text-sm text-gray-500">Conversões</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar campanha..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {getStatusBadge(campaign.status)}
                      {getTypeBadge(campaign.type)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {campaign.status === 'active' && (
                      <DropdownMenuItem>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </DropdownMenuItem>
                    )}
                    {campaign.status === 'paused' && (
                      <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" />
                        Retomar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{campaign.startDate} - {campaign.endDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold">{campaign.reach}</p>
                  <p className="text-xs text-gray-500">Alcance</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{campaign.conversions}</p>
                  <p className="text-xs text-gray-500">Conversões</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {campaign.reach > 0 ? ((campaign.conversions / campaign.reach) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Taxa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
