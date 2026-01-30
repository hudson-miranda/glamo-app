import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
  appointmentId?: string;
  customerId?: string;
  professionalId?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  createdAt: string;
}

export interface Cashier {
  id: string;
  date: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  currentBalance: number;
  expectedBalance: number;
  status: 'open' | 'closed';
  openedBy: string;
  closedBy?: string;
  notes?: string;
  transactions: CashierTransaction[];
}

export interface CashierTransaction {
  id: string;
  type: 'income' | 'expense' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  professionalId: string;
  professional: { id: string; name: string };
  appointmentId: string;
  serviceAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  periodStart: string;
  periodEnd: string;
}

export interface FinancialSummary {
  revenue: { value: number; change: number };
  expenses: { value: number; change: number };
  profit: { value: number; change: number };
  pendingPayments: { value: number; count: number };
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
}

export interface CommissionQuery {
  page?: number;
  limit?: number;
  professionalId?: string;
  status?: 'pending' | 'paid';
  startDate?: string;
  endDate?: string;
}

export const financialService = {
  // Summary
  async getSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const response = await api.get<FinancialSummary>('/financial/summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Transactions
  async listTransactions(query?: TransactionQuery): Promise<PaginatedResponse<Transaction>> {
    const response = await api.get<PaginatedResponse<Transaction>>('/financial/transactions', {
      params: query,
    });
    return response.data;
  },

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const response = await api.post<Transaction>('/financial/transactions', data);
    return response.data;
  },

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const response = await api.patch<Transaction>(`/financial/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/financial/transactions/${id}`);
  },

  // Cashier
  async getCurrentCashier(): Promise<Cashier | null> {
    const response = await api.get<Cashier | null>('/financial/cashier/current');
    return response.data;
  },

  async openCashier(openingBalance: number, notes?: string): Promise<Cashier> {
    const response = await api.post<Cashier>('/financial/cashier/open', {
      openingBalance,
      notes,
    });
    return response.data;
  },

  async closeCashier(closingBalance: number, notes?: string): Promise<Cashier> {
    const response = await api.post<Cashier>('/financial/cashier/close', {
      closingBalance,
      notes,
    });
    return response.data;
  },

  async addCashierTransaction(data: Partial<CashierTransaction>): Promise<CashierTransaction> {
    const response = await api.post<CashierTransaction>('/financial/cashier/transaction', data);
    return response.data;
  },

  // Commissions
  async listCommissions(query?: CommissionQuery): Promise<PaginatedResponse<Commission>> {
    const response = await api.get<PaginatedResponse<Commission>>('/financial/commissions', {
      params: query,
    });
    return response.data;
  },

  async payCommissions(commissionIds: string[]): Promise<void> {
    await api.post('/financial/commissions/pay', { commissionIds });
  },

  // Reports
  async getRevenueReport(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month') {
    const response = await api.get('/financial/reports/revenue', {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getExpenseReport(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month') {
    const response = await api.get('/financial/reports/expenses', {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getCashFlowReport(startDate: string, endDate: string) {
    const response = await api.get('/financial/reports/cash-flow', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
