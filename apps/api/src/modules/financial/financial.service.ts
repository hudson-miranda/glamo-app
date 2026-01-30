import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinancialRepository } from './repositories';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { ReportingService } from './services/reporting.service';
import {
  CreatePaymentDto,
  ProcessCardPaymentDto,
  ProcessPixPaymentDto,
  RefundPaymentDto,
  UpdatePaymentDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  SendInvoiceDto,
  CreateTransactionDto,
  CreateCashFlowEntryDto,
  CloseDayDto,
  PaymentQueryDto,
  InvoiceQueryDto,
  TransactionQueryDto,
  CashFlowQueryDto,
  RevenueReportQueryDto,
} from './dto';
import {
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  TransactionType,
  TransactionCategory,
  CashFlowType,
} from './interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    private readonly repository: FinancialRepository,
    private readonly gatewayService: PaymentGatewayService,
    private readonly reportingService: ReportingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // PAYMENTS - CRUD
  // ========================

  async createPayment(dto: CreatePaymentDto): Promise<any> {
    // Pagamento em dinheiro ou outros métodos diretos
    const payment = await this.repository.createPayment({
      ...dto,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    // Criar transação
    await this.createTransactionFromPayment(payment);

    this.eventEmitter.emit('payment.created', { payment });

    return payment;
  }

  async processCardPayment(dto: ProcessCardPaymentDto): Promise<any> {
    // Processar via gateway
    const result = await this.gatewayService.processCardPayment({
      amount: dto.amount,
      cardToken: dto.cardToken,
      installments: dto.installmentDetails?.numberOfInstallments,
      customerId: dto.customerId,
    });

    if (!result.success) {
      throw new BadRequestException(result.error?.message || 'Falha no pagamento');
    }

    // Criar registro do pagamento
    const payment = await this.repository.createPayment({
      ...dto,
      method:
        dto.cardDetails?.isDebit === true
          ? PaymentMethod.DEBIT_CARD
          : PaymentMethod.CREDIT_CARD,
      status: result.status,
      gatewayData: result.gatewayData,
      paidAt: new Date(),
    });

    // Criar transação
    await this.createTransactionFromPayment(payment);

    this.eventEmitter.emit('payment.card_processed', { payment, result });

    return payment;
  }

  async processPixPayment(dto: ProcessPixPaymentDto): Promise<any> {
    // Gerar PIX
    const result = await this.gatewayService.generatePixPayment({
      amount: dto.amount,
      expirationMinutes: dto.expirationMinutes,
      customerId: dto.customerId,
    });

    if (!result.success) {
      throw new BadRequestException(result.error?.message || 'Falha ao gerar PIX');
    }

    // Criar registro do pagamento (pendente)
    const payment = await this.repository.createPayment({
      ...dto,
      method: PaymentMethod.PIX,
      status: PaymentStatus.PENDING,
      pixDetails: result.pixDetails,
      gatewayData: result.gatewayData,
    });

    this.eventEmitter.emit('payment.pix_generated', { payment, result });

    return payment;
  }

  async findPaymentById(id: string): Promise<any> {
    const payment = await this.repository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  async findPayments(query: PaymentQueryDto) {
    return this.repository.findPayments(query);
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<any> {
    await this.findPaymentById(id);
    return this.repository.updatePayment(id, dto);
  }

  async refundPayment(id: string, dto: RefundPaymentDto): Promise<any> {
    const payment = await this.findPaymentById(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Somente pagamentos completados podem ser reembolsados');
    }

    if (dto.amount > payment.amount) {
      throw new BadRequestException('Valor do reembolso maior que o pagamento');
    }

    // Processar reembolso no gateway (se aplicável)
    if (payment.gatewayData?.transactionId) {
      const result = await this.gatewayService.refundCardPayment(
        payment.gatewayData.transactionId,
        dto.amount,
      );

      if (!result.success) {
        throw new BadRequestException(result.error?.message || 'Falha no reembolso');
      }
    }

    const isPartial = dto.amount < payment.amount;
    const status = isPartial
      ? PaymentStatus.PARTIALLY_REFUNDED
      : PaymentStatus.REFUNDED;

    const updated = await this.repository.updatePayment(id, {
      status,
      refundedAt: new Date(),
      metadata: {
        ...(payment.metadata || {}),
        refund: {
          amount: dto.amount,
          reason: dto.reason,
          notes: dto.notes,
          processedAt: new Date(),
        },
      },
    });

    // Criar transação de reembolso
    await this.repository.createTransaction({
      type: TransactionType.REFUND,
      category: TransactionCategory.SERVICE,
      amount: -dto.amount,
      description: `Reembolso: ${dto.reason}`,
      paymentId: id,
      customerId: payment.customerId,
    });

    this.eventEmitter.emit('payment.refunded', { payment: updated, refund: dto });

    return updated;
  }

  async confirmPixPayment(id: string): Promise<any> {
    const payment = await this.findPaymentById(id);

    if (payment.method !== PaymentMethod.PIX) {
      throw new BadRequestException('Pagamento não é PIX');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('PIX já processado');
    }

    const updated = await this.repository.updatePayment(id, {
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    // Criar transação
    await this.createTransactionFromPayment(updated);

    this.eventEmitter.emit('payment.pix_confirmed', { payment: updated });

    return updated;
  }

  // ========================
  // INVOICES
  // ========================

  async createInvoice(dto: CreateInvoiceDto): Promise<any> {
    // Calcular totais
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
      0,
    );

    const total = subtotal - (dto.discount || 0) + (dto.tax || 0);

    const itemsWithIds = dto.items.map((item) => ({
      ...item,
      id: uuidv4(),
      total: item.quantity * item.unitPrice - (item.discount || 0),
    }));

    const invoice = await this.repository.createInvoice({
      ...dto,
      items: itemsWithIds,
      subtotal,
      total,
      discount: dto.discount || 0,
      tax: dto.tax || 0,
      amountPaid: 0,
      amountDue: total,
      issueDate: new Date(),
      dueDate: new Date(dto.dueDate),
      status: InvoiceStatus.DRAFT,
    });

    this.eventEmitter.emit('invoice.created', { invoice });

    return invoice;
  }

  async findInvoiceById(id: string): Promise<any> {
    const invoice = await this.repository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }
    return invoice;
  }

  async findInvoices(query: InvoiceQueryDto) {
    return this.repository.findInvoices(query);
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<any> {
    const existing = await this.findInvoiceById(id);

    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Fatura paga não pode ser alterada');
    }

    let updateData: any = { ...dto };

    // Recalcular totais se itens foram alterados
    if (dto.items) {
      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
        0,
      );

      const discount = dto.discount ?? existing.discount;
      const tax = dto.tax ?? existing.tax;
      const total = subtotal - discount + tax;

      updateData = {
        ...updateData,
        items: dto.items.map((item) => ({
          ...item,
          id: (item as any).id || uuidv4(),
          total: item.quantity * item.unitPrice - (item.discount || 0),
        })),
        subtotal,
        total,
        amountDue: total - existing.amountPaid,
      };
    }

    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    return this.repository.updateInvoice(id, updateData);
  }

  async sendInvoice(id: string, dto: SendInvoiceDto): Promise<any> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status === InvoiceStatus.DRAFT) {
      await this.repository.updateInvoice(id, {
        status: InvoiceStatus.SENT,
      });
    }

    // Emitir evento para envio de email
    this.eventEmitter.emit('invoice.send', {
      invoice,
      email: dto.email || invoice.customer?.email,
      message: dto.message,
    });

    return this.findInvoiceById(id);
  }

  async addPaymentToInvoice(invoiceId: string, paymentId: string): Promise<any> {
    const invoice = await this.findInvoiceById(invoiceId);
    const payment = await this.findPaymentById(paymentId);

    const newAmountPaid = invoice.amountPaid + payment.amount;
    const newAmountDue = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newAmountDue <= 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    }

    return this.repository.updateInvoice(invoiceId, {
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
    });
  }

  async cancelInvoice(id: string): Promise<any> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Fatura paga não pode ser cancelada');
    }

    const updated = await this.repository.updateInvoice(id, {
      status: InvoiceStatus.CANCELLED,
    });

    this.eventEmitter.emit('invoice.cancelled', { invoice: updated });

    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Somente faturas em rascunho podem ser deletadas');
    }

    await this.repository.deleteInvoice(id);
  }

  async findOverdueInvoices() {
    return this.repository.findOverdueInvoices();
  }

  // ========================
  // TRANSACTIONS
  // ========================

  async createTransaction(dto: CreateTransactionDto): Promise<any> {
    return this.repository.createTransaction({
      ...dto,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
    });
  }

  async findTransactions(query: TransactionQueryDto) {
    return this.repository.findTransactions(query);
  }

  async getCurrentBalance(): Promise<number> {
    return this.repository.getCurrentBalance();
  }

  // ========================
  // CASH FLOW
  // ========================

  async createCashFlowEntry(dto: CreateCashFlowEntryDto): Promise<any> {
    return this.repository.createCashFlowEntry({
      ...dto,
      entryDate: new Date(dto.entryDate),
    });
  }

  async getCashFlowSummary(query: CashFlowQueryDto) {
    return this.reportingService.getCashFlowSummary(
      new Date(query.startDate),
      new Date(query.endDate),
      query.includeProjected,
    );
  }

  // ========================
  // DAILY CLOSING
  // ========================

  async closDay(dto: CloseDayDto): Promise<any> {
    const date = new Date(dto.date);

    // Verificar se já foi fechado
    const existing = await this.repository.findDailyClosing(date);
    if (existing?.closedAt) {
      throw new ConflictException('Este dia já foi fechado');
    }

    // Gerar relatório do dia
    const report = await this.reportingService.generateDailyClosingReport(date);

    if (existing) {
      return this.repository.updateDailyClosing(existing.id, {
        ...report,
        notes: dto.notes,
        closedAt: new Date(),
      });
    }

    return this.repository.createDailyClosing({
      ...report,
      notes: dto.notes,
      closedAt: new Date(),
    });
  }

  async getDailyClosing(date: string) {
    const closing = await this.repository.findDailyClosing(new Date(date));
    if (!closing) {
      // Retornar relatório não fechado
      return this.reportingService.generateDailyClosingReport(new Date(date));
    }
    return closing;
  }

  // ========================
  // REPORTS
  // ========================

  async getRevenueReport(query: RevenueReportQueryDto) {
    return this.reportingService.getRevenueReport(
      new Date(query.startDate),
      new Date(query.endDate),
      {
        groupBy: query.groupBy,
        includeComparison: query.includeComparison,
      },
    );
  }

  async getRevenueTrends(days?: number) {
    return this.reportingService.getRevenueTrends(days);
  }

  // ========================
  // STATS
  // ========================

  async getPaymentStats(startDate?: string, endDate?: string) {
    return this.repository.getPaymentStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async getInvoiceStats() {
    return this.repository.getInvoiceStats();
  }

  // ========================
  // INSTALLMENTS
  // ========================

  async calculateInstallments(amount: number, maxInstallments?: number) {
    return this.gatewayService.calculateInstallments(amount, maxInstallments);
  }

  // ========================
  // HELPERS
  // ========================

  private async createTransactionFromPayment(payment: any): Promise<void> {
    await this.repository.createTransaction({
      type: TransactionType.PAYMENT,
      category: TransactionCategory.SERVICE,
      amount: payment.netAmount || payment.amount,
      description: `Pagamento #${payment.id.substring(0, 8)}`,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      customerId: payment.customerId,
    });
  }
}
