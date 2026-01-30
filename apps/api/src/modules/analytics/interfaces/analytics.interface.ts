// ========================
// ANALYTICS INTERFACES
// ========================

export enum MetricType {
  REVENUE = 'REVENUE',
  APPOINTMENTS = 'APPOINTMENTS',
  CUSTOMERS = 'CUSTOMERS',
  SERVICES = 'SERVICES',
  PRODUCTS = 'PRODUCTS',
  PROFESSIONALS = 'PROFESSIONALS',
  RETENTION = 'RETENTION',
  CONVERSION = 'CONVERSION',
  SATISFACTION = 'SATISFACTION',
}

export enum ReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  AREA = 'AREA',
  DONUT = 'DONUT',
  HEATMAP = 'HEATMAP',
  TABLE = 'TABLE',
}

export enum ComparisonPeriod {
  PREVIOUS_PERIOD = 'PREVIOUS_PERIOD',
  PREVIOUS_YEAR = 'PREVIOUS_YEAR',
  CUSTOM = 'CUSTOM',
}

export enum DashboardWidgetType {
  METRIC_CARD = 'METRIC_CARD',
  CHART = 'CHART',
  TABLE = 'TABLE',
  PROGRESS = 'PROGRESS',
  LEADERBOARD = 'LEADERBOARD',
  CALENDAR_HEATMAP = 'CALENDAR_HEATMAP',
  GOAL_TRACKER = 'GOAL_TRACKER',
}

// ========================
// CORE METRICS
// ========================

export interface MetricValue {
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  series: TimeSeriesDataPoint[];
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface DimensionBreakdown {
  dimension: string;
  value: number;
  percentage: number;
  metadata?: Record<string, any>;
}

// ========================
// DASHBOARD
// ========================

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters?: DashboardFilter[];
  refreshInterval?: number; // em segundos
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows?: number;
  gaps?: number;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
}

export interface WidgetConfig {
  metricType?: MetricType;
  chartType?: ChartType;
  dateRange?: DateRange;
  comparison?: ComparisonPeriod;
  filters?: Record<string, any>;
  formatting?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
    color?: string;
  };
  thresholds?: {
    warning?: number;
    danger?: number;
    success?: number;
  };
}

export interface DashboardFilter {
  field: string;
  label: string;
  type: 'date' | 'select' | 'multiselect' | 'search';
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
}

// ========================
// REPORTS
// ========================

export interface Report {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ReportType;
  config: ReportConfig;
  schedule?: ReportSchedule;
  lastGeneratedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  metrics: MetricType[];
  dimensions?: string[];
  dateRange: DateRange;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeCharts?: boolean;
  includeSummary?: boolean;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// ========================
// REVENUE ANALYTICS
// ========================

export interface RevenueAnalytics {
  total: MetricValue;
  services: MetricValue;
  products: MetricValue;
  timeSeries: TimeSeriesData;
  byService: DimensionBreakdown[];
  byProduct: DimensionBreakdown[];
  byProfessional: DimensionBreakdown[];
  byPaymentMethod: DimensionBreakdown[];
  averageTicket: MetricValue;
  transactionCount: MetricValue;
}

// ========================
// APPOINTMENT ANALYTICS
// ========================

export interface AppointmentAnalytics {
  total: MetricValue;
  completed: MetricValue;
  cancelled: MetricValue;
  noShow: MetricValue;
  completionRate: MetricValue;
  cancellationRate: MetricValue;
  noShowRate: MetricValue;
  timeSeries: TimeSeriesData;
  byService: DimensionBreakdown[];
  byProfessional: DimensionBreakdown[];
  byDayOfWeek: DimensionBreakdown[];
  byHour: DimensionBreakdown[];
  averageDuration: MetricValue;
  utilizationRate: MetricValue;
}

// ========================
// CUSTOMER ANALYTICS
// ========================

export interface CustomerAnalytics {
  total: MetricValue;
  active: MetricValue;
  new: MetricValue;
  returning: MetricValue;
  churned: MetricValue;
  retentionRate: MetricValue;
  churnRate: MetricValue;
  averageLifetimeValue: MetricValue;
  averageVisits: MetricValue;
  timeSeries: TimeSeriesData;
  bySource: DimensionBreakdown[];
  bySegment: DimensionBreakdown[];
  topCustomers: CustomerRanking[];
}

export interface CustomerRanking {
  customerId: string;
  customerName: string;
  revenue: number;
  visits: number;
  lastVisit: Date;
}

// ========================
// SERVICE ANALYTICS
// ========================

export interface ServiceAnalytics {
  totalServices: number;
  activeServices: number;
  topServices: ServiceRanking[];
  byCategory: DimensionBreakdown[];
  averagePrice: MetricValue;
  averageDuration: MetricValue;
  popularityTrend: TimeSeriesData;
}

export interface ServiceRanking {
  serviceId: string;
  serviceName: string;
  revenue: number;
  bookings: number;
  averageRating?: number;
}

// ========================
// PROFESSIONAL ANALYTICS
// ========================

export interface ProfessionalAnalytics {
  total: number;
  active: number;
  topPerformers: ProfessionalRanking[];
  byRevenue: DimensionBreakdown[];
  byAppointments: DimensionBreakdown[];
  byRating: DimensionBreakdown[];
  utilizationByProfessional: ProfessionalUtilization[];
}

export interface ProfessionalRanking {
  professionalId: string;
  professionalName: string;
  revenue: number;
  appointments: number;
  averageRating?: number;
  utilizationRate: number;
}

export interface ProfessionalUtilization {
  professionalId: string;
  professionalName: string;
  availableHours: number;
  bookedHours: number;
  utilizationRate: number;
  idleTime: number;
}

// ========================
// PRODUCT ANALYTICS
// ========================

export interface ProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topProducts: ProductRanking[];
  salesTrend: TimeSeriesData;
  byCategory: DimensionBreakdown[];
  inventoryValue: MetricValue;
  turnoverRate: MetricValue;
}

export interface ProductRanking {
  productId: string;
  productName: string;
  revenue: number;
  unitsSold: number;
  profit: number;
  profitMargin: number;
}

// ========================
// FINANCIAL ANALYTICS
// ========================

export interface FinancialAnalytics {
  revenue: MetricValue;
  expenses: MetricValue;
  profit: MetricValue;
  profitMargin: MetricValue;
  cashFlow: TimeSeriesData;
  revenueByCategory: DimensionBreakdown[];
  expensesByCategory: DimensionBreakdown[];
  accountsReceivable: MetricValue;
  accountsPayable: MetricValue;
  overduePaments: MetricValue;
}

// ========================
// MARKETING ANALYTICS
// ========================

export interface MarketingAnalytics {
  campaigns: {
    total: number;
    active: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
  };
  coupons: {
    totalRedemptions: number;
    totalDiscount: number;
    averageDiscountPerRedemption: number;
  };
  loyalty: {
    totalMembers: number;
    activeMembers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    redemptionRate: number;
  };
  referrals: {
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
    revenueFromReferrals: number;
  };
}

// ========================
// OCCUPANCY ANALYTICS
// ========================

export interface OccupancyAnalytics {
  overall: MetricValue;
  byDayOfWeek: DimensionBreakdown[];
  byHour: DimensionBreakdown[];
  heatmap: OccupancyHeatmap[];
  peakHours: string[];
  lowOccupancyHours: string[];
  recommendations: string[];
}

export interface OccupancyHeatmap {
  dayOfWeek: number;
  hour: number;
  occupancyRate: number;
  appointments: number;
}

// ========================
// KPIs
// ========================

export interface KPI {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  metricType: MetricType;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: ReportType;
  status: 'on-track' | 'at-risk' | 'behind';
  progress: number;
  trend: 'up' | 'down' | 'stable';
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// ALERTS
// ========================

export interface AnalyticsAlert {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  metric: MetricType;
  condition: 'above' | 'below' | 'equals' | 'change_percent';
  threshold: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  recipients: string[];
  channels: ('email' | 'push' | 'sms')[];
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// COMPARISON
// ========================

export interface PeriodComparison {
  current: {
    period: DateRange;
    value: number;
  };
  previous: {
    period: DateRange;
    value: number;
  };
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// ========================
// EXPORT
// ========================

export interface ExportRequest {
  type: 'dashboard' | 'report' | 'data';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  config: Record<string, any>;
  filters?: Record<string, any>;
}

export interface ExportResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  expiresAt?: Date;
  error?: string;
}
