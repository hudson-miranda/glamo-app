// ========================
// NOTIFICATION ENUMS
// ========================

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  APPOINTMENT = 'appointment',
  PAYMENT = 'payment',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  REMINDER = 'reminder',
  CONFIRMATION = 'confirmation',
  ALERT = 'alert',
}

export enum TemplateType {
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_FAILED = 'payment_failed',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  VERIFICATION = 'verification',
  BIRTHDAY = 'birthday',
  LOYALTY_POINTS = 'loyalty_points',
  PROMOTION = 'promotion',
  REVIEW_REQUEST = 'review_request',
  CUSTOM = 'custom',
}

// ========================
// NOTIFICATION INTERFACES
// ========================

export interface Notification {
  id: string;
  tenantId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  templateId?: string;
  recipientId?: string;
  recipientType?: 'customer' | 'professional' | 'user';
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  subject?: string;
  content: NotificationContent;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationContent {
  title?: string;
  body: string;
  html?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  image?: string;
  icon?: string;
}

export interface NotificationAction {
  type: 'button' | 'link';
  label: string;
  url?: string;
  action?: string;
}

// ========================
// TEMPLATE INTERFACES
// ========================

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: TemplateType;
  channels: NotificationType[];
  subject?: string;
  content: TemplateContent;
  variables: TemplateVariable[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateContent {
  email?: {
    subject: string;
    html: string;
    text?: string;
  };
  sms?: {
    text: string;
  };
  push?: {
    title: string;
    body: string;
    image?: string;
    actions?: NotificationAction[];
  };
  whatsapp?: {
    templateName: string;
    language: string;
    components?: any[];
  };
  inApp?: {
    title: string;
    body: string;
    icon?: string;
    actions?: NotificationAction[];
  };
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
  format?: string;
}

// ========================
// PREFERENCE INTERFACES
// ========================

export interface NotificationPreference {
  id: string;
  tenantId: string;
  recipientId: string;
  recipientType: 'customer' | 'professional' | 'user';
  channels: ChannelPreference[];
  categories: CategoryPreference[];
  quietHours?: QuietHours;
  language: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPreference {
  channel: NotificationType;
  enabled: boolean;
  priority?: NotificationPriority;
}

export interface CategoryPreference {
  category: NotificationCategory;
  enabled: boolean;
  channels?: NotificationType[];
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm
  end: string;
  timezone: string;
  exceptUrgent: boolean;
}

// ========================
// QUEUE INTERFACES
// ========================

export interface NotificationQueue {
  id: string;
  tenantId: string;
  notificationId: string;
  priority: number;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
}

export interface QueueConfig {
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  batchSize: number;
  processInterval: number;
}

// ========================
// DEVICE INTERFACES
// ========================

export interface DeviceToken {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'customer' | 'professional' | 'user';
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceInfo?: DeviceInfo;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface DeviceInfo {
  model?: string;
  os?: string;
  osVersion?: string;
  appVersion?: string;
  pushProvider?: 'fcm' | 'apns' | 'web-push';
}

// ========================
// EMAIL PROVIDER INTERFACES
// ========================

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun' | 'resend';
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  credentials: Record<string, any>;
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
}

// ========================
// SMS PROVIDER INTERFACES
// ========================

export interface SmsConfig {
  provider: 'twilio' | 'zenvia' | 'totalvoice' | 'aws-sns';
  fromNumber: string;
  credentials: Record<string, any>;
}

export interface SmsResult {
  messageId: string;
  status: 'sent' | 'failed';
  segments?: number;
  error?: string;
}

// ========================
// PUSH PROVIDER INTERFACES
// ========================

export interface PushConfig {
  provider: 'firebase' | 'onesignal' | 'expo';
  credentials: Record<string, any>;
}

export interface PushResult {
  messageId: string;
  successCount: number;
  failureCount: number;
  errors?: string[];
}

// ========================
// ANALYTICS INTERFACES
// ========================

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  byChannel: Record<NotificationType, ChannelStats>;
  byCategory: Record<NotificationCategory, number>;
  byStatus: Record<NotificationStatus, number>;
}

export interface ChannelStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

// ========================
// BULK NOTIFICATION INTERFACES
// ========================

export interface BulkNotification {
  id: string;
  tenantId: string;
  name: string;
  templateId: string;
  recipientFilter: RecipientFilter;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface RecipientFilter {
  type: 'all' | 'segment' | 'custom';
  recipientType: 'customer' | 'professional';
  segmentId?: string;
  customIds?: string[];
  filters?: {
    tags?: string[];
    lastVisitBefore?: Date;
    lastVisitAfter?: Date;
    totalSpentMin?: number;
    totalSpentMax?: number;
    birthdayMonth?: number;
  };
}
