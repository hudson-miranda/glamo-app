import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IntegrationsRepository } from '../repositories';
import { WebhookEventType, WebhookStatus, WebhookDelivery } from '../interfaces';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { addSeconds } from 'date-fns';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async triggerWebhook(event: WebhookEventType, payload: any): Promise<void> {
    const webhooks = await this.repository.findWebhooksByEvent(event);

    for (const webhook of webhooks) {
      const delivery = await this.repository.createWebhookDelivery({
        webhookId: webhook.id,
        event,
        payload,
        status: WebhookStatus.PENDING,
        attempts: 0,
      });

      await this.deliverWebhook(delivery.id);
    }
  }

  async deliverWebhook(deliveryId: string): Promise<void> {
    const delivery = await this.repository.findWebhookDeliveryById(deliveryId);
    if (!delivery) return;

    const webhook = await this.repository.findWebhookById(delivery.webhookId);
    if (!webhook) return;

    try {
      const body = JSON.stringify({
        event: delivery.event,
        timestamp: new Date().toISOString(),
        data: delivery.payload,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.headers,
      };

      // Adicionar assinatura se secret configurado
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await firstValueFrom(
        this.httpService.post(webhook.url, body, {
          headers,
          timeout: 30000,
        }),
      );

      await this.repository.updateWebhookDelivery(deliveryId, {
        status: WebhookStatus.SENT,
        httpStatus: response.status,
        response: JSON.stringify(response.data).substring(0, 1000),
        attempts: delivery.attempts + 1,
        completedAt: new Date(),
      });

      await this.repository.updateWebhook(webhook.id, {
        lastTriggeredAt: new Date(),
        successCount: webhook.successCount + 1,
      });
    } catch (error: any) {
      this.logger.error(`Webhook delivery failed: ${error.message}`);

      const retryPolicy = webhook.retryPolicy || { maxRetries: 3, retryInterval: 60, exponentialBackoff: true };
      const shouldRetry = delivery.attempts < retryPolicy.maxRetries;

      let nextRetryAt: Date | undefined;
      if (shouldRetry) {
        const delay = retryPolicy.exponentialBackoff
          ? retryPolicy.retryInterval * Math.pow(2, delivery.attempts)
          : retryPolicy.retryInterval;
        nextRetryAt = addSeconds(new Date(), delay);
      }

      await this.repository.updateWebhookDelivery(deliveryId, {
        status: shouldRetry ? WebhookStatus.RETRYING : WebhookStatus.FAILED,
        httpStatus: error.response?.status,
        response: error.response?.data ? JSON.stringify(error.response.data).substring(0, 1000) : error.message,
        attempts: delivery.attempts + 1,
        nextRetryAt,
        completedAt: shouldRetry ? undefined : new Date(),
      });

      if (!shouldRetry) {
        await this.repository.updateWebhook(webhook.id, {
          failureCount: webhook.failureCount + 1,
        });
      }
    }
  }

  async retryFailedDeliveries(): Promise<number> {
    const pending = await this.repository.findPendingDeliveries(100);
    
    for (const delivery of pending) {
      await this.deliverWebhook(delivery.id);
    }

    return pending.length;
  }

  // ========================
  // EVENT LISTENERS
  // ========================

  @OnEvent('appointment.created')
  async onAppointmentCreated(data: any) {
    await this.triggerWebhook(WebhookEventType.APPOINTMENT_CREATED, data);
  }

  @OnEvent('appointment.updated')
  async onAppointmentUpdated(data: any) {
    await this.triggerWebhook(WebhookEventType.APPOINTMENT_UPDATED, data);
  }

  @OnEvent('appointment.cancelled')
  async onAppointmentCancelled(data: any) {
    await this.triggerWebhook(WebhookEventType.APPOINTMENT_CANCELLED, data);
  }

  @OnEvent('appointment.completed')
  async onAppointmentCompleted(data: any) {
    await this.triggerWebhook(WebhookEventType.APPOINTMENT_COMPLETED, data);
  }

  @OnEvent('customer.created')
  async onCustomerCreated(data: any) {
    await this.triggerWebhook(WebhookEventType.CUSTOMER_CREATED, data);
  }

  @OnEvent('payment.completed')
  async onPaymentCompleted(data: any) {
    await this.triggerWebhook(WebhookEventType.PAYMENT_COMPLETED, data);
  }
}
