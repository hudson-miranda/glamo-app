// ========================
// INTEGRATIONS INTERFACES
// ========================

export enum IntegrationType {
  WHATSAPP = 'WHATSAPP',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  CALENDAR = 'CALENDAR',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  ACCOUNTING = 'ACCOUNTING',
  CRM = 'CRM',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  STORAGE = 'STORAGE',
  CUSTOM = 'CUSTOM',
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
}

export enum WebhookEventType {
  // Appointments
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_REMINDER = 'appointment.reminder',

  // Customers
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',

  // Payments
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Inventory
  STOCK_LOW = 'stock.low',
  STOCK_OUT = 'stock.out',

  // Marketing
  CAMPAIGN_SENT = 'campaign.sent',
  COUPON_REDEEMED = 'coupon.redeemed',

  // Custom
  CUSTOM = 'custom',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// ========================
// INTEGRATION CONFIG
// ========================

export interface Integration {
  id: string;
  tenantId: string;
  type: IntegrationType;
  name: string;
  description?: string;
  provider: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  credentials?: IntegrationCredentials;
  metadata?: Record<string, any>;
  lastSyncAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  apiUrl?: string;
  version?: string;
  sandbox?: boolean;
  features?: string[];
  mappings?: Record<string, string>;
  settings?: Record<string, any>;
}

export interface IntegrationCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  clientId?: string;
  clientSecret?: string;
}

// ========================
// WHATSAPP INTEGRATION
// ========================

export interface WhatsAppConfig extends IntegrationConfig {
  phoneNumberId: string;
  businessAccountId: string;
  verifyToken: string;
  webhookSecret: string;
}

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  integrationId: string;
  to: string;
  from: string;
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video' | 'interactive';
  content: WhatsAppContent;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  externalId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface WhatsAppContent {
  text?: string;
  templateName?: string;
  templateParams?: Record<string, string>[];
  mediaUrl?: string;
  caption?: string;
  buttons?: WhatsAppButton[];
}

export interface WhatsAppButton {
  type: 'reply' | 'url' | 'phone';
  text: string;
  payload?: string;
}

export interface WhatsAppTemplate {
  id: string;
  tenantId: string;
  name: string;
  language: string;
  category: string;
  components: WhatsAppTemplateComponent[];
  status: 'pending' | 'approved' | 'rejected';
  externalId?: string;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  text?: string;
  format?: 'text' | 'image' | 'document' | 'video';
  parameters?: { type: string; text?: string }[];
  buttons?: WhatsAppButton[];
}

// ========================
// PAYMENT GATEWAY
// ========================

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  MERCADO_PAGO = 'MERCADO_PAGO',
  PAGSEGURO = 'PAGSEGURO',
  PAYPAL = 'PAYPAL',
  PIX = 'PIX',
  ASAAS = 'ASAAS',
}

export interface PaymentGatewayConfig extends IntegrationConfig {
  provider: PaymentProvider;
  publicKey?: string;
  webhookSecret?: string;
  splitEnabled?: boolean;
  autoCapture?: boolean;
}

export interface PaymentIntent {
  id: string;
  tenantId: string;
  integrationId: string;
  externalId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod?: string;
  customerId?: string;
  appointmentId?: string;
  saleId?: string;
  metadata?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'boleto' | 'wallet';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
}

export interface PixPayment {
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: Date;
}

export interface BoletoPayment {
  barcode: string;
  barcodeImage: string;
  pdfUrl: string;
  dueDate: Date;
}

// ========================
// CALENDAR INTEGRATION
// ========================

export enum CalendarProvider {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  APPLE = 'APPLE',
}

export interface CalendarConfig extends IntegrationConfig {
  provider: CalendarProvider;
  calendarId?: string;
  syncEnabled: boolean;
  syncDirection: 'one-way' | 'two-way';
  createReminders: boolean;
  reminderMinutes: number[];
}

export interface CalendarEvent {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  attendees?: CalendarAttendee[];
  reminders?: number[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  appointmentId?: string;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'pending';
}

export interface CalendarSync {
  id: string;
  integrationId: string;
  direction: 'import' | 'export';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

// ========================
// WEBHOOKS
// ========================

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  retryPolicy: WebhookRetryPolicy;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryInterval: number; // em segundos
  exponentialBackoff: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: Record<string, any>;
  status: WebhookStatus;
  httpStatus?: number;
  response?: string;
  attempts: number;
  nextRetryAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ========================
// OAUTH
// ========================

export interface OAuthState {
  id: string;
  tenantId: string;
  integrationType: IntegrationType;
  provider: string;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
}

// ========================
// SYNC LOGS
// ========================

export interface SyncLog {
  id: string;
  tenantId: string;
  integrationId: string;
  type: 'import' | 'export' | 'sync';
  status: 'started' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt?: Date;
}

export interface SyncError {
  record: string;
  error: string;
  details?: Record<string, any>;
}

// ========================
// API KEYS
// ========================

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  rateLimit?: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}
