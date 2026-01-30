import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommissionsRepository } from './repositories';
import { CalculationService, CalculationInput } from './services/calculation.service';
import { GoalService } from './services/goal.service';
import {
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
  CreateProfessionalConfigDto,
  UpdateProfessionalConfigDto,
  CreateCommissionEntryDto,
  ApproveCommissionsDto,
  AdjustCommissionDto,
  CreatePaymentDto,
  ProcessPaymentDto,
  CreateGoalDto,
  UpdateGoalDto,
  CommissionQueryDto,
  PaymentQueryDto,
  GoalQueryDto,
  ReportQueryDto,
  SummaryQueryDto,
} from './dto';
import {
  CommissionStatus,
  PaymentStatus,
  CommissionTrigger,
  CommissionEntry,
  CommissionSummary,
  CommissionReport,
  BonusType,
} from './interfaces';
import { v4 as uuidv4 } from 'uuid';
import { startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(
    private readonly repository: CommissionsRepository,
    private readonly calculationService: CalculationService,
    private readonly goalService: GoalService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // RULES
  // ========================

  async createRule(dto: CreateCommissionRuleDto): Promise<any> {
    // Se for regra padrão, desativar outras regras padrão do mesmo trigger
    if (dto.isDefault) {
      const existingRules = await this.repository.findRules();
      for (const rule of existingRules) {
        if (rule.isDefault && rule.trigger === dto.trigger) {
          await this.repository.updateRule(rule.id, { isDefault: false });
        }
      }
    }

    const rule = await this.repository.createRule({
      ...dto,
      isActive: true,
      priority: dto.priority || 0,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validTo: dto.validTo ? new Date(dto.validTo) : undefined,
    });

    this.eventEmitter.emit('commissions.rule_created', { rule });

    return rule;
  }

  async findRules(activeOnly: boolean = false) {
    return this.repository.findRules(activeOnly);
  }

  async findRuleById(id: string): Promise<any> {
    const rule = await this.repository.findRuleById(id);
    if (!rule) {
      throw new NotFoundException('Regra não encontrada');
    }
    return rule;
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto): Promise<any> {
    await this.findRuleById(id);
    return this.repository.updateRule(id, dto);
  }

  async deleteRule(id: string): Promise<void> {
    await this.findRuleById(id);
    await this.repository.deleteRule(id);
  }

  // ========================
  // PROFESSIONAL CONFIG
  // ========================

  async createProfessionalConfig(dto: CreateProfessionalConfigDto): Promise<any> {
    // Verificar se já existe config ativa
    const existing = await this.repository.findProfessionalConfig(dto.professionalId);
    if (existing) {
      throw new ConflictException('Profissional já possui configuração ativa');
    }

    const config = await this.repository.createProfessionalConfig({
      ...dto,
      isActive: true,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    });

    return config;
  }

  async findProfessionalConfig(professionalId: string) {
    return this.repository.findProfessionalConfig(professionalId);
  }

  async findProfessionalConfigs() {
    return this.repository.findProfessionalConfigs();
  }

  async updateProfessionalConfig(professionalId: string, dto: UpdateProfessionalConfigDto): Promise<any> {
    const config = await this.repository.findProfessionalConfig(professionalId);
    if (!config) {
      throw new NotFoundException('Configuração não encontrada');
    }
    return this.repository.updateProfessionalConfig(config.id, dto);
  }

  // ========================
  // ENTRIES
  // ========================

  async createEntry(dto: CreateCommissionEntryDto): Promise<any> {
    // Buscar regras e configuração do profissional
    const [rules, config] = await Promise.all([
      this.repository.findRules(true),
      this.repository.findProfessionalConfig(dto.professionalId),
    ]);

    // Determinar o trigger baseado no tipo de referência
    const triggerMap: Record<string, CommissionTrigger> = {
      APPOINTMENT: CommissionTrigger.APPOINTMENT_COMPLETED,
      SALE: CommissionTrigger.PRODUCT_SOLD,
      REFERRAL: CommissionTrigger.CUSTOMER_REFERRED,
      BONUS: CommissionTrigger.GOAL_ACHIEVED,
    };

    const input: CalculationInput = {
      professionalId: dto.professionalId,
      trigger: triggerMap[dto.referenceType],
      baseValue: dto.baseValue,
      serviceId: dto.serviceId,
      productId: dto.productId,
      customerId: dto.customerId,
    };

    // Encontrar regra aplicável
    const applicableRule = this.calculationService.findApplicableRule(rules, input);

    // Calcular comissão
    const calculation = this.calculationService.calculateCommission(input, applicableRule, config);

    // Criar entrada
    const entry = await this.repository.createEntry({
      professionalId: dto.professionalId,
      professionalName: '', // Será preenchido pelo repository ou evento
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      ruleId: calculation.ruleId,
      ruleName: calculation.ruleName,
      baseValue: dto.baseValue,
      commissionType: calculation.commissionType,
      percentage: calculation.percentage,
      fixedAmount: calculation.fixedAmount,
      calculatedAmount: calculation.calculatedAmount,
      adjustments: [],
      finalAmount: calculation.calculatedAmount,
      status: CommissionStatus.PENDING,
      serviceId: dto.serviceId,
      productId: dto.productId,
      customerId: dto.customerId,
      referenceDate: dto.referenceDate ? new Date(dto.referenceDate) : new Date(),
      notes: dto.notes,
    });

    this.eventEmitter.emit('commissions.entry_created', { entry, calculation });

    return entry;
  }

  async findEntries(query: CommissionQueryDto) {
    return this.repository.findEntries(query);
  }

  async findEntryById(id: string): Promise<any> {
    const entry = await this.repository.findEntryById(id);
    if (!entry) {
      throw new NotFoundException('Comissão não encontrada');
    }
    return entry;
  }

  async approveCommissions(dto: ApproveCommissionsDto, userId: string): Promise<any[]> {
    const entries = await this.repository.findEntriesByIds(dto.entryIds);

    for (const entry of entries) {
      if (entry.status !== CommissionStatus.PENDING) {
        throw new BadRequestException(`Comissão ${entry.id} não está pendente`);
      }
    }

    await this.repository.updateManyEntries(dto.entryIds, {
      status: CommissionStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    const approved = await this.repository.findEntriesByIds(dto.entryIds);

    this.eventEmitter.emit('commissions.entries_approved', { entries: approved, userId });

    return approved;
  }

  async adjustCommission(id: string, dto: AdjustCommissionDto, userId: string): Promise<any> {
    const entry = await this.findEntryById(id);

    if (entry.status === CommissionStatus.PAID) {
      throw new BadRequestException('Comissão já paga não pode ser ajustada');
    }

    const adjustment = {
      ...dto.adjustment,
      appliedBy: userId,
      appliedAt: new Date(),
    };

    const newAdjustments = [...(entry.adjustments || []), adjustment];
    const adjustmentTotal = newAdjustments.reduce((sum, adj) => {
      return adj.type === 'DEDUCTION' ? sum - adj.amount : sum + adj.amount;
    }, 0);

    const newFinalAmount = entry.calculatedAmount + adjustmentTotal;

    return this.repository.updateEntry(id, {
      adjustments: newAdjustments,
      finalAmount: Math.max(0, newFinalAmount),
    });
  }

  async cancelCommission(id: string): Promise<any> {
    const entry = await this.findEntryById(id);

    if (entry.status === CommissionStatus.PAID) {
      throw new BadRequestException('Comissão já paga não pode ser cancelada');
    }

    return this.repository.updateEntry(id, {
      status: CommissionStatus.CANCELLED,
    });
  }

  // ========================
  // PAYMENTS
  // ========================

  async createPayment(dto: CreatePaymentDto, userId: string): Promise<any> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    // Buscar entradas aprovadas não pagas
    let entries: any[];
    if (dto.entryIds?.length) {
      entries = await this.repository.findEntriesByIds(dto.entryIds);
    } else {
      entries = await this.repository.findApprovedUnpaidEntries(
        dto.professionalId,
        periodStart,
        periodEnd,
      );
    }

    if (!entries.length) {
      throw new BadRequestException('Nenhuma comissão aprovada encontrada');
    }

    // Calcular totais
    const grossAmount = entries.reduce((sum, e) => sum + e.finalAmount, 0);
    const deductionsTotal = (dto.deductions || []).reduce((sum, d) => sum + d.amount, 0);
    const bonusesTotal = (dto.bonuses || []).reduce((sum, b) => sum + b.amount, 0);
    const netAmount = grossAmount - deductionsTotal + bonusesTotal;

    // Criar pagamento
    const payment = await this.repository.createPayment({
      professionalId: dto.professionalId,
      professionalName: '', // Será preenchido
      periodStart,
      periodEnd,
      entries: entries.map((e) => e.id),
      entryCount: entries.length,
      grossAmount,
      deductions: dto.deductions || [],
      bonuses: dto.bonuses || [],
      netAmount,
      status: PaymentStatus.PENDING,
      notes: dto.notes,
      processedBy: userId,
    });

    // Atualizar entradas com referência ao pagamento
    await this.repository.updateManyEntries(
      entries.map((e) => e.id),
      { paymentId: payment.id },
    );

    this.eventEmitter.emit('commissions.payment_created', { payment });

    return payment;
  }

  async findPayments(query: PaymentQueryDto) {
    return this.repository.findPayments(query);
  }

  async findPaymentById(id: string): Promise<any> {
    const payment = await this.repository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  async processPayment(id: string, dto: ProcessPaymentDto, userId: string): Promise<any> {
    const payment = await this.findPaymentById(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pagamento não está pendente');
    }

    const updated = await this.repository.updatePayment(id, {
      status: PaymentStatus.PAID,
      paymentMethod: dto.paymentMethod,
      paymentReference: dto.paymentReference,
      paidAt: new Date(),
      notes: dto.notes || payment.notes,
    });

    // Atualizar entradas como pagas
    await this.repository.updateManyEntries(payment.entries, {
      status: CommissionStatus.PAID,
      paidAt: new Date(),
    });

    this.eventEmitter.emit('commissions.payment_processed', { payment: updated });

    return updated;
  }

  async cancelPayment(id: string): Promise<any> {
    const payment = await this.findPaymentById(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Pagamento já processado não pode ser cancelado');
    }

    // Remover referência do pagamento das entradas
    await this.repository.updateManyEntries(payment.entries, {
      paymentId: null,
    });

    return this.repository.updatePayment(id, {
      status: PaymentStatus.CANCELLED,
    });
  }

  // ========================
  // GOALS
  // ========================

  async createGoal(dto: CreateGoalDto): Promise<any> {
    const goal = await this.repository.createGoal({
      ...dto,
      isActive: true,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    this.eventEmitter.emit('commissions.goal_created', { goal });

    return goal;
  }

  async findGoals(query: GoalQueryDto) {
    return this.repository.findGoals(query);
  }

  async findGoalById(id: string): Promise<any> {
    const goal = await this.repository.findGoalById(id);
    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }
    return goal;
  }

  async updateGoal(id: string, dto: UpdateGoalDto): Promise<any> {
    await this.findGoalById(id);
    return this.repository.updateGoal(id, dto);
  }

  async deleteGoal(id: string): Promise<void> {
    await this.findGoalById(id);
    await this.repository.deleteGoal(id);
  }

  async getGoalProgress(goalId: string, professionalId?: string) {
    const goal = await this.findGoalById(goalId);
    return this.goalService.calculateGoalProgress(goal, professionalId);
  }

  async getActiveGoalsProgress(professionalId: string) {
    const goals = await this.repository.findActiveGoals(professionalId);

    return Promise.all(
      goals.map((goal) => this.goalService.calculateGoalProgress(goal, professionalId)),
    );
  }

  // ========================
  // SUMMARY & REPORTS
  // ========================

  async getSummary(query: SummaryQueryDto): Promise<CommissionSummary> {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : startOfMonth(new Date());
    const endDate = query.endDate
      ? new Date(query.endDate)
      : endOfMonth(new Date());

    const [stats, topServices, goalProgress] = await Promise.all([
      this.repository.getEntriesStats(query.professionalId, startDate, endDate),
      this.repository.getTopServices(query.professionalId, startDate, endDate),
      this.getActiveGoalsProgress(query.professionalId),
    ]);

    const statusTotals = stats.reduce(
      (acc, s) => ({
        ...acc,
        [s.status]: { amount: s._sum.finalAmount || 0, count: s._count },
      }),
      {} as Record<string, { amount: number; count: number }>,
    );

    const totalEntries = stats.reduce((sum, s) => sum + s._count, 0);
    const totalAmount = stats.reduce((sum, s) => sum + (s._sum.finalAmount || 0), 0);

    return {
      professionalId: query.professionalId,
      professionalName: '', // Seria preenchido com busca adicional
      period: { start: startDate, end: endDate },
      totalEntries,
      pendingAmount: statusTotals[CommissionStatus.PENDING]?.amount || 0,
      approvedAmount: statusTotals[CommissionStatus.APPROVED]?.amount || 0,
      paidAmount: statusTotals[CommissionStatus.PAID]?.amount || 0,
      totalAmount,
      averageCommission: totalEntries > 0 ? totalAmount / totalEntries : 0,
      topServices,
      topProducts: [],
      goalProgress,
    };
  }

  async getReport(query: ReportQueryDto): Promise<CommissionReport> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const [byProfessional, trends] = await Promise.all([
      this.repository.getRevenueByProfessional(startDate, endDate),
      this.repository.getTrends(startDate, endDate),
    ]);

    const totals = {
      grossRevenue: byProfessional.reduce((sum, p) => sum + (p._sum.baseValue || 0), 0),
      totalCommissions: byProfessional.reduce((sum, p) => sum + (p._sum.finalAmount || 0), 0),
      commissionRate: 0,
      entriesCount: byProfessional.reduce((sum, p) => sum + p._count, 0),
      professionalsCount: byProfessional.length,
    };

    totals.commissionRate = totals.grossRevenue > 0
      ? (totals.totalCommissions / totals.grossRevenue) * 100
      : 0;

    return {
      period: { start: startDate, end: endDate },
      totals,
      byProfessional: byProfessional.map((p) => ({
        professionalId: p.professionalId,
        professionalName: p.professionalName || '',
        revenue: p._sum.baseValue || 0,
        commissions: p._sum.finalAmount || 0,
        entries: p._count,
        averageTicket: p._count > 0 ? (p._sum.baseValue || 0) / p._count : 0,
      })),
      byService: [],
      byProduct: [],
      trends: trends.map((t) => ({
        date: t.referenceDate?.toISOString().split('T')[0] || '',
        revenue: t._sum.baseValue || 0,
        commissions: t._sum.finalAmount || 0,
      })),
    };
  }

  // ========================
  // EVENT HANDLERS
  // ========================

  async handleAppointmentCompleted(data: {
    appointmentId: string;
    professionalId: string;
    totalValue: number;
    serviceId?: string;
    customerId?: string;
  }): Promise<void> {
    await this.createEntry({
      professionalId: data.professionalId,
      referenceType: 'APPOINTMENT',
      referenceId: data.appointmentId,
      baseValue: data.totalValue,
      serviceId: data.serviceId,
      customerId: data.customerId,
      referenceDate: new Date().toISOString(),
    });
  }

  async handleProductSold(data: {
    saleId: string;
    professionalId: string;
    productId: string;
    quantity: number;
    totalValue: number;
    customerId?: string;
  }): Promise<void> {
    await this.createEntry({
      professionalId: data.professionalId,
      referenceType: 'SALE',
      referenceId: data.saleId,
      baseValue: data.totalValue,
      productId: data.productId,
      customerId: data.customerId,
      referenceDate: new Date().toISOString(),
    });
  }
}
