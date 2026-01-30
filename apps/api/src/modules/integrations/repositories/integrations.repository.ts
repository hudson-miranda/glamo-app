import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  IntegrationQueryDto,
  WebhookQueryDto,
  WebhookDeliveryQueryDto,
  WhatsAppMessageQueryDto,
  SyncLogQueryDto,
} from '../dto';
import { IntegrationStatus, WebhookStatus } from '../interfaces';

@Injectable()
export class IntegrationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // INTEGRATIONS
  // ========================

  async createIntegration(data: any) {
    return this.prisma.integration.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findIntegrationById(id: string) {
    return this.prisma.integration.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findIntegrationByType(type: string, provider?: string) {
    const where: any = { tenantId: this.tenantId, type };
    if (provider) where.provider = provider;
    return this.prisma.integration.findFirst({ where });
  }

  async findIntegrations(query: IntegrationQueryDto) {
    const { type, status, provider, search } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (provider) where.provider = provider;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    return this.prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIntegration(id: string, data: any) {
    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  async deleteIntegration(id: string) {
    return this.prisma.integration.delete({ where: { id } });
  }

  // ========================
  // WEBHOOKS
  // ========================

  async createWebhook(data: any) {
    return this.prisma.webhook.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findWebhookById(id: string) {
    return this.prisma.webhook.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findWebhooks(query: WebhookQueryDto) {
    const { event, isActive } = query;

    const where: any = { tenantId: this.tenantId };

    if (event) where.events = { has: event };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return this.prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWebhooksByEvent(event: string) {
    return this.prisma.webhook.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        events: { has: event },
      },
    });
  }

  async updateWebhook(id: string, data: any) {
    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async deleteWebhook(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }

  // ========================
  // WEBHOOK DELIVERIES
  // ========================

  async createWebhookDelivery(data: any) {
    return this.prisma.webhookDelivery.create({ data });
  }

  async findWebhookDeliveryById(id: string) {
    return this.prisma.webhookDelivery.findUnique({ where: { id } });
  }

  async findWebhookDeliveries(query: WebhookDeliveryQueryDto) {
    const { webhookId, status, event, page = 1, limit = 50 } = query;

    const where: any = {};

    if (webhookId) where.webhookId = webhookId;
    if (status) where.status = status;
    if (event) where.event = event;

    const [data, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPendingDeliveries(limit = 100) {
    return this.prisma.webhookDelivery.findMany({
      where: {
        status: { in: [WebhookStatus.PENDING, WebhookStatus.RETRYING] },
        nextRetryAt: { lte: new Date() },
      },
      take: limit,
    });
  }

  async updateWebhookDelivery(id: string, data: any) {
    return this.prisma.webhookDelivery.update({
      where: { id },
      data,
    });
  }

  // ========================
  // WHATSAPP MESSAGES
  // ========================

  async createWhatsAppMessage(data: any) {
    return this.prisma.whatsAppMessage.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findWhatsAppMessageById(id: string) {
    return this.prisma.whatsAppMessage.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findWhatsAppMessages(query: WhatsAppMessageQueryDto) {
    const { to, status, startDate, endDate, page = 1, limit = 50 } = query;

    const where: any = { tenantId: this.tenantId };

    if (to) where.to = to;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateWhatsAppMessage(id: string, data: any) {
    return this.prisma.whatsAppMessage.update({
      where: { id },
      data,
    });
  }

  // ========================
  // PAYMENT INTENTS
  // ========================

  async createPaymentIntent(data: any) {
    return this.prisma.paymentIntent.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findPaymentIntentById(id: string) {
    return this.prisma.paymentIntent.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findPaymentIntentByExternalId(externalId: string) {
    return this.prisma.paymentIntent.findFirst({
      where: { externalId, tenantId: this.tenantId },
    });
  }

  async updatePaymentIntent(id: string, data: any) {
    return this.prisma.paymentIntent.update({
      where: { id },
      data,
    });
  }

  // ========================
  // CALENDAR EVENTS
  // ========================

  async createCalendarEvent(data: any) {
    return this.prisma.calendarEvent.create({ data });
  }

  async findCalendarEventById(id: string) {
    return this.prisma.calendarEvent.findUnique({ where: { id } });
  }

  async findCalendarEventByExternalId(externalId: string) {
    return this.prisma.calendarEvent.findFirst({ where: { externalId } });
  }

  async findCalendarEventByAppointmentId(appointmentId: string) {
    return this.prisma.calendarEvent.findFirst({ where: { appointmentId } });
  }

  async updateCalendarEvent(id: string, data: any) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data,
    });
  }

  async deleteCalendarEvent(id: string) {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ========================
  // SYNC LOGS
  // ========================

  async createSyncLog(data: any) {
    return this.prisma.syncLog.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findSyncLogs(query: SyncLogQueryDto) {
    const { integrationId, type, status, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (integrationId) where.integrationId = integrationId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.syncLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.syncLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateSyncLog(id: string, data: any) {
    return this.prisma.syncLog.update({
      where: { id },
      data,
    });
  }

  // ========================
  // API KEYS
  // ========================

  async createApiKey(data: any) {
    return this.prisma.apiKey.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findApiKeyById(id: string) {
    return this.prisma.apiKey.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findApiKeyByPrefix(prefix: string) {
    return this.prisma.apiKey.findFirst({
      where: { keyPrefix: prefix, isActive: true },
    });
  }

  async findApiKeys() {
    return this.prisma.apiKey.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateApiKey(id: string, data: any) {
    return this.prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  async deleteApiKey(id: string) {
    return this.prisma.apiKey.delete({ where: { id } });
  }

  // ========================
  // OAUTH STATE
  // ========================

  async createOAuthState(data: any) {
    return this.prisma.oAuthState.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findOAuthState(state: string) {
    return this.prisma.oAuthState.findFirst({
      where: {
        state,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async deleteOAuthState(id: string) {
    return this.prisma.oAuthState.delete({ where: { id } });
  }
}
