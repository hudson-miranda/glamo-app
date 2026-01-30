import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  IsUrl,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IntegrationType, PaymentProvider, CalendarProvider, WebhookEventType } from '../interfaces';

// ========================
// INTEGRATION
// ========================

export class IntegrationCredentialsDto {
  @ApiPropertyOptional({ description: 'API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'API Secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'Access Token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Refresh Token' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Client Secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;
}

export class IntegrationConfigDto {
  @ApiPropertyOptional({ description: 'URL da API' })
  @IsOptional()
  @IsUrl()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'Versão da API' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Modo sandbox', default: false })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({ description: 'Features habilitadas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Configurações adicionais' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class CreateIntegrationDto {
  @ApiProperty({ enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'Nome da integração' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Provedor', example: 'STRIPE' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ type: IntegrationConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegrationConfigDto)
  config?: IntegrationConfigDto;

  @ApiPropertyOptional({ type: IntegrationCredentialsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegrationCredentialsDto)
  credentials?: IntegrationCredentialsDto;
}

export class UpdateIntegrationDto extends PartialType(CreateIntegrationDto) {
  @ApiPropertyOptional({ description: 'Ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ========================
// WHATSAPP
// ========================

export class WhatsAppConfigDto extends IntegrationConfigDto {
  @ApiProperty({ description: 'Phone Number ID' })
  @IsString()
  phoneNumberId: string;

  @ApiProperty({ description: 'Business Account ID' })
  @IsString()
  businessAccountId: string;

  @ApiProperty({ description: 'Token de verificação' })
  @IsString()
  verifyToken: string;

  @ApiPropertyOptional({ description: 'Secret do webhook' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

export class WhatsAppButtonDto {
  @ApiProperty({ description: 'Tipo', enum: ['reply', 'url', 'phone'] })
  @IsString()
  type: 'reply' | 'url' | 'phone';

  @ApiProperty({ description: 'Texto do botão' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Payload/URL' })
  @IsOptional()
  @IsString()
  payload?: string;
}

export class SendWhatsAppMessageDto {
  @ApiProperty({ description: 'Número de destino', example: '5511999999999' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Tipo de mensagem', enum: ['text', 'template', 'image', 'document'] })
  @IsString()
  type: 'text' | 'template' | 'image' | 'document';

  @ApiPropertyOptional({ description: 'Texto da mensagem' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Nome do template' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({ description: 'Parâmetros do template' })
  @IsOptional()
  @IsArray()
  templateParams?: Record<string, string>[];

  @ApiPropertyOptional({ description: 'URL da mídia' })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Legenda' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ type: [WhatsAppButtonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppButtonDto)
  buttons?: WhatsAppButtonDto[];
}

// ========================
// PAYMENT
// ========================

export class PaymentGatewayConfigDto extends IntegrationConfigDto {
  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ description: 'Chave pública' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiPropertyOptional({ description: 'Secret do webhook' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Split habilitado' })
  @IsOptional()
  @IsBoolean()
  splitEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Captura automática' })
  @IsOptional()
  @IsBoolean()
  autoCapture?: boolean;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Valor em centavos', example: 10000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Moeda', default: 'BRL' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GeneratePixDto {
  @ApiProperty({ description: 'Valor em centavos' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do pagador' })
  @IsOptional()
  @IsString()
  payerDocument?: string;

  @ApiPropertyOptional({ description: 'Minutos até expirar', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  expirationMinutes?: number;
}

// ========================
// CALENDAR
// ========================

export class CalendarConfigDto extends IntegrationConfigDto {
  @ApiProperty({ enum: CalendarProvider })
  @IsEnum(CalendarProvider)
  provider: CalendarProvider;

  @ApiPropertyOptional({ description: 'ID do calendário' })
  @IsOptional()
  @IsString()
  calendarId?: string;

  @ApiPropertyOptional({ description: 'Sincronização habilitada', default: true })
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Direção da sincronização', default: 'two-way' })
  @IsOptional()
  @IsString()
  syncDirection?: 'one-way' | 'two-way';

  @ApiPropertyOptional({ description: 'Criar lembretes', default: true })
  @IsOptional()
  @IsBoolean()
  createReminders?: boolean;

  @ApiPropertyOptional({ description: 'Minutos antes para lembretes' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminderMinutes?: number[];
}

export class CreateCalendarEventDto {
  @ApiProperty({ description: 'Título' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Local' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Data/hora início' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Data/hora fim' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Dia inteiro', default: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ description: 'Lembretes em minutos' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminders?: number[];

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsOptional()
  @IsString()
  appointmentId?: string;
}

// ========================
// WEBHOOKS
// ========================

export class WebhookRetryPolicyDto {
  @ApiPropertyOptional({ description: 'Máximo de tentativas', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Intervalo entre tentativas (segundos)', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  retryInterval?: number;

  @ApiPropertyOptional({ description: 'Backoff exponencial', default: true })
  @IsOptional()
  @IsBoolean()
  exponentialBackoff?: boolean;
}

export class CreateWebhookDto {
  @ApiProperty({ description: 'Nome do webhook' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL de destino' })
  @IsUrl()
  url: string;

  @ApiProperty({ enum: WebhookEventType, isArray: true })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events: WebhookEventType[];

  @ApiPropertyOptional({ description: 'Secret para assinatura' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ description: 'Headers customizados' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ type: WebhookRetryPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookRetryPolicyDto)
  retryPolicy?: WebhookRetryPolicyDto;
}

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiPropertyOptional({ description: 'Webhook ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ========================
// API KEYS
// ========================

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Nome da chave' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Escopos permitidos' })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiPropertyOptional({ description: 'Limite de requisições por minuto' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Data de expiração' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

// ========================
// OAUTH
// ========================

export class OAuthCallbackDto {
  @ApiProperty({ description: 'Código de autorização' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'State para validação' })
  @IsString()
  state: string;
}

export class InitOAuthDto {
  @ApiProperty({ enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'Provedor' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ description: 'URL de redirecionamento' })
  @IsOptional()
  @IsUrl()
  redirectUri?: string;
}
