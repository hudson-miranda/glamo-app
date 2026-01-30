import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  TemplateType,
} from '../interfaces';

// ========================
// NOTIFICATION CONTENT DTOs
// ========================

export class NotificationActionDto {
  @ApiProperty({ enum: ['button', 'link'] })
  @IsEnum(['button', 'link'])
  type: 'button' | 'link';

  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;
}

export class NotificationContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ type: [NotificationActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

// ========================
// SEND NOTIFICATION DTOs
// ========================

export class SendNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiPropertyOptional({ enum: ['customer', 'professional', 'user'] })
  @IsOptional()
  @IsEnum(['customer', 'professional', 'user'])
  recipientType?: 'customer' | 'professional' | 'user';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientDeviceToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: NotificationContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationContentDto)
  content?: NotificationContentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SendBulkNotificationDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ enum: ['all', 'segment', 'custom'] })
  @IsEnum(['all', 'segment', 'custom'])
  recipientFilterType: 'all' | 'segment' | 'custom';

  @ApiProperty({ enum: ['customer', 'professional'] })
  @IsEnum(['customer', 'professional'])
  recipientType: 'customer' | 'professional';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  customIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

// ========================
// TEMPLATE DTOs
// ========================

export class EmailTemplateContentDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  html: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;
}

export class SmsTemplateContentDto {
  @ApiProperty()
  @IsString()
  text: string;
}

export class PushTemplateContentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: [NotificationActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];
}

export class WhatsAppTemplateContentDto {
  @ApiProperty()
  @IsString()
  templateName: string;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  components?: any[];
}

export class TemplateContentDto {
  @ApiPropertyOptional({ type: EmailTemplateContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailTemplateContentDto)
  email?: EmailTemplateContentDto;

  @ApiPropertyOptional({ type: SmsTemplateContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsTemplateContentDto)
  sms?: SmsTemplateContentDto;

  @ApiPropertyOptional({ type: PushTemplateContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushTemplateContentDto)
  push?: PushTemplateContentDto;

  @ApiPropertyOptional({ type: WhatsAppTemplateContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTemplateContentDto)
  whatsapp?: WhatsAppTemplateContentDto;

  @ApiPropertyOptional({ type: PushTemplateContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushTemplateContentDto)
  inApp?: PushTemplateContentDto;
}

export class TemplateVariableDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['string', 'number', 'date', 'boolean', 'object'] })
  @IsEnum(['string', 'number', 'date', 'boolean', 'object'])
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';

  @ApiProperty()
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: TemplateType })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({ enum: NotificationType, isArray: true })
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  channels: NotificationType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ type: TemplateContentDto })
  @ValidateNested()
  @Type(() => TemplateContentDto)
  content: TemplateContentDto;

  @ApiPropertyOptional({ type: [TemplateVariableDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  variables?: TemplateVariableDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}

// ========================
// PREFERENCE DTOs
// ========================

export class ChannelPreferenceDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  channel: NotificationType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class CategoryPreferenceDto {
  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: NotificationType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  channels?: NotificationType[];
}

export class QuietHoursDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'HH:mm format' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'HH:mm format' })
  @IsString()
  end: string;

  @ApiProperty()
  @IsString()
  timezone: string;

  @ApiProperty()
  @IsBoolean()
  exceptUrgent: boolean;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ type: [ChannelPreferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelPreferenceDto)
  channels?: ChannelPreferenceDto[];

  @ApiPropertyOptional({ type: [CategoryPreferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryPreferenceDto)
  categories?: CategoryPreferenceDto[];

  @ApiPropertyOptional({ type: QuietHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

// ========================
// DEVICE TOKEN DTOs
// ========================

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class UnregisterDeviceDto {
  @ApiProperty()
  @IsString()
  token: string;
}

// ========================
// EMAIL CONFIG DTOs
// ========================

export class EmailConfigDto {
  @ApiProperty({ enum: ['smtp', 'sendgrid', 'ses', 'mailgun', 'resend'] })
  @IsEnum(['smtp', 'sendgrid', 'ses', 'mailgun', 'resend'])
  provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun' | 'resend';

  @ApiProperty()
  @IsString()
  fromEmail: string;

  @ApiProperty()
  @IsString()
  fromName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyTo?: string;

  @ApiProperty()
  @IsObject()
  credentials: Record<string, any>;
}

// ========================
// SMS CONFIG DTOs
// ========================

export class SmsConfigDto {
  @ApiProperty({ enum: ['twilio', 'zenvia', 'totalvoice', 'aws-sns'] })
  @IsEnum(['twilio', 'zenvia', 'totalvoice', 'aws-sns'])
  provider: 'twilio' | 'zenvia' | 'totalvoice' | 'aws-sns';

  @ApiProperty()
  @IsString()
  fromNumber: string;

  @ApiProperty()
  @IsObject()
  credentials: Record<string, any>;
}

// ========================
// PUSH CONFIG DTOs
// ========================

export class PushConfigDto {
  @ApiProperty({ enum: ['firebase', 'onesignal', 'expo'] })
  @IsEnum(['firebase', 'onesignal', 'expo'])
  provider: 'firebase' | 'onesignal' | 'expo';

  @ApiProperty()
  @IsObject()
  credentials: Record<string, any>;
}
