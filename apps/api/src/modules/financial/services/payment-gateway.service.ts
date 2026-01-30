import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentMethod,
  PaymentStatus,
  CardDetails,
  PixDetails,
  PaymentGatewayData,
} from '../interfaces';

export interface PaymentGatewayResult {
  success: boolean;
  transactionId?: string;
  authorizationCode?: string;
  status: PaymentStatus;
  gatewayData: PaymentGatewayData;
  pixDetails?: PixDetails;
  error?: {
    code: string;
    message: string;
  };
}

export interface CardPaymentRequest {
  amount: number;
  cardToken: string;
  installments?: number;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PixPaymentRequest {
  amount: number;
  expirationMinutes?: number;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get('PAYMENT_GATEWAY_PROVIDER', 'stripe');
  }

  // ========================
  // CARD PAYMENTS
  // ========================

  async processCardPayment(request: CardPaymentRequest): Promise<PaymentGatewayResult> {
    this.logger.log(`Processing card payment: ${request.amount}`);

    try {
      // Aqui seria a integração real com o gateway (Stripe, PagSeguro, etc.)
      // Simulando resposta de sucesso
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const authorizationCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      return {
        success: true,
        transactionId,
        authorizationCode,
        status: PaymentStatus.COMPLETED,
        gatewayData: {
          provider: this.provider,
          transactionId,
          authorizationCode,
          rawResponse: {
            status: 'approved',
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Card payment failed: ${error.message}`);
      return {
        success: false,
        status: PaymentStatus.FAILED,
        gatewayData: {
          provider: this.provider,
          transactionId: '',
        },
        error: {
          code: 'PAYMENT_FAILED',
          message: error.message,
        },
      };
    }
  }

  async refundCardPayment(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(`Processing refund for: ${transactionId}`);

    try {
      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transactionId: refundId,
        status: PaymentStatus.REFUNDED,
        gatewayData: {
          provider: this.provider,
          transactionId: refundId,
          rawResponse: {
            originalTransaction: transactionId,
            refundAmount: amount,
            status: 'refunded',
          },
        },
      };
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`);
      return {
        success: false,
        status: PaymentStatus.FAILED,
        gatewayData: {
          provider: this.provider,
          transactionId: '',
        },
        error: {
          code: 'REFUND_FAILED',
          message: error.message,
        },
      };
    }
  }

  // ========================
  // PIX PAYMENTS
  // ========================

  async generatePixPayment(request: PixPaymentRequest): Promise<PaymentGatewayResult> {
    this.logger.log(`Generating PIX payment: ${request.amount}`);

    try {
      const txId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expirationMinutes = request.expirationMinutes || 30;
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

      // Simulando geração de QR Code PIX
      const qrCode = `00020126580014BR.GOV.BCB.PIX0136${txId}5204000053039865802BR5913GLAMO${request.amount.toFixed(2)}`;
      const copyPaste = qrCode;

      const pixDetails: PixDetails = {
        txId,
        qrCode,
        copyPaste,
        expiresAt,
      };

      return {
        success: true,
        transactionId: txId,
        status: PaymentStatus.PENDING,
        gatewayData: {
          provider: this.provider,
          transactionId: txId,
          rawResponse: {
            qrCode,
            expiresAt: expiresAt.toISOString(),
          },
        },
        pixDetails,
      };
    } catch (error) {
      this.logger.error(`PIX generation failed: ${error.message}`);
      return {
        success: false,
        status: PaymentStatus.FAILED,
        gatewayData: {
          provider: this.provider,
          transactionId: '',
        },
        error: {
          code: 'PIX_GENERATION_FAILED',
          message: error.message,
        },
      };
    }
  }

  async checkPixStatus(txId: string): Promise<PaymentStatus> {
    this.logger.log(`Checking PIX status: ${txId}`);

    // Aqui seria a verificação real com o gateway
    // Simulando como pendente
    return PaymentStatus.PENDING;
  }

  // ========================
  // TOKENIZATION
  // ========================

  async tokenizeCard(cardData: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    holderName: string;
  }): Promise<{ token: string; cardDetails: CardDetails }> {
    // Aqui seria a tokenização real com o gateway
    const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lastFour = cardData.number.slice(-4);

    // Detectar bandeira (simplificado)
    let brand: any = 'OTHER';
    if (cardData.number.startsWith('4')) brand = 'VISA';
    else if (cardData.number.startsWith('5')) brand = 'MASTERCARD';
    else if (cardData.number.startsWith('3')) brand = 'AMEX';

    return {
      token,
      cardDetails: {
        brand,
        lastFour,
        holderName: cardData.holderName,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
      },
    };
  }

  // ========================
  // WEBHOOKS
  // ========================

  async handleWebhook(
    provider: string,
    payload: any,
    signature: string,
  ): Promise<{ event: string; data: any }> {
    this.logger.log(`Processing webhook from ${provider}`);

    // Aqui seria a validação da assinatura e processamento
    return {
      event: payload.event || payload.type,
      data: payload.data || payload,
    };
  }

  // ========================
  // INSTALLMENTS
  // ========================

  async calculateInstallments(
    amount: number,
    maxInstallments: number = 12,
  ): Promise<
    Array<{
      installments: number;
      installmentAmount: number;
      totalAmount: number;
      interestRate: number;
      hasInterest: boolean;
    }>
  > {
    const options = [];
    const interestFreeLimit = 3;

    for (let i = 1; i <= maxInstallments; i++) {
      const hasInterest = i > interestFreeLimit;
      const interestRate = hasInterest ? 0.0199 * (i - interestFreeLimit) : 0;
      const totalAmount = hasInterest ? amount * (1 + interestRate) : amount;
      const installmentAmount = totalAmount / i;

      options.push({
        installments: i,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        interestRate: Math.round(interestRate * 10000) / 100,
        hasInterest,
      });
    }

    return options;
  }
}
