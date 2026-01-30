import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IntegrationsRepository } from '../repositories';
import { SendWhatsAppMessageDto } from '../dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendMessage(integrationId: string, dto: SendWhatsAppMessageDto): Promise<any> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const config = integration.config as any;
    const accessToken = integration.credentials?.accessToken;

    if (!accessToken) {
      throw new Error('Token de acesso não configurado');
    }

    const url = `${this.graphApiUrl}/${config.phoneNumberId}/messages`;

    let body: any = {
      messaging_product: 'whatsapp',
      to: dto.to,
    };

    if (dto.type === 'text') {
      body.type = 'text';
      body.text = { body: dto.text };
    } else if (dto.type === 'template') {
      body.type = 'template';
      body.template = {
        name: dto.templateName,
        language: { code: 'pt_BR' },
        components: dto.templateParams?.map((params, i) => ({
          type: i === 0 ? 'header' : 'body',
          parameters: Object.entries(params).map(([key, value]) => ({
            type: 'text',
            text: value,
          })),
        })),
      };
    } else if (dto.type === 'image' || dto.type === 'document') {
      body.type = dto.type;
      body[dto.type] = {
        link: dto.mediaUrl,
        caption: dto.caption,
      };
    }

    // Registrar mensagem como pendente
    const message = await this.repository.createWhatsAppMessage({
      integrationId,
      to: dto.to,
      from: config.phoneNumberId,
      type: dto.type,
      content: { text: dto.text, templateName: dto.templateName },
      status: 'pending',
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      // Atualizar com ID externo
      await this.repository.updateWhatsAppMessage(message.id, {
        externalId: response.data.messages?.[0]?.id,
        status: 'sent',
        sentAt: new Date(),
      });

      return { success: true, messageId: message.id, externalId: response.data.messages?.[0]?.id };
    } catch (error: any) {
      this.logger.error(`Erro ao enviar WhatsApp: ${error.message}`);

      await this.repository.updateWhatsAppMessage(message.id, {
        status: 'failed',
        error: error.response?.data?.error?.message || error.message,
      });

      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.statuses) {
      // Status update
      for (const status of value.statuses) {
        const message = await this.repository.findWhatsAppMessageById(status.id);
        if (message) {
          const updateData: any = { status: status.status };
          if (status.status === 'delivered') updateData.deliveredAt = new Date();
          if (status.status === 'read') updateData.readAt = new Date();
          await this.repository.updateWhatsAppMessage(message.id, updateData);
        }
      }
    }

    if (value?.messages) {
      // Incoming message
      for (const msg of value.messages) {
        this.logger.log(`Mensagem recebida de ${msg.from}: ${JSON.stringify(msg)}`);
        // Processar mensagem recebida
      }
    }
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    // Buscar integração ativa
    const integration = await this.repository.findIntegrationByType('WHATSAPP');
    if (!integration) return null;

    const config = integration.config as any;
    if (mode === 'subscribe' && token === config.verifyToken) {
      return challenge;
    }

    return null;
  }
}
