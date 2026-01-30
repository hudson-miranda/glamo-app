import { Injectable, Logger } from '@nestjs/common';
import { FinancialRepository } from '../repositories';
import {
  CashFlowType,
  CashFlowSummary,
  RevenueReport,
  PaymentMethod,
  TransactionCategory,
} from '../interfaces';
import { addDays, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly repository: FinancialRepository) {}

  // ========================
  // CASH FLOW
  // ========================

  async getCashFlowSummary(
    startDate: Date,
    endDate: Date,
    includeProjected: boolean = false,
  ): Promise<CashFlowSummary> {
    const entries = await this.repository.findCashFlowEntries(
      startDate,
      endDate,
      includeProjected,
    );

    // Calcular totais
    let totalInflows = 0;
    let totalOutflows = 0;
    const inflowsByCategory: Record<string, number> = {};
    const outflowsByCategory: Record<string, number> = {};

    entries.forEach((entry) => {
      if (entry.type === CashFlowType.INFLOW) {
        totalInflows += entry.amount;
        inflowsByCategory[entry.category] =
          (inflowsByCategory[entry.category] || 0) + entry.amount;
      } else {
        totalOutflows += entry.amount;
        outflowsByCategory[entry.category] =
          (outflowsByCategory[entry.category] || 0) + entry.amount;
      }
    });

    // Calcular fluxo diário
    const dailyFlow = this.calculateDailyFlow(entries, startDate, endDate);

    // Obter saldo atual como base
    const currentBalance = await this.repository.getCurrentBalance();
    const openingBalance = currentBalance - (totalInflows - totalOutflows);

    return {
      period: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
      startDate,
      endDate,
      openingBalance,
      closingBalance: currentBalance,
      totalInflows,
      totalOutflows,
      netFlow: totalInflows - totalOutflows,
      inflowsByCategory,
      outflowsByCategory,
      dailyFlow,
    };
  }

  private calculateDailyFlow(
    entries: any[],
    startDate: Date,
    endDate: Date,
  ): Array<{ date: string; inflow: number; outflow: number; balance: number }> {
    const days = differenceInDays(endDate, startDate) + 1;
    const dailyFlow: Array<{
      date: string;
      inflow: number;
      outflow: number;
      balance: number;
    }> = [];

    let runningBalance = 0;

    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayEntries = entries.filter(
        (e) => format(new Date(e.entryDate), 'yyyy-MM-dd') === dateStr,
      );

      const inflow = dayEntries
        .filter((e) => e.type === CashFlowType.INFLOW)
        .reduce((sum, e) => sum + e.amount, 0);

      const outflow = dayEntries
        .filter((e) => e.type === CashFlowType.OUTFLOW)
        .reduce((sum, e) => sum + e.amount, 0);

      runningBalance += inflow - outflow;

      dailyFlow.push({
        date: dateStr,
        inflow,
        outflow,
        balance: runningBalance,
      });
    }

    return dailyFlow;
  }

  // ========================
  // REVENUE REPORT
  // ========================

  async getRevenueReport(
    startDate: Date,
    endDate: Date,
    options: {
      groupBy?: 'day' | 'week' | 'month';
      includeComparison?: boolean;
    } = {},
  ): Promise<RevenueReport> {
    const payments = await this.repository.findPaymentsByDateRange(startDate, endDate);
    const stats = await this.repository.getPaymentStats(startDate, endDate);

    // Agrupar por método de pagamento
    const byPaymentMethod: Record<PaymentMethod, number> = {} as any;
    payments.forEach((payment) => {
      byPaymentMethod[payment.method] =
        (byPaymentMethod[payment.method] || 0) + payment.amount;
    });

    // Agrupar por categoria (simplificado)
    const byCategory: Record<TransactionCategory, number> = {} as any;
    byCategory[TransactionCategory.SERVICE] = stats.total; // Simplificado

    // Comparação com período anterior
    let comparison;
    if (options.includeComparison) {
      const periodLength = differenceInDays(endDate, startDate) + 1;
      const previousStart = addDays(startDate, -periodLength);
      const previousEnd = addDays(startDate, -1);

      const previousStats = await this.repository.getPaymentStats(
        previousStart,
        previousEnd,
      );

      const percentageChange = previousStats.total
        ? ((stats.total - previousStats.total) / previousStats.total) * 100
        : 100;

      comparison = {
        previousPeriod: previousStats.total,
        percentageChange: Math.round(percentageChange * 100) / 100,
      };
    }

    return {
      period: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
      startDate,
      endDate,
      totalRevenue: stats.total,
      totalRefunds: 0, // Calcular separadamente
      netRevenue: stats.net,
      byPaymentMethod,
      byCategory,
      byProfessional: [], // Precisaria de JOIN com appointments
      byService: [], // Precisaria de JOIN com services
      comparison,
    };
  }

  // ========================
  // DAILY CLOSING
  // ========================

  async generateDailyClosingReport(date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const payments = await this.repository.findPaymentsByDateRange(start, end);

    // Calcular totais por método
    let cashTotal = 0;
    let cardTotal = 0;
    let pixTotal = 0;
    let otherTotal = 0;
    let totalTips = 0;
    let totalDiscounts = 0;

    payments.forEach((payment) => {
      const amount = payment.amount || 0;
      totalTips += payment.tip || 0;
      totalDiscounts += payment.discount || 0;

      switch (payment.method) {
        case PaymentMethod.CASH:
          cashTotal += amount;
          break;
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          cardTotal += amount;
          break;
        case PaymentMethod.PIX:
          pixTotal += amount;
          break;
        default:
          otherTotal += amount;
      }
    });

    const totalSales = cashTotal + cardTotal + pixTotal + otherTotal;

    return {
      date,
      totalSales,
      salesCount: payments.length,
      cashTotal,
      cardTotal,
      pixTotal,
      otherTotal,
      totalDiscounts,
      totalTips,
      totalCommissions: 0, // Calculado pelo módulo de comissões
      netAmount: totalSales + totalTips - totalDiscounts,
    };
  }

  // ========================
  // TRENDS
  // ========================

  async getRevenueTrends(
    days: number = 30,
  ): Promise<Array<{ date: string; revenue: number; count: number }>> {
    const endDate = new Date();
    const startDate = addDays(endDate, -days);
    const payments = await this.repository.findPaymentsByDateRange(startDate, endDate);

    // Agrupar por dia
    const trends: Record<string, { revenue: number; count: number }> = {};

    for (let i = 0; i <= days; i++) {
      const date = format(addDays(startDate, i), 'yyyy-MM-dd');
      trends[date] = { revenue: 0, count: 0 };
    }

    payments.forEach((payment) => {
      const date = format(new Date(payment.paidAt), 'yyyy-MM-dd');
      if (trends[date]) {
        trends[date].revenue += payment.amount || 0;
        trends[date].count += 1;
      }
    });

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}
