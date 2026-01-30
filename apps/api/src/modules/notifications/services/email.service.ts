import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationsRepository } from '../repositories';
import { EmailConfig, EmailResult } from '../interfaces';
import { firstValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async send(
    to: string,
    subject: string,
    html: string,
    text?: string,
    config?: EmailConfig,
  ): Promise<EmailResult> {
    const emailConfig = config || this.getDefaultConfig();

    try {
      switch (emailConfig.provider) {
        case 'smtp':
          return this.sendViaSMTP(to, subject, html, text, emailConfig);
        case 'sendgrid':
          return this.sendViaSendGrid(to, subject, html, text, emailConfig);
        case 'ses':
          return this.sendViaSES(to, subject, html, text, emailConfig);
        case 'resend':
          return this.sendViaResend(to, subject, html, text, emailConfig);
        default:
          return this.sendViaSMTP(to, subject, html, text, emailConfig);
      }
    } catch (error) {
      this.logger.error(`Falha ao enviar email: ${error.message}`, error.stack);
      return {
        messageId: '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  private getDefaultConfig(): EmailConfig {
    return {
      provider: this.config.get('EMAIL_PROVIDER', 'smtp') as any,
      fromEmail: this.config.get('EMAIL_FROM', 'noreply@glamo.app'),
      fromName: this.config.get('EMAIL_FROM_NAME', 'Glamo'),
      replyTo: this.config.get('EMAIL_REPLY_TO'),
      credentials: {
        host: this.config.get('SMTP_HOST'),
        port: this.config.get('SMTP_PORT', 587),
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
        apiKey: this.config.get('EMAIL_API_KEY'),
      },
    };
  }

  private async sendViaSMTP(
    to: string,
    subject: string,
    html: string,
    text?: string,
    config?: EmailConfig,
  ): Promise<EmailResult> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config?.credentials?.host,
        port: config?.credentials?.port || 587,
        secure: config?.credentials?.port === 465,
        auth: {
          user: config?.credentials?.user,
          pass: config?.credentials?.pass,
        },
      });
    }

    const info = await this.transporter.sendMail({
      from: `"${config?.fromName}" <${config?.fromEmail}>`,
      to,
      subject,
      text: text || this.htmlToText(html),
      html,
      replyTo: config?.replyTo,
    });

    return {
      messageId: info.messageId,
      status: 'sent',
    };
  }

  private async sendViaSendGrid(
    to: string,
    subject: string,
    html: string,
    text?: string,
    config?: EmailConfig,
  ): Promise<EmailResult> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: config?.fromEmail, name: config?.fromName },
          subject,
          content: [
            { type: 'text/plain', value: text || this.htmlToText(html) },
            { type: 'text/html', value: html },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${config?.credentials?.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      messageId: response.headers['x-message-id'] || '',
      status: 'sent',
    };
  }

  private async sendViaSES(
    to: string,
    subject: string,
    html: string,
    text?: string,
    config?: EmailConfig,
  ): Promise<EmailResult> {
    // AWS SES implementation via SDK
    // Simplified - would use @aws-sdk/client-ses
    this.logger.warn('AWS SES implementation pending');
    return {
      messageId: '',
      status: 'failed',
      error: 'AWS SES not implemented',
    };
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    text?: string,
    config?: EmailConfig,
  ): Promise<EmailResult> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.resend.com/emails',
        {
          from: `${config?.fromName} <${config?.fromEmail}>`,
          to: [to],
          subject,
          html,
          text: text || this.htmlToText(html),
        },
        {
          headers: {
            Authorization: `Bearer ${config?.credentials?.apiKey}`,
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

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<script[^>]*>.*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
