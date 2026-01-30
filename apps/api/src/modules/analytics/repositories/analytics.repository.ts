import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  format,
  differenceInDays,
  getDay,
  getHours,
} from 'date-fns';

@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // DATE HELPERS
  // ========================

  getDateRange(preset?: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (preset) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'last7days':
        start = startOfDay(subDays(now, 7));
        break;
      case 'last30days':
        start = startOfDay(subDays(now, 30));
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        start = startOfYear(now);
        break;
      default:
        start = startDate ? new Date(startDate) : startOfDay(subDays(now, 30));
        end = endDate ? new Date(endDate) : endOfDay(now);
    }

    return { start, end };
  }

  getPreviousPeriod(start: Date, end: Date) {
    const days = differenceInDays(end, start);
    return {
      start: subDays(start, days + 1),
      end: subDays(end, days + 1),
    };
  }

  // ========================
  // REVENUE
  // ========================

  async getRevenueMetrics(start: Date, end: Date) {
    const result = await this.prisma.payment.aggregate({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        paidAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    return {
      total: Number(result._sum.amount || 0),
      count: result._count,
      average: Number(result._avg.amount || 0),
    };
  }

  async getRevenueTimeSeries(start: Date, end: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        paidAt: { gte: start, lte: end },
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: 'asc' },
    });

    const grouped = new Map<string, number>();
    payments.forEach((p) => {
      const key = format(p.paidAt, 'yyyy-MM-dd');
      grouped.set(key, (grouped.get(key) || 0) + p.amount);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      value,
    }));
  }

  async getRevenueByService(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.appointmentService.groupBy({
      by: ['serviceId'],
      where: {
        appointment: {
          tenantId: this.tenantId,
          status: 'COMPLETED',
          endTime: { gte: start, lte: end },
        },
      },
      _sum: { price: true },
      orderBy: { _sum: { price: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      dimension: r.serviceId,
      value: Number(r._sum.price || 0),
    }));
  }

  async getRevenueByProfessional(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        endTime: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      dimension: r.professionalId,
      value: Number(r._sum.totalAmount || 0),
    }));
  }

  // ========================
  // APPOINTMENTS
  // ========================

  async getAppointmentMetrics(start: Date, end: Date) {
    const [total, byStatus] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          tenantId: this.tenantId,
          startTime: { gte: start, lte: end },
        },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: {
          tenantId: this.tenantId,
          startTime: { gte: start, lte: end },
        },
        _count: true,
      }),
    ]);

    const statusMap = new Map(byStatus.map((s) => [s.status, s._count]));

    return {
      total,
      completed: statusMap.get('COMPLETED') || 0,
      cancelled: statusMap.get('CANCELLED') || 0,
      noShow: statusMap.get('NO_SHOW') || 0,
    };
  }

  async getAppointmentTimeSeries(start: Date, end: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId,
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true },
    });

    const grouped = new Map<string, number>();
    appointments.forEach((a) => {
      const key = format(a.startTime, 'yyyy-MM-dd');
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      value,
    }));
  }

  async getAppointmentsByDayOfWeek(start: Date, end: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId,
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true },
    });

    const grouped = new Map<number, number>();
    appointments.forEach((a) => {
      const day = getDay(a.startTime);
      grouped.set(day, (grouped.get(day) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([day, value]) => ({
      dimension: day.toString(),
      value,
    }));
  }

  async getAppointmentsByHour(start: Date, end: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId,
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true },
    });

    const grouped = new Map<number, number>();
    appointments.forEach((a) => {
      const hour = getHours(a.startTime);
      grouped.set(hour, (grouped.get(hour) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([hour, value]) => ({
      dimension: hour.toString(),
      value,
    }));
  }

  // ========================
  // CUSTOMERS
  // ========================

  async getCustomerMetrics(start: Date, end: Date) {
    const [total, newCustomers] = await Promise.all([
      this.prisma.customer.count({
        where: { tenantId: this.tenantId },
      }),
      this.prisma.customer.count({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

    // Clientes com agendamentos no período
    const activeCustomers = await this.prisma.appointment.groupBy({
      by: ['customerId'],
      where: {
        tenantId: this.tenantId,
        startTime: { gte: start, lte: end },
      },
    });

    return {
      total,
      new: newCustomers,
      active: activeCustomers.length,
    };
  }

  async getNewCustomersTimeSeries(start: Date, end: Date) {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId: this.tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true },
    });

    const grouped = new Map<string, number>();
    customers.forEach((c) => {
      const key = format(c.createdAt, 'yyyy-MM-dd');
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      value,
    }));
  }

  async getTopCustomers(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.appointment.groupBy({
      by: ['customerId'],
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        endTime: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      customerId: r.customerId,
      revenue: Number(r._sum.totalAmount || 0),
      visits: r._count,
    }));
  }

  // ========================
  // SERVICES
  // ========================

  async getServiceMetrics() {
    const [total, active] = await Promise.all([
      this.prisma.service.count({ where: { tenantId: this.tenantId } }),
      this.prisma.service.count({ where: { tenantId: this.tenantId, isActive: true } }),
    ]);

    const avgPrice = await this.prisma.service.aggregate({
      where: { tenantId: this.tenantId, isActive: true },
      _avg: { price: true },
    });

    return {
      total,
      active,
      avgPrice: Number(avgPrice._avg.price || 0),
    };
  }

  async getTopServices(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.appointmentService.groupBy({
      by: ['serviceId'],
      where: {
        appointment: {
          tenantId: this.tenantId,
          status: 'COMPLETED',
          endTime: { gte: start, lte: end },
        },
      },
      _sum: { price: true },
      _count: true,
      orderBy: { _sum: { price: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      serviceId: r.serviceId,
      revenue: Number(r._sum.price || 0),
      bookings: r._count,
    }));
  }

  // ========================
  // PROFESSIONALS
  // ========================

  async getProfessionalMetrics() {
    const [total, active] = await Promise.all([
      this.prisma.professional.count({ where: { tenantId: this.tenantId } }),
      this.prisma.professional.count({ where: { tenantId: this.tenantId, isActive: true } }),
    ]);

    return { total, active };
  }

  async getTopProfessionals(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        endTime: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      professionalId: r.professionalId,
      revenue: Number(r._sum.totalAmount || 0),
      appointments: r._count,
    }));
  }

  // ========================
  // PRODUCTS
  // ========================

  async getProductMetrics() {
    const [total, active, lowStock] = await Promise.all([
      this.prisma.product.count({ where: { tenantId: this.tenantId } }),
      this.prisma.product.count({ where: { tenantId: this.tenantId, isActive: true } }),
      this.prisma.product.count({
        where: {
          tenantId: this.tenantId,
          isActive: true,
          currentStock: { lte: this.prisma.product.fields.minimumStock },
        },
      }),
    ]);

    const inventoryValue = await this.prisma.product.aggregate({
      where: { tenantId: this.tenantId, isActive: true },
      _sum: { currentStock: true },
    });

    return {
      total,
      active,
      lowStock,
      inventoryValue: inventoryValue._sum.currentStock || 0,
    };
  }

  async getTopProducts(start: Date, end: Date, limit = 10) {
    const result = await this.prisma.stockMovement.groupBy({
      by: ['productId'],
      where: {
        tenantId: this.tenantId,
        type: 'SALE',
        createdAt: { gte: start, lte: end },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      productId: r.productId,
      unitsSold: Math.abs(r._sum.quantity || 0),
    }));
  }

  // ========================
  // OCCUPANCY
  // ========================

  async getOccupancyHeatmap(start: Date, end: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId,
        startTime: { gte: start, lte: end },
      },
      select: { startTime: true },
    });

    const heatmap = new Map<string, number>();
    appointments.forEach((a) => {
      const day = getDay(a.startTime);
      const hour = getHours(a.startTime);
      const key = `${day}-${hour}`;
      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    });

    return Array.from(heatmap.entries()).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { dayOfWeek: day, hour, appointments: count };
    });
  }

  // ========================
  // DASHBOARDS
  // ========================

  async createDashboard(data: any) {
    return this.prisma.dashboard.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findDashboardById(id: string) {
    return this.prisma.dashboard.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findDashboards(userId: string) {
    return this.prisma.dashboard.findMany({
      where: {
        tenantId: this.tenantId,
        OR: [{ createdBy: userId }, { isShared: true }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async updateDashboard(id: string, data: any) {
    return this.prisma.dashboard.update({ where: { id }, data });
  }

  async deleteDashboard(id: string) {
    return this.prisma.dashboard.delete({ where: { id } });
  }

  // ========================
  // REPORTS
  // ========================

  async createReport(data: any) {
    return this.prisma.report.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findReportById(id: string) {
    return this.prisma.report.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findReports(query: any) {
    const { type, search, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };
    if (type) where.type = type;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateReport(id: string, data: any) {
    return this.prisma.report.update({ where: { id }, data });
  }

  async deleteReport(id: string) {
    return this.prisma.report.delete({ where: { id } });
  }

  // ========================
  // KPIS
  // ========================

  async createKPI(data: any) {
    return this.prisma.kpi.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findKPIs(query: any) {
    const where: any = { tenantId: this.tenantId };
    if (query.metricType) where.metricType = query.metricType;
    if (query.period) where.period = query.period;

    return this.prisma.kpi.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async updateKPI(id: string, data: any) {
    return this.prisma.kpi.update({ where: { id }, data });
  }

  async deleteKPI(id: string) {
    return this.prisma.kpi.delete({ where: { id } });
  }

  // ========================
  // ALERTS
  // ========================

  async createAlert(data: any) {
    return this.prisma.analyticsAlert.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findAlerts() {
    return this.prisma.analyticsAlert.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async updateAlert(id: string, data: any) {
    return this.prisma.analyticsAlert.update({ where: { id }, data });
  }

  async deleteAlert(id: string) {
    return this.prisma.analyticsAlert.delete({ where: { id } });
  }
}
