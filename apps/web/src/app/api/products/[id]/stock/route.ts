/**
 * GLAMO - Product Stock API Routes
 * GET /api/products/[id]/stock - Get stock movements for a product
 * POST /api/products/[id]/stock - Add stock movement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService, stockMovementSchema } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/errors';
import { StockMovementType } from '@prisma/client';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/products/[id]/stock
// ============================================================================

const listQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.string().optional(), // Comma-separated movement types
  limit: z.coerce.number().int().positive().max(500).optional(),
});

async function handleGet(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));
    
    const service = createProductService(tenantContext);
    
    // Validate product exists
    await service.findByIdOrThrow(id);

    const movements = await service.getStockMovements(id, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      type: query.type?.split(',').filter(Boolean) as StockMovementType[] | undefined,
      limit: query.limit || 100,
    });

    return NextResponse.json({ movements }, { status: 200 });
  });
}

// ============================================================================
// POST /api/products/[id]/stock
// ============================================================================

const createMovementSchema = stockMovementSchema.omit({ productId: true });

async function handlePost(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const body = await request.json();
    const validated = createMovementSchema.parse(body);
    
    const service = createProductService(tenantContext);
    const result = await service.addStockMovement(
      { ...validated, productId: id },
      tenantContext.userId
    );

    return NextResponse.json(result, { status: 201 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
export const POST = withErrorHandler(handlePost);
