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
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CommissionsService } from './commissions.service';
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

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // ========================
  // RULES
  // ========================

  @Post('rules')
  @ApiOperation({ summary: 'Criar regra de comissão' })
  @ApiResponse({ status: 201, description: 'Regra criada' })
  async createRule(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionsService.createRule(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Listar regras' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de regras' })
  async findRules(@Query('activeOnly') activeOnly?: boolean) {
    return this.commissionsService.findRules(activeOnly);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Buscar regra por ID' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 200, description: 'Regra encontrada' })
  async findRuleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.findRuleById(id);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Atualizar regra' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 200, description: 'Regra atualizada' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionRuleDto,
  ) {
    return this.commissionsService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar regra' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 204, description: 'Deletada' })
  async deleteRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.deleteRule(id);
  }

  // ========================
  // PROFESSIONAL CONFIG
  // ========================

  @Post('configs')
  @ApiOperation({ summary: 'Criar configuração de profissional' })
  @ApiResponse({ status: 201, description: 'Configuração criada' })
  async createProfessionalConfig(@Body() dto: CreateProfessionalConfigDto) {
    return this.commissionsService.createProfessionalConfig(dto);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Listar configurações' })
  @ApiResponse({ status: 200, description: 'Lista de configurações' })
  async findProfessionalConfigs() {
    return this.commissionsService.findProfessionalConfigs();
  }

  @Get('configs/:professionalId')
  @ApiOperation({ summary: 'Buscar configuração do profissional' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Configuração encontrada' })
  async findProfessionalConfig(@Param('professionalId', ParseUUIDPipe) professionalId: string) {
    return this.commissionsService.findProfessionalConfig(professionalId);
  }

  @Patch('configs/:professionalId')
  @ApiOperation({ summary: 'Atualizar configuração' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  async updateProfessionalConfig(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Body() dto: UpdateProfessionalConfigDto,
  ) {
    return this.commissionsService.updateProfessionalConfig(professionalId, dto);
  }

  // ========================
  // ENTRIES
  // ========================

  @Post('entries')
  @ApiOperation({ summary: 'Criar entrada de comissão' })
  @ApiResponse({ status: 201, description: 'Entrada criada' })
  async createEntry(@Body() dto: CreateCommissionEntryDto) {
    return this.commissionsService.createEntry(dto);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Listar entradas' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findEntries(@Query() query: CommissionQueryDto) {
    return this.commissionsService.findEntries(query);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Buscar entrada por ID' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  @ApiResponse({ status: 200, description: 'Entrada encontrada' })
  async findEntryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.findEntryById(id);
  }

  @Post('entries/approve')
  @ApiOperation({ summary: 'Aprovar comissões' })
  @ApiResponse({ status: 200, description: 'Comissões aprovadas' })
  async approveCommissions(@Body() dto: ApproveCommissionsDto, @CurrentUser() user: any) {
    return this.commissionsService.approveCommissions(dto, user.id);
  }

  @Post('entries/:id/adjust')
  @ApiOperation({ summary: 'Ajustar comissão' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  @ApiResponse({ status: 200, description: 'Comissão ajustada' })
  async adjustCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.adjustCommission(id, dto, user.id);
  }

  @Post('entries/:id/cancel')
  @ApiOperation({ summary: 'Cancelar comissão' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  @ApiResponse({ status: 200, description: 'Comissão cancelada' })
  async cancelCommission(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.cancelCommission(id);
  }

  // ========================
  // PAYMENTS
  // ========================

  @Post('payments')
  @ApiOperation({ summary: 'Criar pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado' })
  async createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.commissionsService.createPayment(dto, user.id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findPayments(@Query() query: PaymentQueryDto) {
    return this.commissionsService.findPayments(query);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  async findPaymentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.findPaymentById(id);
  }

  @Post('payments/:id/process')
  @ApiOperation({ summary: 'Processar pagamento' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento processado' })
  async processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.processPayment(id, dto, user.id);
  }

  @Post('payments/:id/cancel')
  @ApiOperation({ summary: 'Cancelar pagamento' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento cancelado' })
  async cancelPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.cancelPayment(id);
  }

  // ========================
  // GOALS
  // ========================

  @Post('goals')
  @ApiOperation({ summary: 'Criar meta' })
  @ApiResponse({ status: 201, description: 'Meta criada' })
  async createGoal(@Body() dto: CreateGoalDto) {
    return this.commissionsService.createGoal(dto);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Listar metas' })
  @ApiResponse({ status: 200, description: 'Lista de metas' })
  async findGoals(@Query() query: GoalQueryDto) {
    return this.commissionsService.findGoals(query);
  }

  @Get('goals/:id')
  @ApiOperation({ summary: 'Buscar meta por ID' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @ApiResponse({ status: 200, description: 'Meta encontrada' })
  async findGoalById(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.findGoalById(id);
  }

  @Get('goals/:id/progress')
  @ApiOperation({ summary: 'Progresso da meta' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @ApiQuery({ name: 'professionalId', required: false })
  @ApiResponse({ status: 200, description: 'Progresso calculado' })
  async getGoalProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.commissionsService.getGoalProgress(id, professionalId);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Atualizar meta' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @ApiResponse({ status: 200, description: 'Meta atualizada' })
  async updateGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.commissionsService.updateGoal(id, dto);
  }

  @Delete('goals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar meta' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @ApiResponse({ status: 204, description: 'Deletada' })
  async deleteGoal(@Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.deleteGoal(id);
  }

  // ========================
  // SUMMARY & REPORTS
  // ========================

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de comissões do profissional' })
  @ApiResponse({ status: 200, description: 'Resumo' })
  async getSummary(@Query() query: SummaryQueryDto) {
    return this.commissionsService.getSummary(query);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Relatório de comissões' })
  @ApiResponse({ status: 200, description: 'Relatório' })
  async getReport(@Query() query: ReportQueryDto) {
    return this.commissionsService.getReport(query);
  }

  @Get('professionals/:professionalId/goals/active')
  @ApiOperation({ summary: 'Metas ativas do profissional' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Progresso das metas' })
  async getActiveGoalsProgress(@Param('professionalId', ParseUUIDPipe) professionalId: string) {
    return this.commissionsService.getActiveGoalsProgress(professionalId);
  }
}
