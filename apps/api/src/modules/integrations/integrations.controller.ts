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
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { IntegrationsService } from './integrations.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateApiKeyDto,
  SendWhatsAppMessageDto,
  CreatePaymentIntentDto,
  GeneratePixDto,
  CreateCalendarEventDto,
  IntegrationQueryDto,
  WebhookQueryDto,
  WebhookDeliveryQueryDto,
  WhatsAppMessageQueryDto,
  SyncLogQueryDto,
} from './dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ========================
  // INTEGRATIONS
  // ========================

  @Post()
  @ApiOperation({ summary: 'Criar integração' })
  @ApiResponse({ status: 201, description: 'Integração criada' })
  async createIntegration(@Body() dto: CreateIntegrationDto) {
    return this.integrationsService.createIntegration(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar integrações' })
  @ApiResponse({ status: 200, description: 'Lista de integrações' })
  async findIntegrations(@Query() query: IntegrationQueryDto) {
    return this.integrationsService.findIntegrations(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar integração por ID' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração encontrada' })
  async findIntegrationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.findIntegrationById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar integração' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração atualizada' })
  async updateIntegration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.updateIntegration(id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar integração' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração ativada' })
  async activateIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.activateIntegration(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desativar integração' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração desativada' })
  async deactivateIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.deactivateIntegration(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar conexão' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Resultado do teste' })
  async testIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.testIntegration(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar integração' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 204, description: 'Deletada' })
  async deleteIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.deleteIntegration(id);
  }

  // ========================
  // WEBHOOKS
  // ========================

  @Post('webhooks')
  @ApiOperation({ summary: 'Criar webhook' })
  @ApiResponse({ status: 201, description: 'Webhook criado' })
  async createWebhook(@Body() dto: CreateWebhookDto) {
    return this.integrationsService.createWebhook(dto);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Listar webhooks' })
  @ApiResponse({ status: 200, description: 'Lista de webhooks' })
  async findWebhooks(@Query() query: WebhookQueryDto) {
    return this.integrationsService.findWebhooks(query);
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Buscar webhook por ID' })
  @ApiParam({ name: 'id', description: 'ID do webhook' })
  @ApiResponse({ status: 200, description: 'Webhook encontrado' })
  async findWebhookById(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.findWebhookById(id);
  }

  @Patch('webhooks/:id')
  @ApiOperation({ summary: 'Atualizar webhook' })
  @ApiParam({ name: 'id', description: 'ID do webhook' })
  @ApiResponse({ status: 200, description: 'Webhook atualizado' })
  async updateWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.integrationsService.updateWebhook(id, dto);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar webhook' })
  @ApiParam({ name: 'id', description: 'ID do webhook' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteWebhook(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.deleteWebhook(id);
  }

  @Get('webhooks/deliveries')
  @ApiOperation({ summary: 'Listar entregas de webhook' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findWebhookDeliveries(@Query() query: WebhookDeliveryQueryDto) {
    return this.integrationsService.findWebhookDeliveries(query);
  }

  @Post('webhooks/deliveries/:id/retry')
  @ApiOperation({ summary: 'Reenviar webhook' })
  @ApiParam({ name: 'id', description: 'ID da entrega' })
  @ApiResponse({ status: 200, description: 'Reenviado' })
  async retryWebhookDelivery(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.retryWebhookDelivery(id);
  }

  // ========================
  // WHATSAPP
  // ========================

  @Post(':id/whatsapp/send')
  @ApiOperation({ summary: 'Enviar mensagem WhatsApp' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada' })
  async sendWhatsAppMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendWhatsAppMessageDto,
  ) {
    return this.integrationsService.sendWhatsAppMessage(id, dto);
  }

  @Get(':id/whatsapp/messages')
  @ApiOperation({ summary: 'Listar mensagens WhatsApp' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findWhatsAppMessages(@Query() query: WhatsAppMessageQueryDto) {
    return this.integrationsService.findWhatsAppMessages(query);
  }

  // ========================
  // PAYMENT
  // ========================

  @Post(':id/payment/intent')
  @ApiOperation({ summary: 'Criar intenção de pagamento' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 201, description: 'Intent criado' })
  async createPaymentIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.integrationsService.createPaymentIntent(id, dto);
  }

  @Post(':id/payment/pix')
  @ApiOperation({ summary: 'Gerar PIX' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 201, description: 'PIX gerado' })
  async generatePix(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeneratePixDto,
  ) {
    return this.integrationsService.generatePix(id, dto);
  }

  // ========================
  // CALENDAR
  // ========================

  @Post(':id/calendar/events')
  @ApiOperation({ summary: 'Criar evento no calendário' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 201, description: 'Evento criado' })
  async createCalendarEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.integrationsService.createCalendarEvent(id, dto);
  }

  @Post(':id/calendar/sync')
  @ApiOperation({ summary: 'Sincronizar calendário' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Sincronização iniciada' })
  async syncCalendar(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.syncCalendar(id);
  }

  @Get('sync-logs')
  @ApiOperation({ summary: 'Listar logs de sincronização' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findSyncLogs(@Query() query: SyncLogQueryDto) {
    return this.integrationsService.findSyncLogs(query);
  }

  // ========================
  // API KEYS
  // ========================

  @Post('api-keys')
  @ApiOperation({ summary: 'Criar API key' })
  @ApiResponse({ status: 201, description: 'API key criada' })
  async createApiKey(@Body() dto: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.integrationsService.createApiKey(dto, user.id);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Listar API keys' })
  @ApiResponse({ status: 200, description: 'Lista de API keys' })
  async findApiKeys() {
    return this.integrationsService.findApiKeys();
  }

  @Post('api-keys/:id/revoke')
  @ApiOperation({ summary: 'Revogar API key' })
  @ApiParam({ name: 'id', description: 'ID da API key' })
  @ApiResponse({ status: 200, description: 'Revogada' })
  async revokeApiKey(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.revokeApiKey(id);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar API key' })
  @ApiParam({ name: 'id', description: 'ID da API key' })
  @ApiResponse({ status: 204, description: 'Deletada' })
  async deleteApiKey(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.deleteApiKey(id);
  }
}

// ========================
// WEBHOOK RECEIVER CONTROLLER
// ========================

@ApiTags('Webhooks - Receiver')
@Controller('webhooks/receive')
export class WebhookReceiverController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('whatsapp')
  async verifyWhatsAppWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = await this.integrationsService.verifyWhatsAppWebhook(mode, token, challenge);
    if (result) {
      return res.send(result);
    }
    return res.sendStatus(403);
  }

  @Post('whatsapp')
  async handleWhatsAppWebhook(@Body() payload: any) {
    await this.integrationsService.handleWhatsAppWebhook(payload);
    return { status: 'ok' };
  }

  @Post('payment/:integrationId')
  async handlePaymentWebhook(
    @Param('integrationId') integrationId: string,
    @Body() payload: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    await this.integrationsService.handlePaymentWebhook(integrationId, payload, signature);
    return { status: 'ok' };
  }
}
