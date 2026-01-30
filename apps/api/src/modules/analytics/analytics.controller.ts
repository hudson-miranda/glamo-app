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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
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

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ========================
  // OVERVIEW
  // ========================

  @Get('overview')
  @ApiOperation({ summary: 'Visão geral' })
  @ApiResponse({ status: 200, description: 'Dados de visão geral' })
  async getOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(query);
  }

  // ========================
  // ANALYTICS ENDPOINTS
  // ========================

  @Get('revenue')
  @ApiOperation({ summary: 'Analytics de receita' })
  @ApiResponse({ status: 200, description: 'Dados de receita' })
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Analytics de agendamentos' })
  @ApiResponse({ status: 200, description: 'Dados de agendamentos' })
  async getAppointmentAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getAppointmentAnalytics(query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Analytics de clientes' })
  @ApiResponse({ status: 200, description: 'Dados de clientes' })
  async getCustomerAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerAnalytics(query);
  }

  @Get('services')
  @ApiOperation({ summary: 'Analytics de serviços' })
  @ApiResponse({ status: 200, description: 'Dados de serviços' })
  async getServiceAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getServiceAnalytics(query);
  }

  @Get('professionals')
  @ApiOperation({ summary: 'Analytics de profissionais' })
  @ApiResponse({ status: 200, description: 'Dados de profissionais' })
  async getProfessionalAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProfessionalAnalytics(query);
  }

  @Get('products')
  @ApiOperation({ summary: 'Analytics de produtos' })
  @ApiResponse({ status: 200, description: 'Dados de produtos' })
  async getProductAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProductAnalytics(query);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Analytics de ocupação' })
  @ApiResponse({ status: 200, description: 'Dados de ocupação' })
  async getOccupancyAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOccupancyAnalytics(query);
  }

  // ========================
  // DASHBOARDS
  // ========================

  @Post('dashboards')
  @ApiOperation({ summary: 'Criar dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard criado' })
  async createDashboard(@Body() dto: CreateDashboardDto, @CurrentUser() user: any) {
    return this.analyticsService.createDashboard(dto, user.id);
  }

  @Get('dashboards')
  @ApiOperation({ summary: 'Listar dashboards' })
  @ApiResponse({ status: 200, description: 'Lista de dashboards' })
  async findDashboards(@Query() query: DashboardQueryDto, @CurrentUser() user: any) {
    return this.analyticsService.findDashboards(user.id, query);
  }

  @Get('dashboards/:id')
  @ApiOperation({ summary: 'Buscar dashboard por ID' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard encontrado' })
  async findDashboardById(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.findDashboardById(id);
  }

  @Patch('dashboards/:id')
  @ApiOperation({ summary: 'Atualizar dashboard' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard atualizado' })
  async updateDashboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDashboardDto,
  ) {
    return this.analyticsService.updateDashboard(id, dto);
  }

  @Delete('dashboards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar dashboard' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteDashboard(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.deleteDashboard(id);
  }

  // ========================
  // REPORTS
  // ========================

  @Post('reports')
  @ApiOperation({ summary: 'Criar relatório' })
  @ApiResponse({ status: 201, description: 'Relatório criado' })
  async createReport(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
    return this.analyticsService.createReport(dto, user.id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Listar relatórios' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findReports(@Query() query: ReportQueryDto) {
    return this.analyticsService.findReports(query);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Buscar relatório por ID' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: 200, description: 'Relatório encontrado' })
  async findReportById(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.findReportById(id);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Atualizar relatório' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: 200, description: 'Relatório atualizado' })
  async updateReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.analyticsService.updateReport(id, dto);
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar relatório' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.deleteReport(id);
  }

  @Post('reports/:id/generate')
  @ApiOperation({ summary: 'Gerar relatório' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: 200, description: 'Geração iniciada' })
  async generateReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.generateReport(id);
  }

  // ========================
  // KPIS
  // ========================

  @Post('kpis')
  @ApiOperation({ summary: 'Criar KPI' })
  @ApiResponse({ status: 201, description: 'KPI criado' })
  async createKPI(@Body() dto: CreateKPIDto) {
    return this.analyticsService.createKPI(dto);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Listar KPIs' })
  @ApiResponse({ status: 200, description: 'Lista de KPIs' })
  async findKPIs(@Query() query: KPIQueryDto) {
    return this.analyticsService.findKPIs(query);
  }

  @Patch('kpis/:id')
  @ApiOperation({ summary: 'Atualizar KPI' })
  @ApiParam({ name: 'id', description: 'ID do KPI' })
  @ApiResponse({ status: 200, description: 'KPI atualizado' })
  async updateKPI(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKPIDto) {
    return this.analyticsService.updateKPI(id, dto);
  }

  @Delete('kpis/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar KPI' })
  @ApiParam({ name: 'id', description: 'ID do KPI' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteKPI(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.deleteKPI(id);
  }

  // ========================
  // ALERTS
  // ========================

  @Post('alerts')
  @ApiOperation({ summary: 'Criar alerta' })
  @ApiResponse({ status: 201, description: 'Alerta criado' })
  async createAlert(@Body() dto: CreateAlertDto) {
    return this.analyticsService.createAlert(dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Listar alertas' })
  @ApiResponse({ status: 200, description: 'Lista de alertas' })
  async findAlerts() {
    return this.analyticsService.findAlerts();
  }

  @Patch('alerts/:id')
  @ApiOperation({ summary: 'Atualizar alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 200, description: 'Alerta atualizado' })
  async updateAlert(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAlertDto) {
    return this.analyticsService.updateAlert(id, dto);
  }

  @Delete('alerts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.deleteAlert(id);
  }
}
