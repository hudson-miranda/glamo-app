import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/tenancy/guards/tenant.guard';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { RequireFeature, CheckLimit } from '@core/tenancy/decorators/tenant.decorator';

import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  AppointmentQueryDto,
  AvailabilityQueryDto,
  SlotsQueryDto,
} from './dto';

/**
 * Controller de agendamentos
 */
@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Cria um novo agendamento
   */
  @Post()
  @CheckLimit('appointmentsPerMonth')
  @ApiOperation({ summary: 'Criar agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conflito de horário' })
  @ApiResponse({ status: 403, description: 'Limite de agendamentos atingido' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.create(dto, userId);
  }

  /**
   * Lista agendamentos com filtros
   */
  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  async findAll(@Query() query: AppointmentQueryDto) {
    return this.appointmentsService.findMany(query);
  }

  /**
   * Busca slots disponíveis para uma data
   */
  @Get('availability/slots')
  @ApiOperation({ summary: 'Buscar horários disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de slots disponíveis' })
  async getAvailableSlots(@Query() query: SlotsQueryDto) {
    return this.appointmentsService.getAvailableSlots(
      query.professionalId,
      new Date(query.date),
      query.serviceIds,
    );
  }

  /**
   * Busca disponibilidade por range de datas
   */
  @Get('availability/range')
  @ApiOperation({ summary: 'Buscar disponibilidade por período' })
  @ApiResponse({ status: 200, description: 'Disponibilidade por dia' })
  async getAvailabilityRange(@Query() query: AvailabilityQueryDto) {
    return this.appointmentsService.getAvailabilityRange(
      query.professionalId!,
      new Date(query.startDate),
      new Date(query.endDate),
      query.serviceIds,
    );
  }

  /**
   * Busca agendamentos por período (para agenda/calendário)
   */
  @Get('calendar')
  @ApiOperation({ summary: 'Buscar agendamentos para calendário' })
  @ApiQuery({ name: 'startDate', type: String, required: true })
  @ApiQuery({ name: 'endDate', type: String, required: true })
  @ApiQuery({ name: 'professionalId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Agendamentos do período' })
  async getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.appointmentsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      professionalId,
    );
  }

  /**
   * Obtém contagem por status
   */
  @Get('stats/status-count')
  @ApiOperation({ summary: 'Contagem de agendamentos por status' })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Contagem por status' })
  async getStatusCounts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getStatusCounts(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Busca agendamento por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findById(id);
  }

  /**
   * Atualiza um agendamento
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.update(id, dto, userId);
  }

  /**
   * Confirma um agendamento
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar agendamento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Agendamento confirmado' })
  @ApiResponse({ status: 400, description: 'Status inválido para confirmação' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.confirm(id, userId);
  }

  /**
   * Faz check-in do cliente
   */
  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in do cliente' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Check-in realizado' })
  @ApiResponse({ status: 400, description: 'Status inválido para check-in' })
  async checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.checkIn(id, userId);
  }

  /**
   * Inicia o atendimento
   */
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar atendimento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Atendimento iniciado' })
  @ApiResponse({ status: 400, description: 'Status inválido para iniciar' })
  async startService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.startService(id, userId);
  }

  /**
   * Finaliza o atendimento
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalizar atendimento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Atendimento finalizado' })
  @ApiResponse({ status: 400, description: 'Status inválido para finalizar' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.complete(id, userId);
  }

  /**
   * Reagenda um agendamento
   */
  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reagendar agendamento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Agendamento reagendado' })
  @ApiResponse({ status: 400, description: 'Conflito de horário ou status inválido' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.reschedule(id, dto, userId);
  }

  /**
   * Cancela um agendamento
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado' })
  @ApiResponse({ status: 400, description: 'Status inválido para cancelamento' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.cancel(id, dto, userId);
  }

  /**
   * Marca como no-show
   */
  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar como falta (no-show)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Marcado como falta' })
  @ApiResponse({ status: 400, description: 'Status inválido para no-show' })
  async markNoShow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.markNoShow(id, userId);
  }
}
