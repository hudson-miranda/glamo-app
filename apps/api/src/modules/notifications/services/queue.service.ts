import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NotificationsRepository } from '../repositories';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { TemplateService } from './template.service';
import { NotificationType, NotificationStatus, NotificationPriority, QueueConfig } from '../interfaces';

interface QueuedNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  retryCount: number;
  maxRetries: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  
  private readonly config: QueueConfig = {
    maxConcurrent: 10,
    retryDelay: 60, // segundos
    maxRetries: 3,
    batchSize: 50,
    processInterval: 5000, // 5 segundos
  };

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
  ) {}

  onModuleInit() {
    this.startProcessing();
  }

  onModuleDestroy() {
    this.stopProcessing();
  }

  private startProcessing(): void {
    this.processInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, this.config.processInterval);
    
    this.logger.log('Processamento de fila de notificações iniciado');
  }

  private stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.logger.log('Processamento de fila de notificações parado');
  }

  async enqueue(notificationId: string): Promise<void> {
    // A notificação já está salva, apenas marcar como queued
    await this.repository.updateNotification(notificationId, {
      status: NotificationStatus.QUEUED,
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      const pendingNotifications = await this.repository.findPendingNotifications(
        this.config.batchSize,
      );

      if (pendingNotifications.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.debug(`Processando ${pendingNotifications.length} notificações`);

      // Processar em paralelo com limite de concorrência
      const chunks = this.chunkArray(pendingNotifications, this.config.maxConcurrent);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map((notification: any) => this.processNotification(notification)),
        );
      }
    } catch (error) {
      this.logger.error('Erro ao processar fila:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processNotification(notification: any): Promise<void> {
    try {
      // Marcar como enviando
      await this.repository.updateNotification(notification.id, {
        status: NotificationStatus.SENDING,
      });

      // Enviar baseado no tipo
      let result: { success: boolean; messageId?: string; error?: string };

      switch (notification.type) {
        case NotificationType.EMAIL:
          result = await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          result = await this.sendSms(notification);
          break;
        case NotificationType.PUSH:
          result = await this.sendPush(notification);
          break;
        case NotificationType.IN_APP:
          result = await this.sendInApp(notification);
          break;
        default:
          result = { success: false, error: 'Tipo de notificação não suportado' };
      }

      if (result.success) {
        await this.repository.updateNotification(notification.id, {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });
      } else {
        await this.handleFailure(notification, result.error);
      }
    } catch (error) {
      await this.handleFailure(notification, error.message);
    }
  }

  private async sendEmail(notification: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let content = notification.content;

    // Renderizar template se existir
    if (notification.templateId) {
      const rendered = await this.templateService.render(
        notification.templateId,
        notification.metadata?.templateVariables || {},
      );
      content = rendered.email || content;
    }

    const result = await this.emailService.send(
      notification.recipientEmail,
      content.subject || notification.subject,
      content.html || content.body,
      content.text,
    );

    return {
      success: result.status === 'sent',
      messageId: result.messageId,
      error: result.error,
    };
  }

  private async sendSms(notification: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let content = notification.content;

    if (notification.templateId) {
      const rendered = await this.templateService.render(
        notification.templateId,
        notification.metadata?.templateVariables || {},
      );
      content = rendered.sms || content;
    }

    const result = await this.smsService.send(
      notification.recipientPhone,
      content.text || content.body,
    );

    return {
      success: result.status === 'sent',
      messageId: result.messageId,
      error: result.error,
    };
  }

  private async sendPush(notification: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let content = notification.content;

    if (notification.templateId) {
      const rendered = await this.templateService.render(
        notification.templateId,
        notification.metadata?.templateVariables || {},
      );
      content = rendered.push || content;
    }

    const tokens = notification.recipientDeviceToken
      ? [notification.recipientDeviceToken]
      : await this.getDeviceTokens(notification.recipientId);

    if (tokens.length === 0) {
      return { success: false, error: 'Nenhum dispositivo registrado' };
    }

    const result = await this.pushService.send(tokens, {
      title: content.title,
      body: content.body,
      data: content.data,
      image: content.image,
    });

    return {
      success: result.successCount > 0,
      messageId: result.messageId,
      error: result.errors?.join(', '),
    };
  }

  private async sendInApp(notification: any): Promise<{ success: boolean; error?: string }> {
    // In-app notifications são salvas e recuperadas pelo cliente
    // Nenhuma ação de envio necessária, apenas marcar como enviada
    return { success: true };
  }

  private async getDeviceTokens(userId: string): Promise<string[]> {
    const tokens = await this.repository.findDeviceTokensByUserId(userId);
    return tokens.map((t: any) => t.token);
  }

  private async handleFailure(notification: any, error?: string): Promise<void> {
    const retryCount = (notification.retryCount || 0) + 1;

    if (retryCount >= notification.maxRetries) {
      await this.repository.updateNotification(notification.id, {
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        failureReason: error || 'Número máximo de tentativas atingido',
        retryCount,
      });
    } else {
      // Agendar retry
      const retryDelay = this.config.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      
      await this.repository.updateNotification(notification.id, {
        status: NotificationStatus.PENDING,
        scheduledAt: new Date(Date.now() + retryDelay * 1000),
        failureReason: error,
        retryCount,
      });
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Forçar processamento imediato
  async processNow(): Promise<void> {
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  // Obter status da fila
  async getQueueStatus(): Promise<{
    pending: number;
    queued: number;
    sending: number;
    isProcessing: boolean;
  }> {
    const [pending, queued, sending] = await Promise.all([
      this.repository.findNotifications({ status: NotificationStatus.PENDING } as any),
      this.repository.findNotifications({ status: NotificationStatus.QUEUED } as any),
      this.repository.findNotifications({ status: NotificationStatus.SENDING } as any),
    ]);

    return {
      pending: pending.total,
      queued: queued.total,
      sending: sending.total,
      isProcessing: this.isProcessing,
    };
  }
}
