import api from '@/lib/api';
import Cookies from 'js-cookie';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    hasTenant: boolean;
    avatar?: string;
    phone?: string;
  };
  tenant: Tenant | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  emailVerifiedAt?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<{ message: string; email: string }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async verifyEmail(code: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/verify-email', { code });
    return response.data;
  },

  async resendVerificationCode(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email });
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('tenantId');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  setTokens(accessToken: string, refreshToken: string, tenantId?: string): void {
    Cookies.set('accessToken', accessToken, { expires: 7 });
    Cookies.set('refreshToken', refreshToken, { expires: 30 });
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    if (tenantId) {
      Cookies.set('tenantId', tenantId, { expires: 30 });
      localStorage.setItem('tenantId', tenantId);
    }
  },

  clearTokens(): void {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('tenantId');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('accessToken') || localStorage.getItem('accessToken');
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(Cookies.get('accessToken') || localStorage.getItem('accessToken'));
  },
};
