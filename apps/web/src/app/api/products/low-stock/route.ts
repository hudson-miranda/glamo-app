/**
 * GLAMO - Products Low Stock API Route
 * GET /api/products/low-stock - Get products with low stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/errors';

// ============================================================================
// GET /api/products/low-stock
// ============================================================================

async function handleGet(request: NextRequest) {
  const tenantContext = await getTenantFromRequest(request);
  
  return withTenantContext(tenantContext, async () => {
    const service = createProductService(tenantContext);
    const products = await service.findLowStock();

    return NextResponse.json({ products }, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
