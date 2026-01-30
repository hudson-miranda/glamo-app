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
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  UpdatePreferencesDto,
  RegisterDeviceDto,
  UnregisterDeviceDto,
  NotificationQueryDto,
  TemplateQueryDto,
  BulkNotificationQueryDto,
  StatsQueryDto,
} from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ========================
  // SEND NOTIFICATIONS
  // ========================

  @Post('send')
  @ApiOperation({ summary: 'Enviar notificação' })
  @ApiResponse({ status: 201, description: 'Notificação enviada' })
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Post('send/immediate')
  @ApiOperation({ summary: 'Enviar notificação imediatamente' })
  @ApiResponse({ status: 201, description: 'Notificação enviada' })
  async sendImmediate(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendImmediate(dto);
  }

  @Post('send/bulk')
  @ApiOperation({ summary: 'Enviar notificação em massa' })
  @ApiResponse({ status: 201, description: 'Envio iniciado' })
  async sendBulk(@Body() dto: SendBulkNotificationDto, @CurrentUser() user: any) {
    return this.notificationsService.sendBulk(dto, user.id);
  }

  // ========================
  // NOTIFICATIONS
  // ========================

  @Get()
  @ApiOperation({ summary: 'Listar notificações' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findNotifications(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findNotifications(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar notificação por ID' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 200, description: 'Notificação encontrada' })
  async findNotificationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findNotificationById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar notificação pendente' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 200, description: 'Cancelada' })
  async cancelNotification(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.cancelNotification(id);
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Reenviar notificação com falha' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 200, description: 'Reenviada' })
  async resendNotification(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.resendNotification(id);
  }

  // ========================
  // TEMPLATES
  // ========================

  @Post('templates')
  @ApiOperation({ summary: 'Criar template' })
  @ApiResponse({ status: 201, description: 'Template criado' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.notificationsService.createTemplate(dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Listar templates' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findTemplates(@Query() query: TemplateQueryDto) {
    return this.notificationsService.findTemplates(query);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  async findTemplateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findTemplateById(id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Template atualizado' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.notificationsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar template' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.deleteTemplate(id);
  }

  @Post('templates/:id/preview')
  @ApiOperation({ summary: 'Visualizar template' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Preview gerado' })
  async previewTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() variables: Record<string, any>,
  ) {
    return this.notificationsService.previewTemplate(id, variables);
  }

  // ========================
  // PREFERENCES
  // ========================

  @Get('preferences/:recipientType/:recipientId')
  @ApiOperation({ summary: 'Obter preferências' })
  @ApiParam({ name: 'recipientType', enum: ['customer', 'professional', 'user'] })
  @ApiParam({ name: 'recipientId', description: 'ID do destinatário' })
  @ApiResponse({ status: 200, description: 'Preferências' })
  async getPreferences(
    @Param('recipientType') recipientType: 'customer' | 'professional' | 'user',
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ) {
    return this.notificationsService.getPreferences(recipientId, recipientType);
  }

  @Patch('preferences/:recipientType/:recipientId')
  @ApiOperation({ summary: 'Atualizar preferências' })
  @ApiParam({ name: 'recipientType', enum: ['customer', 'professional', 'user'] })
  @ApiParam({ name: 'recipientId', description: 'ID do destinatário' })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas' })
  async updatePreferences(
    @Param('recipientType') recipientType: 'customer' | 'professional' | 'user',
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(recipientId, recipientType, dto);
  }

  // ========================
  // DEVICE TOKENS
  // ========================

  @Post('devices/register')
  @ApiOperation({ summary: 'Registrar dispositivo' })
  @ApiResponse({ status: 201, description: 'Dispositivo registrado' })
  async registerDevice(@Body() dto: RegisterDeviceDto, @CurrentUser() user: any) {
    return this.notificationsService.registerDevice(
      user.id,
      user.type || 'user',
      dto,
    );
  }

  @Post('devices/unregister')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desregistrar dispositivo' })
  @ApiResponse({ status: 204, description: 'Dispositivo removido' })
  async unregisterDevice(@Body() dto: UnregisterDeviceDto) {
    return this.notificationsService.unregisterDevice(dto.token);
  }

  // ========================
  // BULK NOTIFICATIONS
  // ========================

  @Get('bulk')
  @ApiOperation({ summary: 'Listar envios em massa' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findBulkNotifications(@Query() query: BulkNotificationQueryDto) {
    return this.notificationsService.findBulkNotifications(query);
  }

  @Get('bulk/:id')
  @ApiOperation({ summary: 'Buscar envio em massa por ID' })
  @ApiParam({ name: 'id', description: 'ID do envio' })
  @ApiResponse({ status: 200, description: 'Envio encontrado' })
  async findBulkNotificationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findBulkNotificationById(id);
  }

  @Post('bulk/:id/cancel')
  @ApiOperation({ summary: 'Cancelar envio em massa' })
  @ApiParam({ name: 'id', description: 'ID do envio' })
  @ApiResponse({ status: 200, description: 'Cancelado' })
  async cancelBulkNotification(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.cancelBulkNotification(id);
  }

  // ========================
  // STATISTICS
  // ========================

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats(@Query() query: StatsQueryDto) {
    return this.notificationsService.getStats(query);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Status da fila de envio' })
  @ApiResponse({ status: 200, description: 'Status da fila' })
  async getQueueStatus() {
    return this.notificationsService.getQueueStatus();
  }
}
