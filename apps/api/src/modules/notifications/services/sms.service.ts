import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationsRepository } from '../repositories';
import { SmsConfig, SmsResult } from '../interfaces';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async send(
    to: string,
    message: string,
    config?: SmsConfig,
  ): Promise<SmsResult> {
    const smsConfig = config || this.getDefaultConfig();

    try {
      switch (smsConfig.provider) {
        case 'twilio':
          return this.sendViaTwilio(to, message, smsConfig);
        case 'zenvia':
          return this.sendViaZenvia(to, message, smsConfig);
        case 'totalvoice':
          return this.sendViaTotalVoice(to, message, smsConfig);
        default:
          return this.sendViaTwilio(to, message, smsConfig);
      }
    } catch (error) {
      this.logger.error(`Falha ao enviar SMS: ${error.message}`, error.stack);
      return {
        messageId: '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  private getDefaultConfig(): SmsConfig {
    return {
      provider: this.config.get('SMS_PROVIDER', 'twilio') as any,
      fromNumber: this.config.get('SMS_FROM_NUMBER', ''),
      credentials: {
        accountSid: this.config.get('TWILIO_ACCOUNT_SID'),
        authToken: this.config.get('TWILIO_AUTH_TOKEN'),
        apiKey: this.config.get('SMS_API_KEY'),
      },
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do Brasil se não tiver
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }
    
    return '+' + cleaned;
  }

  private async sendViaTwilio(
    to: string,
    message: string,
    config: SmsConfig,
  ): Promise<SmsResult> {
    const { accountSid, authToken } = config.credentials;
    const from = config.fromNumber;
    const toFormatted = this.formatPhoneNumber(to);

    const response = await firstValueFrom(
      this.httpService.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: toFormatted,
          From: from,
          Body: message,
        }).toString(),
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return {
      messageId: response.data.sid,
      status: 'sent',
      segments: response.data.num_segments,
    };
  }

  private async sendViaZenvia(
    to: string,
    message: string,
    config: SmsConfig,
  ): Promise<SmsResult> {
    const toFormatted = this.formatPhoneNumber(to);

    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.zenvia.com/v2/channels/sms/messages',
        {
          from: config.fromNumber,
          to: toFormatted,
          contents: [
            {
              type: 'text',
              text: message,
            },
          ],
        },
        {
          headers: {
            'X-API-TOKEN': config.credentials.apiKey,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      messageId: response.data.id,
      status: 'sent',
    };
  }

  private async sendViaTotalVoice(
    to: string,
    message: string,
    config: SmsConfig,
  ): Promise<SmsResult> {
    const toFormatted = to.replace(/\D/g, '');

    const response = await firstValueFrom(
      this.httpService.post(
        'https://voice-api.zenvia.com/sms',
        {
          numero_destino: toFormatted,
          mensagem: message,
        },
        {
          headers: {
            'Access-Token': config.credentials.apiKey,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      messageId: response.data.dados?.id?.toString() || '',
      status: response.data.sucesso ? 'sent' : 'failed',
      error: response.data.mensagem,
    };
  }

  calculateSegments(message: string): number {
    const length = message.length;
    const isUnicode = /[^\x00-\x7F]/.test(message);
    
    if (isUnicode) {
      return length <= 70 ? 1 : Math.ceil(length / 67);
    }
    
    return length <= 160 ? 1 : Math.ceil(length / 153);
  }
}
