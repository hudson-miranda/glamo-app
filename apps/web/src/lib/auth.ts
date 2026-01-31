/**
 * GLAMO - NextAuth Configuration
 * Authentication options for Next.js App Router
 * 
 * @version 1.0.0
 * @description NextAuth.js configuration with Prisma adapter
 */

import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

// ============================================================================
// TYPES
// ============================================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      tenantId: string;
      role: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
    role: string;
  }
}

// ============================================================================
// AUTH OPTIONS
// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/onboarding',
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenant: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('Email ou senha incorretos');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Email ou senha incorretos');
        }

        if (!user.isActive) {
          throw new Error('Conta desativada. Entre em contato com o suporte.');
        }

        if (!user.tenant?.isActive) {
          throw new Error('Empresa desativada. Entre em contato com o suporte.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
      }

      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          tenantId: token.tenantId,
          role: token.role,
        };
      }
      return session;
    },
    
    async signIn({ user }) {
      // Additional sign-in checks can be added here
      return !!user;
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  
  events: {
    async signIn({ user }) {
      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current session on the server side
 */
export async function getSession(): Promise<Session | null> {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}

/**
 * Development tenant ID for testing without authentication
 * This should match an existing tenant in the database for development
 */
export const DEV_TENANT_ID = '1993ef96-a6e9-4538-98bb-5f95a1a64ce2';
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Get tenant ID for API routes - uses dev tenant in development if not authenticated
 */
export async function getApiTenantId(): Promise<string | null> {
  const session = await getSession();
  
  // In development, return dev tenant if not authenticated
  if (process.env.NODE_ENV === 'development' && !session?.user?.tenantId) {
    return DEV_TENANT_ID;
  }
  
  return session?.user?.tenantId ?? null;
}

/**
 * Get user ID for API routes - uses dev user in development if not authenticated
 */
export async function getApiUserId(): Promise<string | null> {
  const session = await getSession();
  
  // In development, return dev user if not authenticated
  if (process.env.NODE_ENV === 'development' && !session?.user?.id) {
    return DEV_USER_ID;
  }
  
  return session?.user?.id ?? null;
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Get the current tenant ID from session
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.tenantId ?? null;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const session = await getSession();
  return roles.includes(session?.user?.role ?? '');
}
