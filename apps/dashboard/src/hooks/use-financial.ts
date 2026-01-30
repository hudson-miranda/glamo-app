import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  TransactionQuery,
  CommissionQuery,
  Transaction,
  CashierTransaction,
} from '@/services/financial.service';

export const financialKeys = {
  all: ['financial'] as const,
  summary: (startDate?: string, endDate?: string) => [...financialKeys.all, 'summary', startDate, endDate] as const,
  transactions: () => [...financialKeys.all, 'transactions'] as const,
  transactionsList: (query?: TransactionQuery) => [...financialKeys.transactions(), query] as const,
  cashier: () => [...financialKeys.all, 'cashier'] as const,
  currentCashier: () => [...financialKeys.cashier(), 'current'] as const,
  commissions: () => [...financialKeys.all, 'commissions'] as const,
  commissionsList: (query?: CommissionQuery) => [...financialKeys.commissions(), query] as const,
};

export function useFinancialSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: financialKeys.summary(startDate, endDate),
    queryFn: () => financialService.getSummary(startDate, endDate),
  });
}

export function useTransactions(query?: TransactionQuery) {
  return useQuery({
    queryKey: financialKeys.transactionsList(query),
    queryFn: () => financialService.listTransactions(query),
  });
}

export function useCurrentCashier() {
  return useQuery({
    queryKey: financialKeys.currentCashier(),
    queryFn: () => financialService.getCurrentCashier(),
  });
}

export function useCommissions(query?: CommissionQuery) {
  return useQuery({
    queryKey: financialKeys.commissionsList(query),
    queryFn: () => financialService.listCommissions(query),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Transaction>) => financialService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.cashier() });
    },
  });
}

export function useOpenCashier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ openingBalance, notes }: { openingBalance: number; notes?: string }) =>
      financialService.openCashier(openingBalance, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.cashier() });
    },
  });
}

export function useCloseCashier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ closingBalance, notes }: { closingBalance: number; notes?: string }) =>
      financialService.closeCashier(closingBalance, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.cashier() });
    },
  });
}

export function useAddCashierTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CashierTransaction>) =>
      financialService.addCashierTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.cashier() });
    },
  });
}

export function usePayCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commissionIds: string[]) => financialService.payCommissions(commissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.commissions() });
    },
  });
}
