'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Wallet,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode,
  Lock,
  Unlock,
  Clock,
  Plus,
  Minus,
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
      <Link href="/dashboard/financial" className="hover:text-gray-700">
        Financeiro
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Caixa</span>
    </nav>
  );
}

export default function CashierPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [openingAmount, setOpeningAmount] = useState('');

  // Mock data
  const cashier = {
    status: 'open',
    openedAt: '29/01/2026 08:00',
    openedBy: 'Maria Administradora',
    openingBalance: 200.0,
    currentBalance: 1580.0,
    cash: 850.0,
    card: 580.0,
    pix: 150.0,
  };

  const movements = [
    { id: '1', type: 'income', description: 'Corte - Maria Silva', value: 80, method: 'Dinheiro', time: '09:30' },
    { id: '2', type: 'income', description: 'Coloração - Paula', value: 200, method: 'Cartão', time: '11:00' },
    { id: '3', type: 'income', description: 'Escova - Juliana', value: 60, method: 'PIX', time: '13:00' },
    { id: '4', type: 'expense', description: 'Sangria - Depósito', value: 500, method: 'Dinheiro', time: '14:00' },
    { id: '5', type: 'income', description: 'Barba - João', value: 45, method: 'Dinheiro', time: '15:30' },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Caixa</h1>
            <p className="text-gray-500 mt-1">Controle de abertura e fechamento</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOpen ? 'default' : 'secondary'} className="text-sm py-1 px-3">
            {isOpen ? (
              <>
                <Unlock className="h-4 w-4 mr-1" />
                Caixa Aberto
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-1" />
                Caixa Fechado
              </>
            )}
          </Badge>
        </div>
      </div>

      {isOpen ? (
        <>
          {/* Cashier Open State */}
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saldo Atual</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {cashier.currentBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Banknote className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dinheiro</p>
                    <p className="text-2xl font-bold">R$ {cashier.cash.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cartão</p>
                    <p className="text-2xl font-bold">R$ {cashier.card.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <QrCode className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PIX</p>
                    <p className="text-2xl font-bold">R$ {cashier.pix.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              Suprimento
            </Button>
            <Button variant="outline" className="h-20">
              <Minus className="h-5 w-5 mr-2 text-red-600" />
              Sangria
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-20">
                  <Lock className="h-5 w-5 mr-2" />
                  Fechar Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechar Caixa</DialogTitle>
                  <DialogDescription>
                    Confirme os valores para fechar o caixa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Contagem de Dinheiro</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Atenção</p>
                      <p className="text-sm text-yellow-700">
                        Após fechar o caixa, não será possível adicionar novos pagamentos.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button variant="destructive">Confirmar Fechamento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações de Hoje</CardTitle>
              <CardDescription>
                Aberto em {cashier.openedAt} por {cashier.openedBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {movement.type === 'income' ? (
                          <Plus className="h-4 w-4 text-green-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{movement.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{movement.time}</span>
                          <Badge variant="outline" className="text-xs">{movement.method}</Badge>
                        </div>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'income' ? '+' : '-'} R$ {movement.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Cashier Closed State */
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-gray-600" />
            </div>
            <CardTitle>Caixa Fechado</CardTitle>
            <CardDescription>
              Abra o caixa para iniciar as operações do dia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openingAmount">Valor de Abertura (R$)</Label>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                placeholder="200.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Informe o valor inicial em dinheiro no caixa
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => setIsOpen(true)}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
