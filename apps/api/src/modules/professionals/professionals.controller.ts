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
import { ProfessionalsService } from './professionals.service';
import {
  CreateProfessionalDto,
  UpdateProfessionalDto,
  CreateScheduleBlockDto,
  UpdateScheduleBlockDto,
  UpdateWorkingHoursDto,
  UpdateCommissionRulesDto,
  AddServicesDto,
  RemoveServicesDto,
  ReorderProfessionalsDto,
  ProfessionalQueryDto,
  AvailabilityQueryDto,
  AvailabilityRangeQueryDto,
} from './dto';

@ApiTags('Professionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  // ========================
  // CRUD
  // ========================

  @Post()
  @ApiOperation({ summary: 'Criar profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado' })
  async create(@Body() dto: CreateProfessionalDto) {
    return this.professionalsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar profissionais' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findMany(@Query() query: ProfessionalQueryDto) {
    return this.professionalsService.findMany(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar profissionais ativos' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais ativos' })
  async findActive() {
    return this.professionalsService.findActive();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de profissionais' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats() {
    return this.professionalsService.getStats();
  }

  @Get('by-service/:serviceId')
  @ApiOperation({ summary: 'Listar profissionais por serviço' })
  @ApiParam({ name: 'serviceId', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais' })
  async findByService(@Param('serviceId', ParseUUIDPipe) serviceId: string) {
    return this.professionalsService.findByService(serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Profissional encontrado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.professionalsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Profissional atualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar profissional (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.professionalsService.delete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Restaurado' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.professionalsService.restore(id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar profissionais' })
  @ApiResponse({ status: 200, description: 'Reordenado' })
  async reorder(@Body() dto: ReorderProfessionalsDto) {
    return this.professionalsService.reorder(dto);
  }

  // ========================
  // SERVICES
  // ========================

  @Post(':id/services')
  @ApiOperation({ summary: 'Adicionar serviços ao profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Serviços adicionados' })
  async addServices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddServicesDto,
  ) {
    return this.professionalsService.addServices(id, dto);
  }

  @Delete(':id/services')
  @ApiOperation({ summary: 'Remover serviços do profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Serviços removidos' })
  async removeServices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveServicesDto,
  ) {
    return this.professionalsService.removeServices(id, dto);
  }

  // ========================
  // WORKING HOURS
  // ========================

  @Patch(':id/working-hours')
  @ApiOperation({ summary: 'Atualizar horários de trabalho' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Horários atualizados' })
  async updateWorkingHours(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkingHoursDto,
  ) {
    return this.professionalsService.updateWorkingHours(id, dto);
  }

  // ========================
  // COMMISSIONS
  // ========================

  @Patch(':id/commission-rules')
  @ApiOperation({ summary: 'Atualizar regras de comissão' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Regras atualizadas' })
  async updateCommissionRules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionRulesDto,
  ) {
    return this.professionalsService.updateCommissionRules(id, dto);
  }

  // ========================
  // SCHEDULE BLOCKS
  // ========================

  @Post(':id/schedule-blocks')
  @ApiOperation({ summary: 'Criar bloqueio de agenda (férias, folga, etc.)' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 201, description: 'Bloqueio criado' })
  async createScheduleBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateScheduleBlockDto,
  ) {
    return this.professionalsService.createScheduleBlock(id, dto);
  }

  @Get(':id/schedule-blocks')
  @ApiOperation({ summary: 'Listar bloqueios de agenda' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiQuery({ name: 'startDate', description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Lista de bloqueios' })
  async findScheduleBlocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.professionalsService.findScheduleBlocks(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch('schedule-blocks/:blockId')
  @ApiOperation({ summary: 'Atualizar bloqueio' })
  @ApiParam({ name: 'blockId', description: 'ID do bloqueio' })
  @ApiResponse({ status: 200, description: 'Bloqueio atualizado' })
  async updateScheduleBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: UpdateScheduleBlockDto,
  ) {
    return this.professionalsService.updateScheduleBlock(blockId, dto);
  }

  @Post('schedule-blocks/:blockId/approve')
  @ApiOperation({ summary: 'Aprovar bloqueio' })
  @ApiParam({ name: 'blockId', description: 'ID do bloqueio' })
  @ApiResponse({ status: 200, description: 'Bloqueio aprovado' })
  async approveScheduleBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @CurrentUser() user: any,
  ) {
    return this.professionalsService.approveScheduleBlock(blockId, user.id);
  }

  @Post('schedule-blocks/:blockId/reject')
  @ApiOperation({ summary: 'Rejeitar bloqueio' })
  @ApiParam({ name: 'blockId', description: 'ID do bloqueio' })
  @ApiResponse({ status: 200, description: 'Bloqueio rejeitado' })
  async rejectScheduleBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @CurrentUser() user: any,
  ) {
    return this.professionalsService.rejectScheduleBlock(blockId, user.id);
  }

  @Delete('schedule-blocks/:blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar bloqueio' })
  @ApiParam({ name: 'blockId', description: 'ID do bloqueio' })
  @ApiResponse({ status: 204, description: 'Bloqueio deletado' })
  async deleteScheduleBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.professionalsService.deleteScheduleBlock(blockId);
  }

  // ========================
  // AVAILABILITY
  // ========================

  @Get(':id/availability')
  @ApiOperation({ summary: 'Obter disponibilidade para uma data' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Disponibilidade' })
  async getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.professionalsService.getAvailability(id, query);
  }

  @Get(':id/availability-range')
  @ApiOperation({ summary: 'Obter disponibilidade para um período' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Disponibilidade por dia' })
  async getAvailabilityRange(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityRangeQueryDto,
  ) {
    return this.professionalsService.getAvailabilityRange(id, query);
  }

  @Get(':id/next-available')
  @ApiOperation({ summary: 'Próximos horários disponíveis' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiQuery({ name: 'serviceId', required: false })
  @ApiQuery({ name: 'duration', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de horários' })
  async getNextAvailableSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('serviceId') serviceId?: string,
    @Query('duration') duration?: number,
    @Query('limit') limit?: number,
  ) {
    return this.professionalsService.getNextAvailableSlots(id, {
      serviceId,
      duration,
      limit,
    });
  }
}
