import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  CommissionQueryDto,
  PaymentQueryDto,
  GoalQueryDto,
} from '../dto';
import { CommissionStatus, PaymentStatus } from '../interfaces';

@Injectable()
export class CommissionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // RULES
  // ========================

  async createRule(data: any) {
    return this.prisma.commissionRule.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findRuleById(id: string) {
    return this.prisma.commissionRule.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findRules(activeOnly: boolean = false) {
    return this.prisma.commissionRule.findMany({
      where: {
        tenantId: this.tenantId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultRule() {
    return this.prisma.commissionRule.findFirst({
      where: { tenantId: this.tenantId, isDefault: true, isActive: true },
    });
  }

  async updateRule(id: string, data: any) {
    return this.prisma.commissionRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string) {
    return this.prisma.commissionRule.delete({
      where: { id },
    });
  }

  // ========================
  // PROFESSIONAL CONFIG
  // ========================

  async createProfessionalConfig(data: any) {
    return this.prisma.professionalCommissionConfig.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findProfessionalConfig(professionalId: string) {
    return this.prisma.professionalCommissionConfig.findFirst({
      where: {
        tenantId: this.tenantId,
        professionalId,
        isActive: true,
      },
    });
  }

  async findProfessionalConfigs() {
    return this.prisma.professionalCommissionConfig.findMany({
      where: { tenantId: this.tenantId, isActive: true },
    });
  }

  async updateProfessionalConfig(id: string, data: any) {
    return this.prisma.professionalCommissionConfig.update({
      where: { id },
      data,
    });
  }

  // ========================
  // ENTRIES
  // ========================

  async createEntry(data: any) {
    return this.prisma.commissionEntry.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findEntryById(id: string) {
    return this.prisma.commissionEntry.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findEntries(query: CommissionQueryDto) {
    const {
      professionalId,
      status,
      referenceType,
      serviceId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId: this.tenantId };

    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;
    if (referenceType) where.referenceType = referenceType;
    if (serviceId) where.serviceId = serviceId;

    if (startDate || endDate) {
      where.referenceDate = {};
      if (startDate) where.referenceDate.gte = new Date(startDate);
      if (endDate) where.referenceDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.commissionEntry.findMany({
        where,
        orderBy: { referenceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.commissionEntry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findEntriesByIds(ids: string[]) {
    return this.prisma.commissionEntry.findMany({
      where: { id: { in: ids }, tenantId: this.tenantId },
    });
  }

  async findApprovedUnpaidEntries(professionalId: string, periodStart: Date, periodEnd: Date) {
    return this.prisma.commissionEntry.findMany({
      where: {
        tenantId: this.tenantId,
        professionalId,
        status: CommissionStatus.APPROVED,
        paymentId: null,
        referenceDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });
  }

  async updateEntry(id: string, data: any) {
    return this.prisma.commissionEntry.update({
      where: { id },
      data,
    });
  }

  async updateManyEntries(ids: string[], data: any) {
    return this.prisma.commissionEntry.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  // ========================
  // PAYMENTS
  // ========================

  async createPayment(data: any) {
    return this.prisma.commissionPayment.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findPaymentById(id: string) {
    return this.prisma.commissionPayment.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findPayments(query: PaymentQueryDto) {
    const { professionalId, status, startDate, endDate, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.periodEnd = {};
      if (startDate) where.periodEnd.gte = new Date(startDate);
      if (endDate) where.periodEnd.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.commissionPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.commissionPayment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePayment(id: string, data: any) {
    return this.prisma.commissionPayment.update({
      where: { id },
      data,
    });
  }

  // ========================
  // GOALS
  // ========================

  async createGoal(data: any) {
    return this.prisma.commissionGoal.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findGoalById(id: string) {
    return this.prisma.commissionGoal.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findGoals(query: GoalQueryDto) {
    const { professionalId, type, period, activeOnly, includeGlobal } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (period) where.period = period;
    if (activeOnly) where.isActive = true;

    if (professionalId) {
      if (includeGlobal) {
        where.OR = [{ professionalId }, { isGlobal: true }];
      } else {
        where.professionalId = professionalId;
      }
    }

    return this.prisma.commissionGoal.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  async findActiveGoals(professionalId?: string) {
    const now = new Date();
    const where: any = {
      tenantId: this.tenantId,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (professionalId) {
      where.OR = [{ professionalId }, { isGlobal: true }];
    }

    return this.prisma.commissionGoal.findMany({
      where,
      orderBy: { endDate: 'asc' },
    });
  }

  async updateGoal(id: string, data: any) {
    return this.prisma.commissionGoal.update({
      where: { id },
      data,
    });
  }

  async deleteGoal(id: string) {
    return this.prisma.commissionGoal.delete({
      where: { id },
    });
  }

  // ========================
  // STATS & AGGREGATIONS
  // ========================

  async getEntriesStats(professionalId: string, startDate: Date, endDate: Date) {
    const entries = await this.prisma.commissionEntry.groupBy({
      by: ['status'],
      where: {
        tenantId: this.tenantId,
        professionalId,
        referenceDate: { gte: startDate, lte: endDate },
      },
      _sum: { finalAmount: true },
      _count: true,
    });

    return entries;
  }

  async getTopServices(professionalId: string, startDate: Date, endDate: Date, limit: number = 5) {
    const services = await this.prisma.commissionEntry.groupBy({
      by: ['serviceId', 'serviceName'],
      where: {
        tenantId: this.tenantId,
        professionalId,
        referenceDate: { gte: startDate, lte: endDate },
        serviceId: { not: null },
      },
      _sum: { finalAmount: true },
      _count: true,
      orderBy: { _sum: { finalAmount: 'desc' } },
      take: limit,
    });

    return services.map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      amount: s._sum.finalAmount || 0,
      count: s._count,
    }));
  }

  async getRevenueByProfessional(startDate: Date, endDate: Date) {
    return this.prisma.commissionEntry.groupBy({
      by: ['professionalId', 'professionalName'],
      where: {
        tenantId: this.tenantId,
        referenceDate: { gte: startDate, lte: endDate },
      },
      _sum: { baseValue: true, finalAmount: true },
      _count: true,
    });
  }

  async getTrends(startDate: Date, endDate: Date) {
    return this.prisma.commissionEntry.groupBy({
      by: ['referenceDate'],
      where: {
        tenantId: this.tenantId,
        referenceDate: { gte: startDate, lte: endDate },
      },
      _sum: { baseValue: true, finalAmount: true },
    });
  }
}
