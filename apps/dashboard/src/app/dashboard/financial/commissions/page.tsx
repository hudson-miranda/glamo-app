'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Download,
  Calendar,
  DollarSign,
  Users,
  Check,
  Clock,
  Calculator,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/financial" className="hover:text-gray-700">
        Financeiro
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Comissões</span>
    </nav>
  );
}

export default function CommissionsPage() {
  const [period, setPeriod] = useState('current');

  // Mock data
  const commissions = [
    {
      id: '1',
      professional: 'Ana Costa',
      avatar: null,
      services: 48,
      revenue: 5840.0,
      commissionRate: 40,
      commissionValue: 2336.0,
      status: 'pending',
    },
    {
      id: '2',
      professional: 'Carlos Lima',
      avatar: null,
      services: 35,
      revenue: 2975.0,
      commissionRate: 35,
      commissionValue: 1041.25,
      status: 'pending',
    },
    {
      id: '3',
      professional: 'Fernanda Souza',
      avatar: null,
      services: 28,
      revenue: 5600.0,
      commissionRate: 45,
      commissionValue: 2520.0,
      status: 'paid',
    },
  ];

  const totals = {
    revenue: commissions.reduce((acc, c) => acc + c.revenue, 0),
    commissions: commissions.reduce((acc, c) => acc + c.commissionValue, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.commissionValue, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.commissionValue, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/financial">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
            <p className="text-gray-500 mt-1">Gerenciamento de comissões da equipe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Janeiro 2026</SelectItem>
              <SelectItem value="december">Dezembro 2025</SelectItem>
              <SelectItem value="november">Novembro 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold">
                  R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Comissões</p>
                <p className="text-2xl font-bold">
                  R$ {totals.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões por Profissional</CardTitle>
          <CardDescription>
            Detalhamento das comissões do período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead>Receita Gerada</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={commission.avatar || undefined} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {commission.professional.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{commission.professional}</span>
                    </div>
                  </TableCell>
                  <TableCell>{commission.services}</TableCell>
                  <TableCell>
                    R$ {commission.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{commission.commissionRate}%</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-purple-600">
                    R$ {commission.commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                      {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {commission.status === 'pending' ? (
                      <Button size="sm" variant="outline">
                        <Check className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled>
                        Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Check className="h-4 w-4 mr-2" />
          Pagar Todas Pendentes
        </Button>
        <Button variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Recalcular Comissões
        </Button>
      </div>
    </div>
  );
}
