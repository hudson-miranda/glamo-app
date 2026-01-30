import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationsRepository } from '../repositories';
import { PushConfig, PushResult, NotificationContent } from '../interfaces';
import { firstValueFrom } from 'rxjs';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const serviceAccount = this.config.get('FIREBASE_SERVICE_ACCOUNT');
      if (serviceAccount) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
      }
    } catch (error) {
      this.logger.warn('Firebase não inicializado:', error.message);
    }
  }

  async send(
    tokens: string[],
    content: NotificationContent,
    config?: PushConfig,
  ): Promise<PushResult> {
    const pushConfig = config || this.getDefaultConfig();

    try {
      switch (pushConfig.provider) {
        case 'firebase':
          return this.sendViaFirebase(tokens, content);
        case 'onesignal':
          return this.sendViaOneSignal(tokens, content, pushConfig);
        case 'expo':
          return this.sendViaExpo(tokens, content);
        default:
          return this.sendViaFirebase(tokens, content);
      }
    } catch (error) {
      this.logger.error(`Falha ao enviar push: ${error.message}`, error.stack);
      return {
        messageId: '',
        successCount: 0,
        failureCount: tokens.length,
        errors: [error.message],
      };
    }
  }

  async sendToUser(
    userId: string,
    content: NotificationContent,
    config?: PushConfig,
  ): Promise<PushResult> {
    const tokens = await this.repository.findDeviceTokensByUserId(userId);
    if (tokens.length === 0) {
      return {
        messageId: '',
        successCount: 0,
        failureCount: 0,
        errors: ['Nenhum dispositivo registrado'],
      };
    }

    return this.send(
      tokens.map((t: any) => t.token),
      content,
      config,
    );
  }

  private getDefaultConfig(): PushConfig {
    return {
      provider: this.config.get('PUSH_PROVIDER', 'firebase') as any,
      credentials: {},
    };
  }

  private async sendViaFirebase(
    tokens: string[],
    content: NotificationContent,
  ): Promise<PushResult> {
    if (!this.firebaseApp) {
      throw new Error('Firebase não configurado');
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: content.title,
        body: content.body,
        imageUrl: content.image,
      },
      data: content.data ? this.stringifyData(content.data) : undefined,
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const errors: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        errors.push(`Token ${idx}: ${resp.error.message}`);
      }
    });

    return {
      messageId: response.responses[0]?.messageId || '',
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async sendViaOneSignal(
    tokens: string[],
    content: NotificationContent,
    config: PushConfig,
  ): Promise<PushResult> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: config.credentials.appId,
          include_player_ids: tokens,
          headings: { en: content.title },
          contents: { en: content.body },
          big_picture: content.image,
          data: content.data,
        },
        {
          headers: {
            Authorization: `Basic ${config.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      messageId: response.data.id,
      successCount: response.data.recipients || 0,
      failureCount: tokens.length - (response.data.recipients || 0),
    };
  }

  private async sendViaExpo(
    tokens: string[],
    content: NotificationContent,
  ): Promise<PushResult> {
    const messages = tokens.map((token) => ({
      to: token,
      title: content.title,
      body: content.body,
      data: content.data,
      sound: 'default',
    }));

    const response = await firstValueFrom(
      this.httpService.post(
        'https://exp.host/--/api/v2/push/send',
        messages,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const results = response.data.data || [];
    const successCount = results.filter((r: any) => r.status === 'ok').length;

    return {
      messageId: results[0]?.id || '',
      successCount,
      failureCount: tokens.length - successCount,
    };
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }
}
