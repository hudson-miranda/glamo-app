import api from '@/lib/api';

export interface TenantSettings {
  id: string;
  tenantId: string;
  
  // General
  businessName: string;
  businessType: string;
  description?: string;
  logo?: string;
  favicon?: string;
  
  // Contact
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Business Hours
  businessHours: BusinessHour[];
  
  // Booking
  bookingSettings: {
    allowOnlineBooking: boolean;
    advanceBookingDays: number;
    minAdvanceHours: number;
    maxServicesPerBooking: number;
    requireDeposit: boolean;
    depositPercentage: number;
    cancellationPolicy: string;
    cancellationHours: number;
    sendReminders: boolean;
    reminderHours: number[];
  };
  
  // Notifications
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    pushNotifications: boolean;
  };
  
  // Appearance
  appearanceSettings: {
    primaryColor: string;
    secondaryColor: string;
    theme: 'light' | 'dark' | 'system';
    customCss?: string;
  };
  
  // Integrations
  integrations: {
    googleCalendar?: { enabled: boolean; calendarId?: string };
    googleMaps?: { enabled: boolean; apiKey?: string };
    whatsappApi?: { enabled: boolean; phoneNumberId?: string; accessToken?: string };
    paymentGateway?: { enabled: boolean; provider?: string; credentials?: Record<string, string> };
  };
}

export interface BusinessHour {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserInvite {
  email: string;
  role: 'admin' | 'manager' | 'staff';
  name?: string;
}

export interface BillingInfo {
  plan: {
    id: string;
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
  };
  subscription: {
    status: 'active' | 'trialing' | 'past_due' | 'cancelled';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEnd?: string;
  };
  paymentMethod?: {
    type: 'credit_card' | 'boleto' | 'pix';
    last4?: string;
    brand?: string;
  };
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
}

export const settingsService = {
  // Tenant Settings
  async getTenantSettings(): Promise<TenantSettings> {
    const response = await api.get<TenantSettings>('/settings');
    return response.data;
  },

  async updateTenantSettings(data: Partial<TenantSettings>): Promise<TenantSettings> {
    const response = await api.patch<TenantSettings>('/settings', data);
    return response.data;
  },

  // Working Hours
  async getWorkingHours(): Promise<BusinessHour[]> {
    const response = await api.get<BusinessHour[]>('/settings/working-hours');
    return response.data;
  },

  async updateWorkingHours(data: BusinessHour[]): Promise<BusinessHour[]> {
    const response = await api.put<BusinessHour[]>('/settings/working-hours', data);
    return response.data;
  },

  // Notification Settings
  async getNotificationSettings(): Promise<TenantSettings['notificationSettings']> {
    const response = await api.get<TenantSettings['notificationSettings']>('/settings/notifications');
    return response.data;
  },

  async updateNotificationSettings(data: Partial<TenantSettings['notificationSettings']>): Promise<TenantSettings['notificationSettings']> {
    const response = await api.patch<TenantSettings['notificationSettings']>('/settings/notifications', data);
    return response.data;
  },

  // Appearance Settings
  async getAppearanceSettings(): Promise<TenantSettings['appearanceSettings']> {
    const response = await api.get<TenantSettings['appearanceSettings']>('/settings/appearance');
    return response.data;
  },

  async updateAppearanceSettings(data: Partial<TenantSettings['appearanceSettings']>): Promise<TenantSettings['appearanceSettings']> {
    const response = await api.patch<TenantSettings['appearanceSettings']>('/settings/appearance', data);
    return response.data;
  },

  // Subscription
  async getSubscription(): Promise<BillingInfo['subscription'] & { plan: BillingInfo['plan'] }> {
    const response = await api.get<BillingInfo['subscription'] & { plan: BillingInfo['plan'] }>('/settings/subscription');
    return response.data;
  },

  async upgradeSubscription(planId: string): Promise<void> {
    await api.post('/settings/subscription/upgrade', { planId });
  },

  async cancelSubscription(): Promise<void> {
    await api.post('/settings/subscription/cancel');
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/settings/invoices');
    return response.data;
  },

  // Legacy aliases
  async getSettings(): Promise<TenantSettings> {
    return this.getTenantSettings();
  },

  async updateSettings(data: Partial<TenantSettings>): Promise<TenantSettings> {
    return this.updateTenantSettings(data);
  },

  async uploadLogo(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ url: string }>('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Users
  async listUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/settings/users');
    return response.data;
  },

  async inviteUser(data: UserInvite): Promise<void> {
    await api.post('/settings/users/invite', data);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`/settings/users/${id}`, data);
    return response.data;
  },

  async removeUser(id: string): Promise<void> {
    await api.delete(`/settings/users/${id}`);
  },

  async resendInvite(id: string): Promise<void> {
    await api.post(`/settings/users/${id}/resend-invite`);
  },

  // Profile
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/settings/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>('/settings/profile', data);
    return response.data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/settings/profile/password', { currentPassword, newPassword });
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ url: string }>('/settings/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Billing
  async getBillingInfo(): Promise<BillingInfo> {
    const response = await api.get<BillingInfo>('/settings/billing');
    return response.data;
  },

  async updatePaymentMethod(data: { token: string }): Promise<void> {
    await api.post('/settings/billing/payment-method', data);
  },

  async changePlan(planId: string): Promise<void> {
    await api.post('/settings/billing/change-plan', { planId });
  },

  async cancelSubscriptionWithReason(reason?: string): Promise<void> {
    await api.post('/settings/billing/cancel', { reason });
  },

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await api.get(`/settings/billing/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
