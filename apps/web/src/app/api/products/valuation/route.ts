/**
 * GLAMO - Products Stock Valuation API Route
 * GET /api/products/valuation - Get stock valuation summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/errors';

// ============================================================================
// GET /api/products/valuation
// ============================================================================

async function handleGet(request: NextRequest) {
  const tenantContext = await getTenantFromRequest(request);
  
  return withTenantContext(tenantContext, async () => {
    const service = createProductService(tenantContext);
    const valuation = await service.getStockValuation();

    return NextResponse.json(valuation, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
