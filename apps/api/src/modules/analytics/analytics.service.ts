import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AnalyticsRepository } from './repositories';
import {
  CreateDashboardDto,
  UpdateDashboardDto,
  CreateReportDto,
  UpdateReportDto,
  CreateKPIDto,
  UpdateKPIDto,
  CreateAlertDto,
  UpdateAlertDto,
  AnalyticsQueryDto,
  DashboardQueryDto,
  ReportQueryDto,
  KPIQueryDto,
} from './dto';
import {
  RevenueAnalytics,
  AppointmentAnalytics,
  CustomerAnalytics,
  ServiceAnalytics,
  ProfessionalAnalytics,
  ProductAnalytics,
  OccupancyAnalytics,
  MetricValue,
  TimeSeriesData,
} from './interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly repository: AnalyticsRepository) {}

  // ========================
  // HELPERS
  // ========================

  private calculateChange(current: number, previous: number): MetricValue {
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      value: current,
      previousValue: previous,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      trend,
    };
  }

  private buildTimeSeries(data: { date: string; value: number }[]): TimeSeriesData {
    const values = data.map((d) => d.value);
    return {
      series: data,
      total: values.reduce((a, b) => a + b, 0),
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    };
  }

  // ========================
  // REVENUE ANALYTICS
  // ========================

  async getRevenueAnalytics(query: AnalyticsQueryDto): Promise<RevenueAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [currentMetrics, timeSeries, byService, byProfessional] = await Promise.all([
      this.repository.getRevenueMetrics(start, end),
      this.repository.getRevenueTimeSeries(start, end),
      this.repository.getRevenueByService(start, end),
      this.repository.getRevenueByProfessional(start, end),
    ]);

    let total: MetricValue = { value: currentMetrics.total };
    let averageTicket: MetricValue = { value: currentMetrics.average };
    let transactionCount: MetricValue = { value: currentMetrics.count };

    // Comparação com período anterior
    if (query.comparison === 'previous_period') {
      const prev = this.repository.getPreviousPeriod(start, end);
      const prevMetrics = await this.repository.getRevenueMetrics(prev.start, prev.end);

      total = this.calculateChange(currentMetrics.total, prevMetrics.total);
      averageTicket = this.calculateChange(currentMetrics.average, prevMetrics.average);
      transactionCount = this.calculateChange(currentMetrics.count, prevMetrics.count);
    }

    // Calcular percentuais
    const serviceTotal = byService.reduce((a, b) => a + b.value, 0);
    const profTotal = byProfessional.reduce((a, b) => a + b.value, 0);

    return {
      total,
      services: { value: serviceTotal },
      products: { value: 0 }, // Pode ser calculado separadamente
      timeSeries: this.buildTimeSeries(timeSeries),
      byService: byService.map((s) => ({
        dimension: s.dimension,
        value: s.value,
        percentage: serviceTotal > 0 ? (s.value / serviceTotal) * 100 : 0,
      })),
      byProduct: [],
      byProfessional: byProfessional.map((p) => ({
        dimension: p.dimension,
        value: p.value,
        percentage: profTotal > 0 ? (p.value / profTotal) * 100 : 0,
      })),
      byPaymentMethod: [],
      averageTicket,
      transactionCount,
    };
  }

  // ========================
  // APPOINTMENT ANALYTICS
  // ========================

  async getAppointmentAnalytics(query: AnalyticsQueryDto): Promise<AppointmentAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [metrics, timeSeries, byDayOfWeek, byHour] = await Promise.all([
      this.repository.getAppointmentMetrics(start, end),
      this.repository.getAppointmentTimeSeries(start, end),
      this.repository.getAppointmentsByDayOfWeek(start, end),
      this.repository.getAppointmentsByHour(start, end),
    ]);

    const completionRate = metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0;
    const cancellationRate = metrics.total > 0 ? (metrics.cancelled / metrics.total) * 100 : 0;
    const noShowRate = metrics.total > 0 ? (metrics.noShow / metrics.total) * 100 : 0;

    return {
      total: { value: metrics.total },
      completed: { value: metrics.completed },
      cancelled: { value: metrics.cancelled },
      noShow: { value: metrics.noShow },
      completionRate: { value: Math.round(completionRate * 100) / 100 },
      cancellationRate: { value: Math.round(cancellationRate * 100) / 100 },
      noShowRate: { value: Math.round(noShowRate * 100) / 100 },
      timeSeries: this.buildTimeSeries(timeSeries),
      byService: [],
      byProfessional: [],
      byDayOfWeek: byDayOfWeek.map((d) => ({
        dimension: d.dimension,
        value: d.value,
        percentage: metrics.total > 0 ? (d.value / metrics.total) * 100 : 0,
      })),
      byHour: byHour.map((h) => ({
        dimension: h.dimension,
        value: h.value,
        percentage: metrics.total > 0 ? (h.value / metrics.total) * 100 : 0,
      })),
      averageDuration: { value: 0 },
      utilizationRate: { value: 0 },
    };
  }

  // ========================
  // CUSTOMER ANALYTICS
  // ========================

  async getCustomerAnalytics(query: AnalyticsQueryDto): Promise<CustomerAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [metrics, timeSeries, topCustomers] = await Promise.all([
      this.repository.getCustomerMetrics(start, end),
      this.repository.getNewCustomersTimeSeries(start, end),
      this.repository.getTopCustomers(start, end),
    ]);

    return {
      total: { value: metrics.total },
      active: { value: metrics.active },
      new: { value: metrics.new },
      returning: { value: metrics.active - metrics.new },
      churned: { value: 0 },
      retentionRate: { value: 0 },
      churnRate: { value: 0 },
      averageLifetimeValue: { value: 0 },
      averageVisits: { value: 0 },
      timeSeries: this.buildTimeSeries(timeSeries),
      bySource: [],
      bySegment: [],
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        customerName: '',
        revenue: c.revenue,
        visits: c.visits,
        lastVisit: new Date(),
      })),
    };
  }

  // ========================
  // SERVICE ANALYTICS
  // ========================

  async getServiceAnalytics(query: AnalyticsQueryDto): Promise<ServiceAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [metrics, topServices] = await Promise.all([
      this.repository.getServiceMetrics(),
      this.repository.getTopServices(start, end),
    ]);

    return {
      totalServices: metrics.total,
      activeServices: metrics.active,
      topServices: topServices.map((s) => ({
        serviceId: s.serviceId,
        serviceName: '',
        revenue: s.revenue,
        bookings: s.bookings,
      })),
      byCategory: [],
      averagePrice: { value: metrics.avgPrice },
      averageDuration: { value: 0 },
      popularityTrend: { series: [], total: 0, average: 0, min: 0, max: 0 },
    };
  }

  // ========================
  // PROFESSIONAL ANALYTICS
  // ========================

  async getProfessionalAnalytics(query: AnalyticsQueryDto): Promise<ProfessionalAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [metrics, topProfessionals] = await Promise.all([
      this.repository.getProfessionalMetrics(),
      this.repository.getTopProfessionals(start, end),
    ]);

    return {
      total: metrics.total,
      active: metrics.active,
      topPerformers: topProfessionals.map((p) => ({
        professionalId: p.professionalId,
        professionalName: '',
        revenue: p.revenue,
        appointments: p.appointments,
        utilizationRate: 0,
      })),
      byRevenue: [],
      byAppointments: [],
      byRating: [],
      utilizationByProfessional: [],
    };
  }

  // ========================
  // PRODUCT ANALYTICS
  // ========================

  async getProductAnalytics(query: AnalyticsQueryDto): Promise<ProductAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [metrics, topProducts] = await Promise.all([
      this.repository.getProductMetrics(),
      this.repository.getTopProducts(start, end),
    ]);

    return {
      totalProducts: metrics.total,
      activeProducts: metrics.active,
      lowStockProducts: metrics.lowStock,
      outOfStockProducts: 0,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: '',
        revenue: 0,
        unitsSold: p.unitsSold,
        profit: 0,
        profitMargin: 0,
      })),
      salesTrend: { series: [], total: 0, average: 0, min: 0, max: 0 },
      byCategory: [],
      inventoryValue: { value: metrics.inventoryValue },
      turnoverRate: { value: 0 },
    };
  }

  // ========================
  // OCCUPANCY ANALYTICS
  // ========================

  async getOccupancyAnalytics(query: AnalyticsQueryDto): Promise<OccupancyAnalytics> {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [heatmap, byDayOfWeek, byHour] = await Promise.all([
      this.repository.getOccupancyHeatmap(start, end),
      this.repository.getAppointmentsByDayOfWeek(start, end),
      this.repository.getAppointmentsByHour(start, end),
    ]);

    // Identificar picos
    const sortedByHour = [...byHour].sort((a, b) => b.value - a.value);
    const peakHours = sortedByHour.slice(0, 3).map((h) => h.dimension);
    const lowOccupancyHours = sortedByHour.slice(-3).map((h) => h.dimension);

    return {
      overall: { value: 0 },
      byDayOfWeek: byDayOfWeek.map((d) => ({
        dimension: d.dimension,
        value: d.value,
        percentage: 0,
      })),
      byHour: byHour.map((h) => ({
        dimension: h.dimension,
        value: h.value,
        percentage: 0,
      })),
      heatmap: heatmap.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        hour: h.hour,
        occupancyRate: 0,
        appointments: h.appointments,
      })),
      peakHours,
      lowOccupancyHours,
      recommendations: [],
    };
  }

  // ========================
  // DASHBOARDS
  // ========================

  async createDashboard(dto: CreateDashboardDto, userId: string) {
    const widgets = (dto.widgets || []).map((w) => ({
      ...w,
      id: w.id || uuidv4(),
    }));

    return this.repository.createDashboard({
      ...dto,
      widgets,
      createdBy: userId,
    });
  }

  async findDashboards(userId: string, query: DashboardQueryDto) {
    return this.repository.findDashboards(userId);
  }

  async findDashboardById(id: string) {
    const dashboard = await this.repository.findDashboardById(id);
    if (!dashboard) {
      throw new NotFoundException('Dashboard não encontrado');
    }
    return dashboard;
  }

  async updateDashboard(id: string, dto: UpdateDashboardDto) {
    await this.findDashboardById(id);
    return this.repository.updateDashboard(id, dto);
  }

  async deleteDashboard(id: string) {
    await this.findDashboardById(id);
    return this.repository.deleteDashboard(id);
  }

  // ========================
  // REPORTS
  // ========================

  async createReport(dto: CreateReportDto, userId: string) {
    return this.repository.createReport({
      ...dto,
      createdBy: userId,
    });
  }

  async findReports(query: ReportQueryDto) {
    return this.repository.findReports(query);
  }

  async findReportById(id: string) {
    const report = await this.repository.findReportById(id);
    if (!report) {
      throw new NotFoundException('Relatório não encontrado');
    }
    return report;
  }

  async updateReport(id: string, dto: UpdateReportDto) {
    await this.findReportById(id);
    return this.repository.updateReport(id, dto);
  }

  async deleteReport(id: string) {
    await this.findReportById(id);
    return this.repository.deleteReport(id);
  }

  async generateReport(id: string) {
    const report = await this.findReportById(id);
    // Lógica de geração de relatório seria implementada aqui
    // Retornaria um link para download
    return { reportId: id, status: 'processing' };
  }

  // ========================
  // KPIS
  // ========================

  async createKPI(dto: CreateKPIDto) {
    return this.repository.createKPI({
      ...dto,
      currentValue: 0,
      status: 'on-track',
      progress: 0,
      trend: 'stable',
    });
  }

  async findKPIs(query: KPIQueryDto) {
    return this.repository.findKPIs(query);
  }

  async updateKPI(id: string, dto: UpdateKPIDto) {
    return this.repository.updateKPI(id, dto);
  }

  async deleteKPI(id: string) {
    return this.repository.deleteKPI(id);
  }

  // ========================
  // ALERTS
  // ========================

  async createAlert(dto: CreateAlertDto) {
    return this.repository.createAlert({
      ...dto,
      isActive: true,
    });
  }

  async findAlerts() {
    return this.repository.findAlerts();
  }

  async updateAlert(id: string, dto: UpdateAlertDto) {
    return this.repository.updateAlert(id, dto);
  }

  async deleteAlert(id: string) {
    return this.repository.deleteAlert(id);
  }

  // ========================
  // OVERVIEW
  // ========================

  async getOverview(query: AnalyticsQueryDto) {
    const { start, end } = this.repository.getDateRange(query.preset, query.startDate, query.endDate);

    const [revenue, appointments, customers, services, professionals, products] = await Promise.all([
      this.repository.getRevenueMetrics(start, end),
      this.repository.getAppointmentMetrics(start, end),
      this.repository.getCustomerMetrics(start, end),
      this.repository.getServiceMetrics(),
      this.repository.getProfessionalMetrics(),
      this.repository.getProductMetrics(),
    ]);

    return {
      revenue: {
        total: revenue.total,
        transactions: revenue.count,
        averageTicket: revenue.average,
      },
      appointments: {
        total: appointments.total,
        completed: appointments.completed,
        cancelled: appointments.cancelled,
        noShow: appointments.noShow,
        completionRate: appointments.total > 0 ? (appointments.completed / appointments.total) * 100 : 0,
      },
      customers: {
        total: customers.total,
        active: customers.active,
        new: customers.new,
      },
      services: {
        total: services.total,
        active: services.active,
        avgPrice: services.avgPrice,
      },
      professionals: {
        total: professionals.total,
        active: professionals.active,
      },
      products: {
        total: products.total,
        active: products.active,
        lowStock: products.lowStock,
      },
    };
  }
}
