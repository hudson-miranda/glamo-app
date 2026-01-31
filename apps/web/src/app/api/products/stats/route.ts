/**
 * GLAMO - Products Statistics API Route
 * GET /api/products/stats - Get product statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/errors';

// ============================================================================
// GET /api/products/stats
// ============================================================================

async function handleGet(request: NextRequest) {
  const tenantContext = await getTenantFromRequest(request);
  
  return withTenantContext(tenantContext, async () => {
    const service = createProductService(tenantContext);
    const stats = await service.getStats();

    return NextResponse.json(stats, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
