'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Download,
  MoreVertical,
  Eye,
  Receipt,
  RefreshCw
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
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

// Tipo para transações
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'refund';
  description: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'transfer';
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
  category: string;
  professional: string | null;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    description: 'Corte + Escova - Maria Silva',
    amount: 150.00,
    paymentMethod: 'credit_card',
    status: 'completed',
    date: '2026-01-20T14:30:00',
    category: 'Serviço',
    professional: 'Ana Paula'
  },
  {
    id: '2',
    type: 'income',
    description: 'Manicure + Pedicure - Julia Santos',
    amount: 80.00,
    paymentMethod: 'pix',
    status: 'completed',
    date: '2026-01-20T12:00:00',
    category: 'Serviço',
    professional: 'Carla Souza'
  },
  {
    id: '3',
    type: 'expense',
    description: 'Compra de Produtos - Fornecedor X',
    amount: 450.00,
    paymentMethod: 'transfer',
    status: 'completed',
    date: '2026-01-20T10:00:00',
    category: 'Estoque',
    professional: null
  },
  {
    id: '4',
    type: 'income',
    description: 'Coloração - Ana Costa',
    amount: 280.00,
    paymentMethod: 'debit_card',
    status: 'completed',
    date: '2026-01-19T16:45:00',
    category: 'Serviço',
    professional: 'Fernanda Lima'
  },
  {
    id: '5',
    type: 'income',
    description: 'Tratamento Capilar - Patrícia Mendes',
    amount: 320.00,
    paymentMethod: 'cash',
    status: 'pending',
    date: '2026-01-19T15:00:00',
    category: 'Serviço',
    professional: 'Ana Paula'
  },
  {
    id: '6',
    type: 'expense',
    description: 'Conta de Luz',
    amount: 380.00,
    paymentMethod: 'transfer',
    status: 'completed',
    date: '2026-01-18T09:00:00',
    category: 'Despesa Fixa',
    professional: null
  },
  {
    id: '7',
    type: 'income',
    description: 'Design de Sobrancelhas - Fernanda Alves',
    amount: 60.00,
    paymentMethod: 'pix',
    status: 'completed',
    date: '2026-01-18T11:30:00',
    category: 'Serviço',
    professional: 'Juliana Martins'
  },
  {
    id: '8',
    type: 'refund',
    description: 'Estorno - Cliente insatisfeito',
    amount: 80.00,
    paymentMethod: 'credit_card',
    status: 'completed',
    date: '2026-01-17T14:00:00',
    category: 'Estorno',
    professional: null
  },
];

const paymentIcons = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  pix: QrCode,
  cash: Banknote,
  transfer: RefreshCw,
};

const paymentLabels = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
  transfer: 'Transferência',
};

const statusColors = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels = {
  completed: 'Concluída',
  pending: 'Pendente',
  cancelled: 'Cancelada',
};

// Função para buscar transações - substituir por API real
const fetchTransactions = async (): Promise<Transaction[]> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockTransactions;
};

export default function TransactionsPage() {
  const [filter, setFilter] = useState('all');
  
  // Hook de dados assíncronos com cache
  const { data: transactions = [], isLoading } = usePageData(
    fetchTransactions,
    { cacheKey: 'financial-transactions', initialData: mockTransactions }
  );
  
  const stats = [
    { 
      label: 'Receitas (Mês)', 
      value: formatCurrency(12450), 
      icon: ArrowUpRight, 
      color: 'emerald',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    { 
      label: 'Despesas (Mês)', 
      value: formatCurrency(3280), 
      icon: ArrowDownRight, 
      color: 'red',
      bgLight: 'bg-red-50 dark:bg-red-950/50',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    { 
      label: 'Saldo do Mês', 
      value: formatCurrency(9170), 
      icon: DollarSign, 
      color: 'blue',
      bgLight: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: 'Transações', 
      value: '156', 
      icon: Receipt, 
      color: 'purple',
      bgLight: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
  ];

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
        </div>
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-96" />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Histórico completo de movimentações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-ruby-600 hover:bg-ruby-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl ${stat.bgLight} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filters and Search */}
      <AnimatedCard>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
              >
                <option value="all">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
                <option value="refund">Estornos</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Transactions List */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-ruby-500" />
            Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const PaymentIcon = paymentIcons[transaction.paymentMethod as keyof typeof paymentIcons];
              return (
                <motion.div
                  key={transaction.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                        : transaction.type === 'expense'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      ) : transaction.type === 'expense' ? (
                        <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <RefreshCw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{transaction.description}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <PaymentIcon className="h-3 w-3" />
                          {paymentLabels[transaction.paymentMethod as keyof typeof paymentLabels]}
                        </span>
                        <span className="text-xs text-gray-500">{transaction.category}</span>
                        {transaction.professional && (
                          <span className="text-xs text-gray-500">• {transaction.professional}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : transaction.type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')} às {new Date(transaction.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                      {statusLabels[transaction.status as keyof typeof statusLabels]}
                    </span>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">Mostrando 8 de 156 transações</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm">Próxima</Button>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
