'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Edit,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  Barcode,
  DollarSign,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb({ productName }: { productName: string }) {
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
      <span className="text-gray-900 font-medium">{productName}</span>
    </nav>
  );
}

export default function ProductDetailsPage() {
  // Mock data
  const product = {
    id: '1',
    name: 'Shampoo Profissional 1L',
    sku: 'SHP-001',
    barcode: '7891234567890',
    category: 'Cabelo',
    brand: 'L\'Oréal',
    description: 'Shampoo profissional para uso em salão, ideal para todos os tipos de cabelo.',
    stock: 15,
    minStock: 5,
    maxStock: 50,
    purchasePrice: 32.90,
    salePrice: 45.90,
    status: 'normal',
    location: 'Prateleira A1',
    supplier: 'Distribuidora Beauty',
    createdAt: '10/12/2025',
    updatedAt: '29/01/2026',
  };

  const movements = [
    { id: '1', type: 'in', quantity: 20, reason: 'Compra', date: '15/01/2026', user: 'Maria' },
    { id: '2', type: 'out', quantity: 5, reason: 'Venda', date: '20/01/2026', user: 'Sistema' },
    { id: '3', type: 'out', quantity: 3, reason: 'Uso interno', date: '25/01/2026', user: 'Ana' },
    { id: '4', type: 'in', quantity: 10, reason: 'Compra', date: '28/01/2026', user: 'Maria' },
    { id: '5', type: 'out', quantity: 7, reason: 'Venda', date: '29/01/2026', user: 'Sistema' },
  ];

  const stats = {
    totalIn: movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0),
    totalOut: movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0),
    averageMonthly: 12,
    daysUntilOut: Math.round(product.stock / (15 / 30)),
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb productName={product.name} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <Badge className="bg-green-100 text-green-700">Normal</Badge>
            </div>
            <p className="text-gray-500 mt-1">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{product.sku}</code>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Entrada
          </Button>
          <Button variant="outline">
            <Minus className="h-4 w-4 mr-2" />
            Saída
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral do Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{product.stock}</p>
                  <p className="text-sm text-gray-500">Em Estoque</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">+{stats.totalIn}</p>
                  <p className="text-sm text-gray-500">Entradas (mês)</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">-{stats.totalOut}</p>
                  <p className="text-sm text-gray-500">Saídas (mês)</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{stats.daysUntilOut}</p>
                  <p className="text-sm text-gray-500">Dias até acabar</p>
                </div>
              </div>

              {product.stock <= product.minStock && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Estoque baixo</p>
                    <p className="text-sm text-yellow-700">
                      Recomendamos fazer uma nova compra em breve.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movements History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Últimas movimentações do produto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
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
                        <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                          {movement.type === 'in' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-semibold ${
                        movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
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

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Código de Barras</p>
                <div className="flex items-center gap-2 mt-1">
                  <Barcode className="h-4 w-4 text-gray-400" />
                  <code className="text-sm">{product.barcode}</code>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <Badge variant="outline" className="mt-1">{product.category}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Marca</p>
                <p className="font-medium">{product.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fornecedor</p>
                <p className="font-medium">{product.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium">{product.location}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Precificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Preço de Compra</span>
                <span className="font-medium">R$ {product.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Preço de Venda</span>
                <span className="font-medium text-green-600">R$ {product.salePrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Margem</span>
                <span className="font-bold text-purple-600">
                  {(((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor em Estoque</span>
                <span className="font-bold">
                  R$ {(product.stock * product.purchasePrice).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stock Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Níveis de Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Estoque Mínimo</span>
                <Badge variant="outline">{product.minStock} un.</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Estoque Máximo</span>
                <Badge variant="outline">{product.maxStock} un.</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Consumo Médio/Mês</span>
                <Badge variant="outline">{stats.averageMonthly} un.</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
