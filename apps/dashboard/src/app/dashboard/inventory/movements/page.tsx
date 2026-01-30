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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronRight,
  Home,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  ArrowUpDown,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/inventory" className="hover:text-gray-700">
        Estoque
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Movimentações</span>
    </nav>
  );
}

export default function InventoryMovementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [movementType, setMovementType] = useState('in');

  // Mock data
  const movements = [
    { id: '1', product: 'Shampoo Profissional 1L', sku: 'SHP-001', type: 'in', quantity: 20, reason: 'Compra', date: '29/01/2026 10:00', user: 'Maria Administradora' },
    { id: '2', product: 'Tintura Louro Claro', sku: 'TNT-001', type: 'out', quantity: 2, reason: 'Uso em serviço', date: '29/01/2026 11:30', user: 'Ana Costa' },
    { id: '3', product: 'Condicionador 500ml', sku: 'CND-001', type: 'out', quantity: 5, reason: 'Venda', date: '28/01/2026 15:00', user: 'Sistema' },
    { id: '4', product: 'Óleo de Argan', sku: 'OLE-001', type: 'in', quantity: 10, reason: 'Compra', date: '28/01/2026 09:00', user: 'Maria Administradora' },
    { id: '5', product: 'Creme Hidratante', sku: 'CRM-001', type: 'out', quantity: 3, reason: 'Perda/Vencido', date: '27/01/2026 16:00', user: 'Maria Administradora' },
  ];

  const stats = {
    totalIn: movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0),
    totalOut: movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Movimentações</h1>
            <p className="text-gray-500 mt-1">Histórico de entradas e saídas do estoque</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Movimentação</DialogTitle>
                <DialogDescription>
                  Registre uma entrada ou saída de estoque
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={movementType === 'in' ? 'default' : 'outline'}
                    className={`flex-1 ${movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setMovementType('in')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Entrada
                  </Button>
                  <Button
                    variant={movementType === 'out' ? 'default' : 'outline'}
                    className={`flex-1 ${movementType === 'out' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => setMovementType('out')}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Saída
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shp-001">Shampoo Profissional 1L</SelectItem>
                      <SelectItem value="cnd-001">Condicionador 500ml</SelectItem>
                      <SelectItem value="tnt-001">Tintura Louro Claro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input type="number" min="1" placeholder="0" />
                </div>

                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {movementType === 'in' ? (
                        <>
                          <SelectItem value="compra">Compra</SelectItem>
                          <SelectItem value="devolucao">Devolução</SelectItem>
                          <SelectItem value="ajuste">Ajuste de estoque</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="uso">Uso em serviço</SelectItem>
                          <SelectItem value="perda">Perda/Vencido</SelectItem>
                          <SelectItem value="ajuste">Ajuste de estoque</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea placeholder="Observações adicionais..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button className={movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                  {movementType === 'in' ? 'Registrar Entrada' : 'Registrar Saída'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-600">+{stats.totalIn} un.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-600">-{stats.totalOut} un.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo</p>
                <p className={`text-2xl font-bold ${stats.totalIn - stats.totalOut >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {stats.totalIn - stats.totalOut >= 0 ? '+' : ''}{stats.totalIn - stats.totalOut} un.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por produto..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in">Entradas</SelectItem>
                <SelectItem value="out">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Período
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            {movements.length} movimentações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{movement.product}</p>
                      <code className="text-xs bg-gray-100 px-1 rounded">{movement.sku}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.type === 'in' ? 'default' : 'secondary'} className={
                      movement.type === 'in'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }>
                      {movement.type === 'in' ? (
                        <><Plus className="h-3 w-3 mr-1" /> Entrada</>
                      ) : (
                        <><Minus className="h-3 w-3 mr-1" /> Saída</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${
                    movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity} un.
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell>{movement.date}</TableCell>
                  <TableCell>{movement.user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
