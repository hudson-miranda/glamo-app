import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';
import { FinancialService } from './financial.service';
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

@ApiTags('Financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ========================
  // PAYMENTS
  // ========================

  @Post('payments')
  @ApiOperation({ summary: 'Registrar pagamento direto (dinheiro, etc.)' })
  @ApiResponse({ status: 201, description: 'Pagamento registrado' })
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.financialService.createPayment(dto);
  }

  @Post('payments/card')
  @ApiOperation({ summary: 'Processar pagamento com cartão' })
  @ApiResponse({ status: 201, description: 'Pagamento processado' })
  async processCardPayment(@Body() dto: ProcessCardPaymentDto) {
    return this.financialService.processCardPayment(dto);
  }

  @Post('payments/pix')
  @ApiOperation({ summary: 'Gerar pagamento PIX' })
  @ApiResponse({ status: 201, description: 'PIX gerado' })
  async processPixPayment(@Body() dto: ProcessPixPaymentDto) {
    return this.financialService.processPixPayment(dto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findPayments(@Query() query: PaymentQueryDto) {
    return this.financialService.findPayments(query);
  }

  @Get('payments/stats')
  @ApiOperation({ summary: 'Estatísticas de pagamentos' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getPaymentStats(startDate, endDate);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  async findPaymentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.findPaymentById(id);
  }

  @Patch('payments/:id')
  @ApiOperation({ summary: 'Atualizar pagamento' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado' })
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.financialService.updatePayment(id, dto);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Reembolsar pagamento' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Reembolso processado' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.financialService.refundPayment(id, dto);
  }

  @Post('payments/:id/confirm-pix')
  @ApiOperation({ summary: 'Confirmar pagamento PIX' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'PIX confirmado' })
  async confirmPixPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.confirmPixPayment(id);
  }

  @Get('installments')
  @ApiOperation({ summary: 'Calcular opções de parcelamento' })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'maxInstallments', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Opções de parcelamento' })
  async calculateInstallments(
    @Query('amount') amount: number,
    @Query('maxInstallments') maxInstallments?: number,
  ) {
    return this.financialService.calculateInstallments(amount, maxInstallments);
  }

  // ========================
  // INVOICES
  // ========================

  @Post('invoices')
  @ApiOperation({ summary: 'Criar fatura' })
  @ApiResponse({ status: 201, description: 'Fatura criada' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.financialService.createInvoice(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Listar faturas' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findInvoices(@Query() query: InvoiceQueryDto) {
    return this.financialService.findInvoices(query);
  }

  @Get('invoices/stats')
  @ApiOperation({ summary: 'Estatísticas de faturas' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getInvoiceStats() {
    return this.financialService.getInvoiceStats();
  }

  @Get('invoices/overdue')
  @ApiOperation({ summary: 'Faturas vencidas' })
  @ApiResponse({ status: 200, description: 'Lista de faturas vencidas' })
  async findOverdueInvoices() {
    return this.financialService.findOverdueInvoices();
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Buscar fatura por ID' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 200, description: 'Fatura encontrada' })
  async findInvoiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.findInvoiceById(id);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Atualizar fatura' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 200, description: 'Fatura atualizada' })
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.financialService.updateInvoice(id, dto);
  }

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Enviar fatura por email' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 200, description: 'Fatura enviada' })
  async sendInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendInvoiceDto,
  ) {
    return this.financialService.sendInvoice(id, dto);
  }

  @Post('invoices/:invoiceId/payments/:paymentId')
  @ApiOperation({ summary: 'Vincular pagamento à fatura' })
  @ApiParam({ name: 'invoiceId', description: 'ID da fatura' })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento vinculado' })
  async addPaymentToInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.financialService.addPaymentToInvoice(invoiceId, paymentId);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancelar fatura' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 200, description: 'Fatura cancelada' })
  async cancelInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.cancelInvoice(id);
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar fatura (apenas rascunhos)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 204, description: 'Fatura deletada' })
  async deleteInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.deleteInvoice(id);
  }

  // ========================
  // TRANSACTIONS
  // ========================

  @Post('transactions')
  @ApiOperation({ summary: 'Criar transação manual' })
  @ApiResponse({ status: 201, description: 'Transação criada' })
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.financialService.createTransaction(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transações' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findTransactions(@Query() query: TransactionQueryDto) {
    return this.financialService.findTransactions(query);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Saldo atual' })
  @ApiResponse({ status: 200, description: 'Saldo' })
  async getCurrentBalance() {
    const balance = await this.financialService.getCurrentBalance();
    return { balance };
  }

  // ========================
  // CASH FLOW
  // ========================

  @Post('cash-flow')
  @ApiOperation({ summary: 'Criar entrada de fluxo de caixa' })
  @ApiResponse({ status: 201, description: 'Entrada criada' })
  async createCashFlowEntry(@Body() dto: CreateCashFlowEntryDto) {
    return this.financialService.createCashFlowEntry(dto);
  }

  @Get('cash-flow/summary')
  @ApiOperation({ summary: 'Resumo do fluxo de caixa' })
  @ApiResponse({ status: 200, description: 'Resumo' })
  async getCashFlowSummary(@Query() query: CashFlowQueryDto) {
    return this.financialService.getCashFlowSummary(query);
  }

  // ========================
  // DAILY CLOSING
  // ========================

  @Post('daily-closing')
  @ApiOperation({ summary: 'Fechar caixa do dia' })
  @ApiResponse({ status: 201, description: 'Fechamento realizado' })
  async closeDay(@Body() dto: CloseDayDto) {
    return this.financialService.closDay(dto);
  }

  @Get('daily-closing/:date')
  @ApiOperation({ summary: 'Obter fechamento do dia' })
  @ApiParam({ name: 'date', description: 'Data (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Fechamento' })
  async getDailyClosing(@Param('date') date: string) {
    return this.financialService.getDailyClosing(date);
  }

  // ========================
  // REPORTS
  // ========================

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Relatório de receita' })
  @ApiResponse({ status: 200, description: 'Relatório' })
  async getRevenueReport(@Query() query: RevenueReportQueryDto) {
    return this.financialService.getRevenueReport(query);
  }

  @Get('reports/trends')
  @ApiOperation({ summary: 'Tendências de receita' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Tendências' })
  async getRevenueTrends(@Query('days') days?: number) {
    return this.financialService.getRevenueTrends(days);
  }
}
