import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsRepository } from './repositories';
import {
  EmailService,
  SmsService,
  PushService,
  TemplateService,
  QueueService,
} from './services';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  UpdatePreferencesDto,
  RegisterDeviceDto,
  NotificationQueryDto,
  TemplateQueryDto,
  BulkNotificationQueryDto,
  StatsQueryDto,
} from './dto';
import {
  NotificationStatus,
  NotificationPriority,
  NotificationCategory,
} from './interfaces';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
    private readonly queueService: QueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // SEND NOTIFICATIONS
  // ========================

  async send(dto: SendNotificationDto): Promise<any> {
    const notification = await this.repository.createNotification({
      type: dto.type,
      category: dto.category || NotificationCategory.SYSTEM,
      priority: dto.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      templateId: dto.templateId,
      recipientId: dto.recipientId,
      recipientType: dto.recipientType,
      recipientEmail: dto.recipientEmail,
      recipientPhone: dto.recipientPhone,
      recipientDeviceToken: dto.recipientDeviceToken,
      subject: dto.subject,
      content: dto.content || {},
      metadata: {
        ...dto.metadata,
        templateVariables: dto.templateVariables,
      },
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      retryCount: 0,
      maxRetries: 3,
    });

    // Se não for agendada, adicionar à fila imediatamente
    if (!dto.scheduledAt) {
      await this.queueService.enqueue(notification.id);
    }

    return notification;
  }

  async sendImmediate(dto: SendNotificationDto): Promise<any> {
    const notification = await this.send(dto);
    await this.queueService.processNow();
    return this.repository.findNotificationById(notification.id);
  }

  async sendBulk(dto: SendBulkNotificationDto, userId: string): Promise<any> {
    // Criar registro de bulk notification
    const bulk = await this.repository.createBulkNotification({
      name: dto.name || `Envio em massa - ${new Date().toISOString()}`,
      templateId: dto.templateId,
      recipientFilter: {
        type: dto.recipientFilterType,
        recipientType: dto.recipientType,
        segmentId: dto.segmentId,
        customIds: dto.customIds,
        filters: dto.filters,
      },
      totalRecipients: 0, // Será atualizado
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      createdBy: userId,
    });

    // Processar recipients em background
    this.processBulkNotification(bulk.id, dto);

    return bulk;
  }

  private async processBulkNotification(
    bulkId: string,
    dto: SendBulkNotificationDto,
  ): Promise<void> {
    try {
      // Buscar recipients baseado no filtro
      const recipients = await this.getRecipientsForBulk(dto);

      await this.repository.updateBulkNotification(bulkId, {
        totalRecipients: recipients.length,
        status: dto.scheduledAt ? 'scheduled' : 'sending',
        startedAt: dto.scheduledAt ? null : new Date(),
      });

      // Criar notificações individuais
      for (const recipient of recipients) {
        await this.send({
          type: 'email' as any, // Determinado pelo template
          templateId: dto.templateId,
          recipientId: recipient.id,
          recipientType: dto.recipientType,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          templateVariables: {
            ...dto.templateVariables,
            recipientName: recipient.name,
          },
          scheduledAt: dto.scheduledAt,
          metadata: { bulkId },
        });
      }

      if (!dto.scheduledAt) {
        await this.repository.updateBulkNotification(bulkId, {
          status: 'completed',
          completedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao processar bulk ${bulkId}:`, error.message);
      await this.repository.updateBulkNotification(bulkId, {
        status: 'cancelled',
      });
    }
  }

  private async getRecipientsForBulk(dto: SendBulkNotificationDto): Promise<any[]> {
    // Implementar busca de recipients baseado no filtro
    // Isso dependeria de outros módulos (customers, professionals)
    if (dto.customIds && dto.customIds.length > 0) {
      return dto.customIds.map((id) => ({ id }));
    }
    return [];
  }

  // ========================
  // NOTIFICATIONS CRUD
  // ========================

  async findNotifications(query: NotificationQueryDto) {
    return this.repository.findNotifications(query);
  }

  async findNotificationById(id: string): Promise<any> {
    const notification = await this.repository.findNotificationById(id);
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    return notification;
  }

  async cancelNotification(id: string): Promise<any> {
    const notification = await this.findNotificationById(id);
    if (notification.status !== NotificationStatus.PENDING) {
      throw new Error('Apenas notificações pendentes podem ser canceladas');
    }
    return this.repository.updateNotification(id, {
      status: NotificationStatus.CANCELLED,
    });
  }

  async resendNotification(id: string): Promise<any> {
    const notification = await this.findNotificationById(id);
    if (notification.status !== NotificationStatus.FAILED) {
      throw new Error('Apenas notificações com falha podem ser reenviadas');
    }
    return this.repository.updateNotification(id, {
      status: NotificationStatus.PENDING,
      retryCount: 0,
      scheduledAt: null,
    });
  }

  // ========================
  // TEMPLATES
  // ========================

  async createTemplate(dto: CreateTemplateDto): Promise<any> {
    return this.repository.createTemplate({
      ...dto,
      isActive: true,
    });
  }

  async findTemplates(query: TemplateQueryDto) {
    return this.repository.findTemplates(query);
  }

  async findTemplateById(id: string): Promise<any> {
    const template = await this.repository.findTemplateById(id);
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }
    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<any> {
    await this.findTemplateById(id);
    return this.repository.updateTemplate(id, dto);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.findTemplateById(id);
    await this.repository.deleteTemplate(id);
  }

  async previewTemplate(
    id: string,
    variables: Record<string, any>,
  ): Promise<any> {
    return this.templateService.render(id, variables);
  }

  // ========================
  // PREFERENCES
  // ========================

  async getPreferences(
    recipientId: string,
    recipientType: 'customer' | 'professional' | 'user',
  ): Promise<any> {
    let preferences = await this.repository.findPreferences(recipientId, recipientType);
    
    if (!preferences) {
      // Retornar preferências padrão
      preferences = this.getDefaultPreferences();
    }
    
    return preferences;
  }

  async updatePreferences(
    recipientId: string,
    recipientType: 'customer' | 'professional' | 'user',
    dto: UpdatePreferencesDto,
  ): Promise<any> {
    return this.repository.upsertPreferences(recipientId, recipientType, dto);
  }

  private getDefaultPreferences(): any {
    return {
      channels: [
        { channel: 'email', enabled: true },
        { channel: 'sms', enabled: true },
        { channel: 'push', enabled: true },
        { channel: 'whatsapp', enabled: true },
        { channel: 'in_app', enabled: true },
      ],
      categories: [
        { category: 'appointment', enabled: true },
        { category: 'payment', enabled: true },
        { category: 'marketing', enabled: true },
        { category: 'system', enabled: true },
        { category: 'reminder', enabled: true },
      ],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'America/Sao_Paulo',
        exceptUrgent: true,
      },
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    };
  }

  // ========================
  // DEVICE TOKENS
  // ========================

  async registerDevice(
    userId: string,
    userType: 'customer' | 'professional' | 'user',
    dto: RegisterDeviceDto,
  ): Promise<any> {
    // Verificar se já existe
    const existing = await this.repository.findDeviceTokenByToken(dto.token);
    
    if (existing) {
      return this.repository.updateDeviceToken(existing.id, {
        isActive: true,
        lastUsedAt: new Date(),
        deviceInfo: {
          model: dto.model,
          os: dto.os,
          osVersion: dto.osVersion,
          appVersion: dto.appVersion,
        },
      });
    }

    return this.repository.createDeviceToken({
      userId,
      userType,
      token: dto.token,
      platform: dto.platform,
      deviceInfo: {
        model: dto.model,
        os: dto.os,
        osVersion: dto.osVersion,
        appVersion: dto.appVersion,
      },
    });
  }

  async unregisterDevice(token: string): Promise<void> {
    await this.repository.deactivateDeviceToken(token);
  }

  // ========================
  // BULK NOTIFICATIONS
  // ========================

  async findBulkNotifications(query: BulkNotificationQueryDto) {
    return this.repository.findBulkNotifications(query);
  }

  async findBulkNotificationById(id: string): Promise<any> {
    const bulk = await this.repository.findBulkNotificationById(id);
    if (!bulk) {
      throw new NotFoundException('Envio em massa não encontrado');
    }
    return bulk;
  }

  async cancelBulkNotification(id: string): Promise<any> {
    const bulk = await this.findBulkNotificationById(id);
    if (!['draft', 'scheduled'].includes(bulk.status)) {
      throw new Error('Apenas envios pendentes podem ser cancelados');
    }
    return this.repository.updateBulkNotification(id, {
      status: 'cancelled',
    });
  }

  // ========================
  // STATISTICS
  // ========================

  async getStats(query: StatsQueryDto): Promise<any> {
    return this.repository.getNotificationStats(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  async getQueueStatus(): Promise<any> {
    return this.queueService.getQueueStatus();
  }

  // ========================
  // EVENT HANDLERS
  // ========================

  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: any): Promise<void> {
    await this.sendNotificationByTemplate('appointment_confirmation', {
      recipientId: payload.customerId,
      recipientType: 'customer',
      variables: {
        customerName: payload.customerName,
        serviceName: payload.serviceName,
        appointmentDate: payload.date,
        appointmentTime: payload.time,
        professionalName: payload.professionalName,
      },
    });
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: any): Promise<void> {
    await this.sendNotificationByTemplate('appointment_cancelled', {
      recipientId: payload.customerId,
      recipientType: 'customer',
      variables: {
        customerName: payload.customerName,
        serviceName: payload.serviceName,
        appointmentDate: payload.date,
        reason: payload.reason,
      },
    });
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: any): Promise<void> {
    await this.sendNotificationByTemplate('payment_received', {
      recipientId: payload.customerId,
      recipientType: 'customer',
      variables: {
        customerName: payload.customerName,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
      },
    });
  }

  private async sendNotificationByTemplate(
    templateCode: string,
    options: {
      recipientId: string;
      recipientType: 'customer' | 'professional' | 'user';
      variables: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const template = await this.repository.findTemplateByCode(templateCode);
      if (!template || !template.isActive) {
        this.logger.warn(`Template ${templateCode} não encontrado ou inativo`);
        return;
      }

      // Verificar preferências do recipient
      const preferences = await this.getPreferences(
        options.recipientId,
        options.recipientType,
      );

      // Enviar por cada canal habilitado no template e nas preferências
      for (const channel of template.channels) {
        const channelPref = preferences.channels?.find(
          (c: any) => c.channel === channel,
        );
        
        if (channelPref?.enabled !== false) {
          await this.send({
            type: channel,
            templateId: template.id,
            recipientId: options.recipientId,
            recipientType: options.recipientType,
            templateVariables: options.variables,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar notificação ${templateCode}:`, error.message);
    }
  }
}
