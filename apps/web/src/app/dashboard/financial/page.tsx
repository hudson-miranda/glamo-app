'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  CreditCard,
  Banknote,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  StaggerContainer, 
  StaggerItem, 
  AnimatedCard,
  Skeleton,
  SkeletonCard,
  SkeletonList,
} from '@/components/ui';

// Mock data
const stats = [
  {
    label: 'Receita do Mês',
    value: 'R$ 24.580,00',
    change: '+12.5%',
    trend: 'up',
    icon: TrendingUp
  },
  {
    label: 'Despesas do Mês',
    value: 'R$ 8.420,00',
    change: '-3.2%',
    trend: 'down',
    icon: TrendingDown
  },
  {
    label: 'Lucro Líquido',
    value: 'R$ 16.160,00',
    change: '+18.7%',
    trend: 'up',
    icon: PiggyBank
  },
  {
    label: 'Ticket Médio',
    value: 'R$ 156,00',
    change: '+5.3%',
    trend: 'up',
    icon: CreditCard
  }
];

const recentTransactions = [
  { id: '1', description: 'Corte + Escova - Maria Silva', amount: 120.00, type: 'income', date: '30/01 10:30', method: 'Cartão Crédito' },
  { id: '2', description: 'Produtos de limpeza', amount: -156.00, type: 'expense', date: '30/01 09:15', method: 'PIX' },
  { id: '3', description: 'Barba - João Santos', amount: 40.00, type: 'income', date: '30/01 09:00', method: 'Dinheiro' },
  { id: '4', description: 'Coloração - Ana Oliveira', amount: 250.00, type: 'income', date: '29/01 16:30', method: 'Cartão Débito' },
  { id: '5', description: 'Energia elétrica', amount: -320.00, type: 'expense', date: '29/01 14:00', method: 'Débito Automático' },
  { id: '6', description: 'Manicure + Pedicure - Carla Mendes', amount: 100.00, type: 'income', date: '29/01 11:00', method: 'PIX' },
];

const paymentMethods = [
  { method: 'Cartão Crédito', amount: 8450.00, percentage: 34 },
  { method: 'Cartão Débito', amount: 6230.00, percentage: 25 },
  { method: 'PIX', amount: 7400.00, percentage: 30 },
  { method: 'Dinheiro', amount: 2500.00, percentage: 11 },
];

export default function FinancialPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonList rows={6} />
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-ruby-500" />
            Financeiro
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe as finanças do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Calendar className="h-4 w-4" />
            Janeiro 2026
          </Button>
          <Link href="/dashboard/financial/transactions">
            <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
              <DollarSign className="h-4 w-4" />
              Nova Transação
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {stat.change}
                        <span className="text-gray-400 font-normal">vs mês anterior</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      stat.trend === 'up' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <stat.icon className={`h-5 w-5 ${
                        stat.trend === 'up' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        transaction.type === 'income'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{transaction.date} • {transaction.method}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 rounded-xl">
                Ver todas as transações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((item) => (
                  <div key={item.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.method}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-ruby-500 to-ruby-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Recebido</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    R$ {paymentMethods.reduce((acc, item) => acc + item.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
