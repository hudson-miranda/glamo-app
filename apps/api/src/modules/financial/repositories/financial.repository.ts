import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  PaymentQueryDto,
  InvoiceQueryDto,
  TransactionQueryDto,
} from '../dto';
import { PaymentStatus, InvoiceStatus, TransactionType } from '../interfaces';

@Injectable()
export class FinancialRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // PAYMENTS
  // ========================

  async createPayment(data: any) {
    return this.prisma.payment.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        netAmount: this.calculateNetAmount(data),
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        appointment: { select: { id: true, startTime: true } },
        invoice: { select: { id: true, number: true } },
      },
    });
  }

  async findPaymentById(id: string) {
    return this.prisma.payment.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            professional: { select: { id: true, displayName: true } },
          },
        },
        invoice: { select: { id: true, number: true, status: true } },
      },
    });
  }

  async findPayments(query: PaymentQueryDto) {
    const {
      search,
      method,
      status,
      customerId,
      appointmentId,
      invoiceId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId: this.tenantId };

    if (method) where.method = method;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (invoiceId) where.invoiceId = invoiceId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true } },
          appointment: { select: { id: true, startTime: true } },
        },
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePayment(id: string, data: any) {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async findPaymentsByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.payment.findMany({
      where: {
        tenantId: this.tenantId,
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        customer: { select: { id: true, fullName: true } },
      },
    });
  }

  // ========================
  // INVOICES
  // ========================

  async createInvoice(data: any) {
    const number = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        number,
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        payments: true,
      },
    });
  }

  async findInvoiceById(id: string) {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        payments: true,
      },
    });
  }

  async findInvoiceByNumber(number: string) {
    return this.prisma.invoice.findFirst({
      where: { number, tenantId: this.tenantId },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        payments: true,
      },
    });
  }

  async findInvoices(query: InvoiceQueryDto) {
    const {
      search,
      status,
      customerId,
      issueDateStart,
      issueDateEnd,
      dueDateStart,
      dueDateEnd,
      overdue,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId: this.tenantId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (issueDateStart || issueDateEnd) {
      where.issueDate = {};
      if (issueDateStart) where.issueDate.gte = new Date(issueDateStart);
      if (issueDateEnd) where.issueDate.lte = new Date(issueDateEnd);
    }

    if (dueDateStart || dueDateEnd) {
      where.dueDate = {};
      if (dueDateStart) where.dueDate.gte = new Date(dueDateStart);
      if (dueDateEnd) where.dueDate.lte = new Date(dueDateEnd);
    }

    if (overdue) {
      where.status = { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] };
      where.dueDate = { lt: new Date() };
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateInvoice(id: string, data: any) {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        payments: true,
      },
    });
  }

  async deleteInvoice(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  async findOverdueInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        tenantId: this.tenantId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  // ========================
  // TRANSACTIONS
  // ========================

  async createTransaction(data: any) {
    // Obter saldo atual
    const lastTransaction = await this.prisma.transaction.findFirst({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const balanceBefore = lastTransaction?.balanceAfter ?? 0;
    const balanceAfter =
      data.type === TransactionType.REFUND ||
      data.type === TransactionType.WITHDRAWAL
        ? balanceBefore - Math.abs(data.amount)
        : balanceBefore + Math.abs(data.amount);

    return this.prisma.transaction.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        balanceBefore,
        balanceAfter,
        transactionDate: data.transactionDate || new Date(),
      },
    });
  }

  async findTransactions(query: TransactionQueryDto) {
    const {
      type,
      category,
      customerId,
      professionalId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      limit = 50,
    } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (customerId) where.customerId = customerId;
    if (professionalId) where.professionalId = professionalId;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCurrentBalance(): Promise<number> {
    const lastTransaction = await this.prisma.transaction.findFirst({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return lastTransaction?.balanceAfter ?? 0;
  }

  // ========================
  // CASH FLOW
  // ========================

  async createCashFlowEntry(data: any) {
    return this.prisma.cashFlowEntry.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async findCashFlowEntries(startDate: Date, endDate: Date, includeProjected: boolean = false) {
    const where: any = {
      tenantId: this.tenantId,
      entryDate: { gte: startDate, lte: endDate },
    };

    if (!includeProjected) {
      where.isProjected = false;
    }

    return this.prisma.cashFlowEntry.findMany({
      where,
      orderBy: { entryDate: 'asc' },
    });
  }

  // ========================
  // DAILY CLOSING
  // ========================

  async findDailyClosing(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.dailyClosing.findFirst({
      where: {
        tenantId: this.tenantId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async createDailyClosing(data: any) {
    return this.prisma.dailyClosing.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async updateDailyClosing(id: string, data: any) {
    return this.prisma.dailyClosing.update({
      where: { id },
      data,
    });
  }

  // ========================
  // STATS
  // ========================

  async getPaymentStats(startDate?: Date, endDate?: Date) {
    const where: any = {
      tenantId: this.tenantId,
      status: PaymentStatus.COMPLETED,
    };

    if (startDate && endDate) {
      where.paidAt = { gte: startDate, lte: endDate };
    }

    const stats = await this.prisma.payment.aggregate({
      where,
      _sum: { amount: true, tip: true, discount: true, fees: true, netAmount: true },
      _count: true,
      _avg: { amount: true },
    });

    const byMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: stats._sum.amount || 0,
      tips: stats._sum.tip || 0,
      discounts: stats._sum.discount || 0,
      fees: stats._sum.fees || 0,
      net: stats._sum.netAmount || 0,
      count: stats._count,
      average: stats._avg.amount || 0,
      byMethod: byMethod.reduce(
        (acc, item) => ({
          ...acc,
          [item.method]: { total: item._sum.amount, count: item._count },
        }),
        {},
      ),
    };
  }

  async getInvoiceStats() {
    const stats = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId: this.tenantId },
      _sum: { total: true, amountDue: true },
      _count: true,
    });

    const overdueTotal = await this.prisma.invoice.aggregate({
      where: {
        tenantId: this.tenantId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
        dueDate: { lt: new Date() },
      },
      _sum: { amountDue: true },
      _count: true,
    });

    return {
      byStatus: stats.reduce(
        (acc, item) => ({
          ...acc,
          [item.status]: {
            total: item._sum.total,
            due: item._sum.amountDue,
            count: item._count,
          },
        }),
        {},
      ),
      overdue: {
        total: overdueTotal._sum.amountDue || 0,
        count: overdueTotal._count,
      },
    };
  }

  // ========================
  // HELPERS
  // ========================

  private calculateNetAmount(data: any): number {
    const amount = data.amount || 0;
    const tip = data.tip || 0;
    const discount = data.discount || 0;
    const fees = data.fees || 0;
    return amount + tip - discount - fees;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId: this.tenantId,
        number: { startsWith: `INV-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastInvoice?.number) {
      const parts = lastInvoice.number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `INV-${year}-${String(sequence).padStart(6, '0')}`;
  }
}
