/**
 * GLAMO - Prisma Client Singleton
 * Prisma client instance for Next.js
 * 
 * @version 1.0.0
 * @description Singleton pattern for Prisma in development and production
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// PRISMA CLIENT
// ============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// TENANT-AWARE HELPERS
// ============================================================================

/**
 * Create a Prisma client with tenant context for RLS
 */
export async function withTenant(tenantId: string) {
  // Set the tenant context for RLS policies
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, TRUE)`;
  return prisma;
}

/**
 * Execute a callback with tenant context
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, TRUE)`;
  return callback(prisma);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default prisma;
export { PrismaClient };
