'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
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

// Tipos para dados financeiros
interface FinancialStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: typeof TrendingUp;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  method: string;
}

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
}

interface FinancialData {
  stats: FinancialStat[];
  recentTransactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

// Mock data
const mockStats: FinancialStat[] = [
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

const mockRecentTransactions: Transaction[] = [
  { id: '1', description: 'Corte + Escova - Maria Silva', amount: 120.00, type: 'income', date: '30/01 10:30', method: 'Cartão Crédito' },
  { id: '2', description: 'Produtos de limpeza', amount: -156.00, type: 'expense', date: '30/01 09:15', method: 'PIX' },
  { id: '3', description: 'Barba - João Santos', amount: 40.00, type: 'income', date: '30/01 09:00', method: 'Dinheiro' },
  { id: '4', description: 'Coloração - Ana Oliveira', amount: 250.00, type: 'income', date: '29/01 16:30', method: 'Cartão Débito' },
  { id: '5', description: 'Energia elétrica', amount: -320.00, type: 'expense', date: '29/01 14:00', method: 'Débito Automático' },
  { id: '6', description: 'Manicure + Pedicure - Carla Mendes', amount: 100.00, type: 'income', date: '29/01 11:00', method: 'PIX' },
];

const mockPaymentMethods: PaymentMethod[] = [
  { method: 'Cartão Crédito', amount: 8450.00, percentage: 34 },
  { method: 'Cartão Débito', amount: 6230.00, percentage: 25 },
  { method: 'PIX', amount: 7400.00, percentage: 30 },
  { method: 'Dinheiro', amount: 2500.00, percentage: 11 },
];

const mockFinancialData: FinancialData = {
  stats: mockStats,
  recentTransactions: mockRecentTransactions,
  paymentMethods: mockPaymentMethods,
};

// Função para buscar dados financeiros - substituir por API real
const fetchFinancialData = async (): Promise<FinancialData> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockFinancialData;
};

export default function FinancialPage() {
  // Hook de dados assíncronos com cache
  const { data: financialData, isLoading } = usePageData(
    fetchFinancialData,
    { cacheKey: 'financial-overview', initialData: mockFinancialData }
  );

  const { stats, recentTransactions, paymentMethods } = financialData || mockFinancialData;

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
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3" style={{ letterSpacing: '-0.02em' }}>
            <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-950/30">
              <Wallet className="w-5 h-5 text-ruby-500" />
            </div>
            Financeiro
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Acompanhe as finanças do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300">
            <Calendar className="h-[18px] w-[18px]" />
            Janeiro 2026
          </Button>
          <Link href="/financial/transactions">
            <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-500 to-ruby-600 hover:shadow-[0_4px_16px_rgba(177,35,61,0.2)] transition-all duration-300">
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
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1" style={{ letterSpacing: '-0.02em' }}>{stat.value}</p>
                      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-[15px] w-[15px]" />
                        ) : (
                          <ArrowDownRight className="h-[15px] w-[15px]" />
                        )}
                        {stat.change}
                        <span className="text-gray-400 font-normal text-xs">vs mês anterior</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl ${
                      stat.trend === 'up' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30' 
                        : 'bg-red-50 dark:bg-red-900/30'
                    }`}>
                      <stat.icon className={`h-[18px] w-[18px] ${
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ letterSpacing: '-0.02em' }}>Transações Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-300">
                <Filter className="h-[15px] w-[15px]" />
                Filtrar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        transaction.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30'
                          : 'bg-red-50 dark:bg-red-900/30'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-[15px] w-[15px] text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-[15px] w-[15px] text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm" style={{ letterSpacing: '-0.01em' }}>{transaction.description}</p>
                        <p className="text-xs text-gray-400">{transaction.date} • {transaction.method}</p>
                      </div>
                    </div>
                    <span className={`font-medium ${
                      transaction.type === 'income' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-300">
                Ver todas as transações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div>
          <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle style={{ letterSpacing: '-0.02em' }}>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((item) => (
                  <div key={item.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.method}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100/80 dark:bg-gray-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="h-full bg-gradient-to-r from-ruby-500 to-ruby-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Recebido</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
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
