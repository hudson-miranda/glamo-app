/**
 * GLAMO - Product Detail API Routes
 * GET /api/products/[id] - Get product by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product (soft delete)
 * PATCH /api/products/[id] - Partial update (status, restore)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService, updateProductSchema } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler, ValidationError } from '@/lib/errors';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/products/[id]
// ============================================================================

async function handleGet(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const service = createProductService(tenantContext);
    const product = await service.findByIdOrThrow(id);

    return NextResponse.json(product, { status: 200 });
  });
}

// ============================================================================
// PUT /api/products/[id]
// ============================================================================

async function handlePut(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const body = await request.json();
    const validated = updateProductSchema.parse(body);
    
    const service = createProductService(tenantContext);
    const product = await service.update(id, validated);

    return NextResponse.json(product, { status: 200 });
  });
}

// ============================================================================
// DELETE /api/products/[id]
// ============================================================================

const deleteQuerySchema = z.object({
  permanent: z.enum(['true', 'false']).optional(),
});

async function handleDelete(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const { searchParams } = new URL(request.url);
    const query = deleteQuerySchema.parse(Object.fromEntries(searchParams));
    
    const service = createProductService(tenantContext);
    
    if (query.permanent === 'true') {
      await service.hardDelete(id);
    } else {
      await service.delete(id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  });
}

// ============================================================================
// PATCH /api/products/[id]
// ============================================================================

const patchSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'out_of_stock', 'restore']),
});

async function handlePatch(request: NextRequest, context: RouteContext) {
  const tenantContext = await getTenantFromRequest(request);
  const { id } = await context.params;
  
  return withTenantContext(tenantContext, async () => {
    const body = await request.json();
    const { action } = patchSchema.parse(body);
    
    const service = createProductService(tenantContext);
    let product;

    switch (action) {
      case 'activate':
        product = await service.activate(id);
        break;
      case 'deactivate':
        product = await service.deactivate(id);
        break;
      case 'out_of_stock':
        product = await service.markOutOfStock(id);
        break;
      case 'restore':
        product = await service.restore(id);
        break;
      default:
        throw new ValidationError('Ação inválida');
    }

    return NextResponse.json(product, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const GET = withErrorHandler(handleGet);
export const PUT = withErrorHandler(handlePut);
export const DELETE = withErrorHandler(handleDelete);
export const PATCH = withErrorHandler(handlePatch);
