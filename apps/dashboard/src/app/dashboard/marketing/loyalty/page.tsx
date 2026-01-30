'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Gift,
  Star,
  Settings,
  Search,
  Heart,
  Award,
  TrendingUp,
  Clock,
  Crown,
} from 'lucide-react';

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
      <span className="text-gray-900 font-medium">Fidelidade</span>
    </nav>
  );
}

export default function LoyaltyPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const program = {
    enabled: true,
    pointsPerReal: 1,
    redeemRate: 100, // 100 pontos = R$ 10
    expirationDays: 365,
  };

  const members = [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', points: 850, level: 'gold', since: '15/03/2025' },
    { id: '2', name: 'Paula Oliveira', email: 'paula@email.com', points: 520, level: 'silver', since: '20/06/2025' },
    { id: '3', name: 'Ana Santos', email: 'ana@email.com', points: 1200, level: 'gold', since: '10/01/2025' },
    { id: '4', name: 'Juliana Costa', email: 'juliana@email.com', points: 180, level: 'bronze', since: '05/12/2025' },
    { id: '5', name: 'Fernanda Lima', email: 'fernanda@email.com', points: 2500, level: 'platinum', since: '01/08/2024' },
  ];

  const rewards = [
    { id: '1', name: 'Desconto de 10%', points: 100, type: 'discount' },
    { id: '2', name: 'Hidratação Grátis', points: 300, type: 'service' },
    { id: '3', name: 'Kit de Produtos', points: 500, type: 'product' },
    { id: '4', name: 'Dia de Spa', points: 1000, type: 'experience' },
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'bronze':
        return <Badge className="bg-amber-100 text-amber-700">Bronze</Badge>;
      case 'silver':
        return <Badge className="bg-gray-200 text-gray-700">Prata</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-100 text-yellow-700">Ouro</Badge>;
      case 'platinum':
        return <Badge className="bg-purple-100 text-purple-700">Platina</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
            <p className="text-gray-500 mt-1">Recompense seus clientes fiéis</p>
          </div>
        </div>
        <Badge className={program.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
          {program.enabled ? 'Programa Ativo' : 'Programa Inativo'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Membros</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pontos Distribuídos</p>
                <p className="text-2xl font-bold">{members.reduce((acc, m) => acc + m.points, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Recompensas Disponíveis</p>
                <p className="text-2xl font-bold">{rewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Membros VIP</p>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.level === 'gold' || m.level === 'platinum').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar membro..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros do Programa</CardTitle>
              <CardDescription>{members.length} clientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Membro Desde</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(member.level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{member.points}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.since}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Ver Histórico
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Gift className="h-4 w-4 mr-2" />
              Nova Recompensa
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                        <Gift className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{reward.name}</h3>
                        <Badge variant="outline" className="mt-1">{reward.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-xl font-bold">{reward.points}</span>
                      </div>
                      <p className="text-xs text-gray-500">pontos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Programa</CardTitle>
              <CardDescription>Personalize as regras do programa de fidelidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Programa Ativo</Label>
                  <p className="text-sm text-gray-500">Ative ou desative o programa</p>
                </div>
                <Switch checked={program.enabled} />
              </div>

              <div className="space-y-2">
                <Label>Pontos por R$ gasto</Label>
                <Input type="number" defaultValue={program.pointsPerReal} />
                <p className="text-xs text-gray-500">Quantos pontos o cliente ganha a cada real gasto</p>
              </div>

              <div className="space-y-2">
                <Label>Taxa de Resgate (pontos para R$)</Label>
                <Input type="number" defaultValue={program.redeemRate} />
                <p className="text-xs text-gray-500">Quantos pontos equivalem a R$ 10,00</p>
              </div>

              <div className="space-y-2">
                <Label>Validade dos Pontos (dias)</Label>
                <Input type="number" defaultValue={program.expirationDays} />
                <p className="text-xs text-gray-500">Após quantos dias os pontos expiram</p>
              </div>

              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
