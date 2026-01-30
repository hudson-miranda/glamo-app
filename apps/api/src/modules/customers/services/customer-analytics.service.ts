import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import {
  CustomerAnalytics,
  CustomerFinancialAnalytics,
  CustomerBehaviorAnalytics,
  CustomerEngagementAnalytics,
  CustomerLoyaltyAnalytics,
  CustomerTimelineItem,
  MonthlySpending,
  ServicePreference,
  DayPreference,
  TimePreference,
  PointsTransaction,
  RedemptionRecord,
} from '../interfaces';
import { LoyaltyTier, getTierByPoints, getPointsToNextTier } from '../interfaces';
import { differenceInDays, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Serviço de analytics de clientes
 */
@Injectable()
export class CustomerAnalyticsService {
  private readonly logger = new Logger(CustomerAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  /**
   * Obtém analytics completo do cliente
   */
  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const [financial, behavior, engagement, loyalty, segments] = await Promise.all([
      this.getFinancialAnalytics(customerId),
      this.getBehaviorAnalytics(customerId),
      this.getEngagementAnalytics(customerId),
      this.getLoyaltyAnalytics(customerId),
      this.getCustomerSegments(customerId),
    ]);

    return {
      customerId,
      customerName: customer.name,
      financial,
      behavior,
      engagement,
      loyalty,
      segments,
      calculatedAt: new Date(),
    };
  }

  /**
   * Analytics financeiro
   */
  async getFinancialAnalytics(customerId: string): Promise<CustomerFinancialAnalytics> {
    // Buscar total gasto
    const totalResult = await this.prisma.appointment.aggregate({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      _sum: {
        finalPrice: true,
      },
      _count: true,
    });

    const totalSpent = totalResult._sum.finalPrice?.toNumber() || 0;
    const totalAppointments = totalResult._count || 0;
    const averageTicket = totalAppointments > 0 ? totalSpent / totalAppointments : 0;

    // Última compra
    const lastAppointment = await this.prisma.appointment.findFirst({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      orderBy: { endTime: 'desc' },
      select: { finalPrice: true, endTime: true },
    });

    // Gastos mensais (últimos 12 meses)
    const monthlySpending = await this.getMonthlySpending(customerId);

    // Calcular tendência
    const spendingTrend = this.calculateSpendingTrend(monthlySpending);

    return {
      totalSpent,
      averageTicket,
      lastPurchaseValue: lastAppointment?.finalPrice?.toNumber() || 0,
      lastPurchaseDate: lastAppointment?.endTime || undefined,
      spendingTrend,
      monthlySpending,
    };
  }

  /**
   * Gastos mensais
   */
  private async getMonthlySpending(customerId: string): Promise<MonthlySpending[]> {
    const result: MonthlySpending[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');

      const monthData = await this.prisma.appointment.aggregate({
        where: {
          customerId,
          status: 'COMPLETED',
          endTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { finalPrice: true },
        _count: true,
      });

      result.push({
        month: monthKey,
        amount: monthData._sum.finalPrice?.toNumber() || 0,
        appointmentCount: monthData._count || 0,
      });
    }

    return result.reverse();
  }

  /**
   * Calcula tendência de gastos
   */
  private calculateSpendingTrend(monthly: MonthlySpending[]): 'UP' | 'DOWN' | 'STABLE' {
    if (monthly.length < 3) return 'STABLE';

    const recent = monthly.slice(-3).reduce((sum, m) => sum + m.amount, 0) / 3;
    const previous = monthly.slice(-6, -3).reduce((sum, m) => sum + m.amount, 0) / 3;

    if (previous === 0) return recent > 0 ? 'UP' : 'STABLE';

    const change = ((recent - previous) / previous) * 100;

    if (change > 10) return 'UP';
    if (change < -10) return 'DOWN';
    return 'STABLE';
  }

  /**
   * Analytics de comportamento
   */
  async getBehaviorAnalytics(customerId: string): Promise<CustomerBehaviorAnalytics> {
    const [favoriteServices, favoriteProfessional, preferredDays, preferredTimes, avgAdvance] =
      await Promise.all([
        this.getFavoriteServices(customerId),
        this.getFavoriteProfessional(customerId),
        this.getPreferredDays(customerId),
        this.getPreferredTimes(customerId),
        this.getAverageBookingAdvance(customerId),
      ]);

    return {
      favoriteServices,
      favoriteProfessional,
      preferredDays,
      preferredTimes,
      averageBookingAdvance: avgAdvance,
    };
  }

  /**
   * Serviços favoritos
   */
  private async getFavoriteServices(customerId: string): Promise<ServicePreference[]> {
    const services = await this.prisma.appointmentService.groupBy({
      by: ['serviceId'],
      where: {
        appointment: {
          customerId,
          status: 'COMPLETED',
        },
      },
      _count: true,
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: 5,
    });

    const total = services.reduce((sum, s) => sum + s._count, 0);

    const result: ServicePreference[] = [];
    for (const s of services) {
      const service = await this.prisma.service.findUnique({
        where: { id: s.serviceId },
        select: { name: true },
      });

      const lastUsed = await this.prisma.appointmentService.findFirst({
        where: {
          serviceId: s.serviceId,
          appointment: { customerId, status: 'COMPLETED' },
        },
        orderBy: { appointment: { endTime: 'desc' } },
        select: { appointment: { select: { endTime: true } } },
      });

      result.push({
        serviceId: s.serviceId,
        serviceName: service?.name || 'Serviço desconhecido',
        count: s._count,
        percentage: total > 0 ? (s._count / total) * 100 : 0,
        lastUsed: lastUsed?.appointment.endTime || new Date(),
      });
    }

    return result;
  }

  /**
   * Profissional favorito
   */
  private async getFavoriteProfessional(customerId: string) {
    const professionals = await this.prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        customerId,
        status: 'COMPLETED',
      },
      _count: true,
      orderBy: {
        _count: {
          professionalId: 'desc',
        },
      },
      take: 1,
    });

    if (professionals.length === 0) return undefined;

    const favorite = professionals[0];
    const total = await this.prisma.appointment.count({
      where: { customerId, status: 'COMPLETED' },
    });

    const professional = await this.prisma.professional.findUnique({
      where: { id: favorite.professionalId },
      select: { name: true },
    });

    return {
      professionalId: favorite.professionalId,
      professionalName: professional?.name || 'Profissional desconhecido',
      appointmentCount: favorite._count,
      percentage: total > 0 ? (favorite._count / total) * 100 : 0,
    };
  }

  /**
   * Dias preferidos
   */
  private async getPreferredDays(customerId: string): Promise<DayPreference[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId, status: 'COMPLETED' },
      select: { startTime: true },
    });

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayCounts = new Array(7).fill(0);

    appointments.forEach((apt) => {
      const day = apt.startTime.getDay();
      dayCounts[day]++;
    });

    const total = appointments.length;

    return dayCounts.map((count, index) => ({
      dayOfWeek: index,
      dayName: dayNames[index],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  /**
   * Horários preferidos
   */
  private async getPreferredTimes(customerId: string): Promise<TimePreference[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId, status: 'COMPLETED' },
      select: { startTime: true },
    });

    const timeCounts = { morning: 0, afternoon: 0, evening: 0 };

    appointments.forEach((apt) => {
      const hour = apt.startTime.getHours();
      if (hour < 12) timeCounts.morning++;
      else if (hour < 18) timeCounts.afternoon++;
      else timeCounts.evening++;
    });

    const total = appointments.length;

    return [
      { timeSlot: 'morning', count: timeCounts.morning, percentage: total > 0 ? (timeCounts.morning / total) * 100 : 0 },
      { timeSlot: 'afternoon', count: timeCounts.afternoon, percentage: total > 0 ? (timeCounts.afternoon / total) * 100 : 0 },
      { timeSlot: 'evening', count: timeCounts.evening, percentage: total > 0 ? (timeCounts.evening / total) * 100 : 0 },
    ];
  }

  /**
   * Antecedência média de agendamento
   */
  private async getAverageBookingAdvance(customerId: string): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId },
      select: { startTime: true, createdAt: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    if (appointments.length === 0) return 0;

    const totalDays = appointments.reduce((sum, apt) => {
      return sum + differenceInDays(apt.startTime, apt.createdAt);
    }, 0);

    return Math.round(totalDays / appointments.length);
  }

  /**
   * Analytics de engajamento
   */
  async getEngagementAnalytics(customerId: string): Promise<CustomerEngagementAnalytics> {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: { customerId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    let total = 0;
    appointments.forEach((a) => {
      statusCounts[a.status] = a._count;
      total += a._count;
    });

    const completed = statusCounts['COMPLETED'] || 0;
    const cancelled = statusCounts['CANCELLED'] || 0;
    const noShow = statusCounts['NO_SHOW'] || 0;

    // Primeiro e último agendamento
    const [first, last, upcoming] = await Promise.all([
      this.prisma.appointment.findFirst({
        where: { customerId },
        orderBy: { startTime: 'asc' },
        select: { startTime: true },
      }),
      this.prisma.appointment.findFirst({
        where: { customerId, status: 'COMPLETED' },
        orderBy: { endTime: 'desc' },
        select: { endTime: true },
      }),
      this.prisma.appointment.count({
        where: {
          customerId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { gte: new Date() },
        },
      }),
    ]);

    // Avaliação média
    const ratings = await this.prisma.review.aggregate({
      where: { customerId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      appointmentHistory: {
        total,
        completed,
        cancelled,
        noShow,
        upcoming,
        firstAppointment: first?.startTime,
        lastAppointment: last?.endTime,
      },
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      averageRating: ratings._avg.rating || undefined,
      ratingCount: ratings._count || 0,
      feedbackCount: ratings._count || 0,
      lastInteraction: last?.endTime,
    };
  }

  /**
   * Analytics de fidelidade
   */
  async getLoyaltyAnalytics(customerId: string): Promise<CustomerLoyaltyAnalytics> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const points = customer.loyaltyPoints || 0;
    const tierConfig = getTierByPoints(points);
    const pointsToNext = getPointsToNextTier(points);
    const tierProgress = tierConfig.maxPoints === Infinity
      ? 100
      : ((points - tierConfig.minPoints) / (tierConfig.maxPoints - tierConfig.minPoints)) * 100;

    // Histórico de pontos
    const pointsHistory = await this.getPointsHistory(customerId);

    // Histórico de resgates
    const redemptionHistory = await this.getRedemptionHistory(customerId);

    // Totais
    const totalEarned = pointsHistory
      .filter((p) => p.type === 'EARN')
      .reduce((sum, p) => sum + p.points, 0);
    const totalRedeemed = pointsHistory
      .filter((p) => p.type === 'REDEEM')
      .reduce((sum, p) => sum + Math.abs(p.points), 0);

    return {
      currentTier: (customer.loyaltyTier as LoyaltyTier) || LoyaltyTier.BRONZE,
      tierName: tierConfig.tier,
      pointsBalance: points,
      pointsToNextTier: pointsToNext,
      tierProgress: Math.min(100, tierProgress),
      pointsHistory,
      redemptionHistory,
      totalPointsEarned: totalEarned,
      totalPointsRedeemed: totalRedeemed,
    };
  }

  /**
   * Histórico de transações de pontos
   */
  private async getPointsHistory(customerId: string): Promise<PointsTransaction[]> {
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type as 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST',
      points: t.points,
      balance: t.balanceAfter,
      description: t.description,
      referenceId: t.referenceId || undefined,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Histórico de resgates
   */
  private async getRedemptionHistory(customerId: string): Promise<RedemptionRecord[]> {
    const redemptions = await this.prisma.loyaltyRedemption.findMany({
      where: { customerId },
      include: { reward: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return redemptions.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardName: r.reward?.name || 'Recompensa',
      pointsUsed: r.pointsUsed,
      redeemedAt: r.createdAt,
    }));
  }

  /**
   * Segmentos do cliente
   */
  async getCustomerSegments(customerId: string): Promise<string[]> {
    const memberships = await this.prisma.customerSegmentMember.findMany({
      where: { customerId },
      include: { segment: true },
    });

    return memberships.map((m) => m.segment.slug);
  }

  /**
   * Timeline de interações do cliente
   */
  async getCustomerTimeline(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<CustomerTimelineItem[]> {
    const skip = (page - 1) * limit;

    // Buscar diferentes tipos de eventos
    const [appointments, notes, pointsTransactions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: { services: { include: { service: true } } },
      }),
      this.prisma.customerNote.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.loyaltyTransaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    // Combinar e ordenar
    const items: CustomerTimelineItem[] = [];

    appointments.forEach((apt) => {
      const serviceNames = apt.services.map((s) => s.service.name).join(', ');
      items.push({
        id: apt.id,
        type: 'APPOINTMENT',
        title: `Agendamento - ${apt.status}`,
        description: serviceNames,
        metadata: {
          status: apt.status,
          startTime: apt.startTime,
          endTime: apt.endTime,
        },
        createdAt: apt.createdAt,
      });
    });

    notes.forEach((note) => {
      items.push({
        id: note.id,
        type: 'NOTE',
        title: 'Nota adicionada',
        description: note.content,
        createdAt: note.createdAt,
        createdBy: note.createdBy,
      });
    });

    pointsTransactions.forEach((tx) => {
      items.push({
        id: tx.id,
        type: 'POINTS',
        title: tx.type === 'EARN' ? 'Pontos ganhos' : 'Pontos resgatados',
        description: tx.description,
        metadata: { points: tx.points },
        createdAt: tx.createdAt,
      });
    });

    // Ordenar por data decrescente
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(0, limit);
  }

  /**
   * Calcula e atualiza métricas do cliente
   */
  async recalculateMetrics(customerId: string): Promise<void> {
    const [appointmentStats, totalSpent] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { customerId },
        _count: true,
      }),
      this.prisma.appointment.aggregate({
        where: { customerId, status: 'COMPLETED' },
        _sum: { finalPrice: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    appointmentStats.forEach((s) => {
      statusCounts[s.status] = s._count;
    });

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const completed = statusCounts['COMPLETED'] || 0;
    const cancelled = statusCounts['CANCELLED'] || 0;
    const noShow = statusCounts['NO_SHOW'] || 0;
    const spent = totalSpent._sum.finalPrice?.toNumber() || 0;
    const avgTicket = completed > 0 ? spent / completed : 0;

    // Calcular frequência de visitas
    const visitFrequency = await this.calculateVisitFrequency(customerId);

    // Última visita
    const lastVisit = await this.prisma.appointment.findFirst({
      where: { customerId, status: 'COMPLETED' },
      orderBy: { endTime: 'desc' },
      select: { endTime: true },
    });

    const lastVisitDaysAgo = lastVisit
      ? differenceInDays(new Date(), lastVisit.endTime)
      : 0;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowCount: noShow,
        totalSpent: spent,
        averageTicket: avgTicket,
        visitFrequency,
        lastVisitDaysAgo,
        lastVisitAt: lastVisit?.endTime,
        metricsUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Calcula frequência média de visitas (dias entre visitas)
   */
  private async calculateVisitFrequency(customerId: string): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId, status: 'COMPLETED' },
      orderBy: { endTime: 'asc' },
      select: { endTime: true },
    });

    if (appointments.length < 2) return 0;

    let totalDays = 0;
    for (let i = 1; i < appointments.length; i++) {
      totalDays += differenceInDays(appointments[i].endTime, appointments[i - 1].endTime);
    }

    return Math.round(totalDays / (appointments.length - 1));
  }
}
