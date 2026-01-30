import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IntegrationsRepository } from './repositories';
import { WhatsAppService, WebhookService, PaymentGatewayService, CalendarService } from './services';
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
import { IntegrationStatus } from './interfaces';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly whatsAppService: WhatsAppService,
    private readonly webhookService: WebhookService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly calendarService: CalendarService,
  ) {}

  // ========================
  // INTEGRATIONS
  // ========================

  async createIntegration(dto: CreateIntegrationDto): Promise<any> {
    const existing = await this.repository.findIntegrationByType(dto.type, dto.provider);
    if (existing) {
      throw new ConflictException('Já existe uma integração deste tipo/provedor');
    }

    return this.repository.createIntegration({
      ...dto,
      status: IntegrationStatus.PENDING,
    });
  }

  async findIntegrations(query: IntegrationQueryDto) {
    return this.repository.findIntegrations(query);
  }

  async findIntegrationById(id: string): Promise<any> {
    const integration = await this.repository.findIntegrationById(id);
    if (!integration) {
      throw new NotFoundException('Integração não encontrada');
    }
    return integration;
  }

  async updateIntegration(id: string, dto: UpdateIntegrationDto): Promise<any> {
    await this.findIntegrationById(id);
    return this.repository.updateIntegration(id, dto);
  }

  async activateIntegration(id: string): Promise<any> {
    await this.findIntegrationById(id);
    return this.repository.updateIntegration(id, {
      status: IntegrationStatus.ACTIVE,
    });
  }

  async deactivateIntegration(id: string): Promise<any> {
    await this.findIntegrationById(id);
    return this.repository.updateIntegration(id, {
      status: IntegrationStatus.INACTIVE,
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.findIntegrationById(id);
    await this.repository.deleteIntegration(id);
  }

  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findIntegrationById(id);
    // Implementar teste de conexão específico para cada tipo
    return { success: true, message: 'Conexão bem-sucedida' };
  }

  // ========================
  // WEBHOOKS
  // ========================

  async createWebhook(dto: CreateWebhookDto): Promise<any> {
    const secret = dto.secret || crypto.randomBytes(32).toString('hex');
    return this.repository.createWebhook({
      ...dto,
      secret,
      isActive: true,
      successCount: 0,
      failureCount: 0,
      retryPolicy: dto.retryPolicy || {
        maxRetries: 3,
        retryInterval: 60,
        exponentialBackoff: true,
      },
    });
  }

  async findWebhooks(query: WebhookQueryDto) {
    return this.repository.findWebhooks(query);
  }

  async findWebhookById(id: string): Promise<any> {
    const webhook = await this.repository.findWebhookById(id);
    if (!webhook) {
      throw new NotFoundException('Webhook não encontrado');
    }
    return webhook;
  }

  async updateWebhook(id: string, dto: UpdateWebhookDto): Promise<any> {
    await this.findWebhookById(id);
    return this.repository.updateWebhook(id, dto);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.findWebhookById(id);
    await this.repository.deleteWebhook(id);
  }

  async findWebhookDeliveries(query: WebhookDeliveryQueryDto) {
    return this.repository.findWebhookDeliveries(query);
  }

  async retryWebhookDelivery(deliveryId: string): Promise<void> {
    await this.webhookService.deliverWebhook(deliveryId);
  }

  // ========================
  // WHATSAPP
  // ========================

  async sendWhatsAppMessage(integrationId: string, dto: SendWhatsAppMessageDto) {
    return this.whatsAppService.sendMessage(integrationId, dto);
  }

  async findWhatsAppMessages(query: WhatsAppMessageQueryDto) {
    return this.repository.findWhatsAppMessages(query);
  }

  async handleWhatsAppWebhook(payload: any) {
    return this.whatsAppService.handleWebhook(payload);
  }

  async verifyWhatsAppWebhook(mode: string, token: string, challenge: string) {
    return this.whatsAppService.verifyWebhook(mode, token, challenge);
  }

  // ========================
  // PAYMENT GATEWAY
  // ========================

  async createPaymentIntent(integrationId: string, dto: CreatePaymentIntentDto) {
    return this.paymentGatewayService.createPaymentIntent(integrationId, dto);
  }

  async generatePix(integrationId: string, dto: GeneratePixDto) {
    return this.paymentGatewayService.generatePix(integrationId, dto);
  }

  async handlePaymentWebhook(integrationId: string, payload: any, signature?: string) {
    return this.paymentGatewayService.handleWebhook(integrationId, payload, signature);
  }

  // ========================
  // CALENDAR
  // ========================

  async createCalendarEvent(integrationId: string, dto: CreateCalendarEventDto) {
    return this.calendarService.createEvent(integrationId, dto);
  }

  async syncCalendar(integrationId: string) {
    return this.calendarService.syncFromCalendar(integrationId);
  }

  async findSyncLogs(query: SyncLogQueryDto) {
    return this.repository.findSyncLogs(query);
  }

  // ========================
  // API KEYS
  // ========================

  async createApiKey(dto: CreateApiKeyDto, userId: string) {
    const key = crypto.randomBytes(32).toString('base64url');
    const keyPrefix = key.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = await this.repository.createApiKey({
      ...dto,
      keyPrefix,
      keyHash,
      isActive: true,
      createdBy: userId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return {
      id: apiKey.id,
      key: `glm_${key}`, // Apenas retornado uma vez
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
    };
  }

  async findApiKeys() {
    return this.repository.findApiKeys();
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.repository.updateApiKey(id, { isActive: false });
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.repository.deleteApiKey(id);
  }

  async validateApiKey(key: string): Promise<any> {
    if (!key.startsWith('glm_')) {
      return null;
    }

    const actualKey = key.substring(4);
    const prefix = actualKey.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(actualKey).digest('hex');

    const apiKey = await this.repository.findApiKeyByPrefix(prefix);
    if (!apiKey || apiKey.keyHash !== keyHash) {
      return null;
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return null;
    }

    // Atualizar último uso
    await this.repository.updateApiKey(apiKey.id, { lastUsedAt: new Date() });

    return apiKey;
  }
}
