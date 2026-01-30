import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationsRepository } from '../repositories';
import { CreatePaymentIntentDto, GeneratePixDto } from '../dto';
import { PaymentProvider } from '../interfaces';

interface PaymentGatewayAdapter {
  createPaymentIntent(data: CreatePaymentIntentDto): Promise<any>;
  generatePix(data: GeneratePixDto): Promise<any>;
  handleWebhook(payload: any, signature?: string): Promise<any>;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private adapters: Map<PaymentProvider, PaymentGatewayAdapter> = new Map();

  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentIntent(integrationId: string, dto: CreatePaymentIntentDto): Promise<any> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const config = integration.config as any;
    const provider = config.provider as PaymentProvider;

    // Registrar intent
    const intent = await this.repository.createPaymentIntent({
      integrationId,
      amount: dto.amount,
      currency: dto.currency || 'BRL',
      status: 'pending',
      customerId: dto.customerId,
      appointmentId: dto.appointmentId,
      metadata: dto.metadata,
    });

    try {
      let externalId: string;

      switch (provider) {
        case PaymentProvider.STRIPE:
          externalId = await this.createStripePaymentIntent(integration, dto, intent.id);
          break;
        case PaymentProvider.MERCADO_PAGO:
          externalId = await this.createMercadoPagoPayment(integration, dto, intent.id);
          break;
        case PaymentProvider.ASAAS:
          externalId = await this.createAsaasPayment(integration, dto, intent.id);
          break;
        default:
          throw new Error(`Provedor ${provider} não suportado`);
      }

      await this.repository.updatePaymentIntent(intent.id, {
        externalId,
        status: 'processing',
      });

      return { intentId: intent.id, externalId };
    } catch (error: any) {
      await this.repository.updatePaymentIntent(intent.id, {
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }

  async generatePix(integrationId: string, dto: GeneratePixDto): Promise<any> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const config = integration.config as any;
    const provider = config.provider as PaymentProvider;

    // Implementação específica por provedor
    switch (provider) {
      case PaymentProvider.MERCADO_PAGO:
        return this.generateMercadoPagoPix(integration, dto);
      case PaymentProvider.ASAAS:
        return this.generateAsaasPix(integration, dto);
      default:
        throw new Error(`PIX não suportado para ${provider}`);
    }
  }

  async handleWebhook(integrationId: string, payload: any, signature?: string): Promise<void> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const config = integration.config as any;
    const provider = config.provider as PaymentProvider;

    // Processar webhook conforme provedor
    switch (provider) {
      case PaymentProvider.STRIPE:
        await this.handleStripeWebhook(integration, payload, signature);
        break;
      case PaymentProvider.MERCADO_PAGO:
        await this.handleMercadoPagoWebhook(integration, payload);
        break;
      case PaymentProvider.ASAAS:
        await this.handleAsaasWebhook(integration, payload);
        break;
    }
  }

  // ========================
  // STRIPE
  // ========================

  private async createStripePaymentIntent(
    integration: any,
    dto: CreatePaymentIntentDto,
    internalId: string,
  ): Promise<string> {
    // Implementação Stripe
    this.logger.log('Creating Stripe payment intent');
    // Aqui seria a integração real com Stripe
    return `pi_${Date.now()}`;
  }

  private async handleStripeWebhook(integration: any, payload: any, signature?: string): Promise<void> {
    // Verificar assinatura
    // Processar evento
    const event = payload;
    const type = event.type;
    const data = event.data.object;

    if (type === 'payment_intent.succeeded') {
      const intent = await this.repository.findPaymentIntentByExternalId(data.id);
      if (intent) {
        await this.repository.updatePaymentIntent(intent.id, { status: 'succeeded' });
      }
    } else if (type === 'payment_intent.payment_failed') {
      const intent = await this.repository.findPaymentIntentByExternalId(data.id);
      if (intent) {
        await this.repository.updatePaymentIntent(intent.id, {
          status: 'failed',
          error: data.last_payment_error?.message,
        });
      }
    }
  }

  // ========================
  // MERCADO PAGO
  // ========================

  private async createMercadoPagoPayment(
    integration: any,
    dto: CreatePaymentIntentDto,
    internalId: string,
  ): Promise<string> {
    this.logger.log('Creating Mercado Pago payment');
    return `mp_${Date.now()}`;
  }

  private async generateMercadoPagoPix(integration: any, dto: GeneratePixDto): Promise<any> {
    this.logger.log('Generating Mercado Pago PIX');
    return {
      qrCode: 'data:image/png;base64,...',
      qrCodeBase64: '...',
      copyPaste: '00020126580014br.gov.bcb.pix...',
      expiresAt: new Date(Date.now() + (dto.expirationMinutes || 30) * 60 * 1000),
    };
  }

  private async handleMercadoPagoWebhook(integration: any, payload: any): Promise<void> {
    const { action, data } = payload;

    if (action === 'payment.updated') {
      // Buscar detalhes do pagamento e atualizar
      this.logger.log(`Mercado Pago payment updated: ${data.id}`);
    }
  }

  // ========================
  // ASAAS
  // ========================

  private async createAsaasPayment(
    integration: any,
    dto: CreatePaymentIntentDto,
    internalId: string,
  ): Promise<string> {
    this.logger.log('Creating Asaas payment');
    return `asaas_${Date.now()}`;
  }

  private async generateAsaasPix(integration: any, dto: GeneratePixDto): Promise<any> {
    this.logger.log('Generating Asaas PIX');
    return {
      qrCode: 'data:image/png;base64,...',
      copyPaste: '00020126580014br.gov.bcb.pix...',
      expiresAt: new Date(Date.now() + (dto.expirationMinutes || 30) * 60 * 1000),
    };
  }

  private async handleAsaasWebhook(integration: any, payload: any): Promise<void> {
    const { event, payment } = payload;

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const intent = await this.repository.findPaymentIntentByExternalId(payment.id);
      if (intent) {
        await this.repository.updatePaymentIntent(intent.id, { status: 'succeeded' });
      }
    }
  }
}
