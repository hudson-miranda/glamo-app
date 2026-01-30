/**
 * JWT Payload Interface
 * 
 * Define a estrutura do payload JWT usado para autenticação.
 */

import { UserRole } from '@glamo/database';

/**
 * Payload do Access Token JWT
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  
  /** Email do usuário */
  email: string;
  
  /** Tenant ID para multi-tenancy */
  tenantId: string;
  
  /** Role do usuário */
  role: UserRole;
  
  /** Professional ID (se aplicável) */
  professionalId?: string;
  
  /** Permissões do usuário */
  permissions: string[];
  
  /** Issued at (timestamp) */
  iat?: number;
  
  /** Expiration (timestamp) */
  exp?: number;
}

/**
 * Payload do Refresh Token JWT
 */
export interface JwtRefreshPayload {
  /** User ID (subject) */
  sub: string;
  
  /** Tenant ID */
  tenantId: string;
  
  /** Token ID para revogação */
  tokenId: string;
  
  /** Tipo do token */
  type: 'refresh';
  
  /** Issued at */
  iat?: number;
  
  /** Expiration */
  exp?: number;
}

/**
 * Usuário autenticado (anexado ao request)
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  professionalId?: string;
  permissions: string[];
}

/**
 * Request com usuário autenticado
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Tokens de autenticação
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Resposta de login
 */
export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    logoUrl?: string;
  };
}

/**
 * Constantes de autenticação
 */
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_RESET_EXPIRY: '1h',
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  BCRYPT_ROUNDS: 12,
} as const;
