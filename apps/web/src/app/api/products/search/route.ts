/**
 * GLAMO - Products Search API Route
 * GET /api/products/search - Search products by term
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler, ValidationError } from '@/lib/errors';
import { z } from 'zod';

// ============================================================================
// GET /api/products/search
// ============================================================================

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório'),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

async function handleGet(request: NextRequest) {
  const tenantContext = await getTenantFromRequest(request);
  
  return withTenantContext(tenantContext, async () => {
    const { searchParams } = new URL(request.url);
    const query = searchQuerySchema.parse(Object.fromEntries(searchParams));
    
    const service = createProductService(tenantContext);
    const products = await service.search(query.q, query.limit || 10);

    return NextResponse.json({ products }, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
