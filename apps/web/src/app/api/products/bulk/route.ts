/**
 * GLAMO - Products Bulk Operations API Route
 * POST /api/products/bulk - Bulk operations on products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProductService, bulkStockMovementSchema } from '@/lib/services/productService';
import { withTenantContext, getTenantFromRequest } from '@/lib/tenant';
import { withErrorHandler, ValidationError } from '@/lib/errors';
import { z } from 'zod';

// ============================================================================
// POST /api/products/bulk
// ============================================================================

const bulkActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('activate'),
    ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é necessário'),
  }),
  z.object({
    action: z.literal('deactivate'),
    ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é necessário'),
  }),
  z.object({
    action: z.literal('delete'),
    ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é necessário'),
  }),
  z.object({
    action: z.literal('update_category'),
    ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é necessário'),
    categoryId: z.string().uuid().nullable(),
  }),
  z.object({
    action: z.literal('price_adjustment'),
    ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é necessário'),
    adjustmentType: z.enum(['percentage', 'fixed']),
    adjustmentValue: z.number(),
    target: z.enum(['costPrice', 'salePrice']),
  }),
  z.object({
    action: z.literal('stock_movement'),
    movements: bulkStockMovementSchema.shape.movements,
  }),
]);

async function handlePost(request: NextRequest) {
  const tenantContext = await getTenantFromRequest(request);
  
  return withTenantContext(tenantContext, async () => {
    const body = await request.json();
    const validated = bulkActionSchema.parse(body);
    
    const service = createProductService(tenantContext);
    let result: { count?: number; results?: unknown[] };

    switch (validated.action) {
      case 'activate': {
        const count = await service.bulkActivate(validated.ids);
        result = { count };
        break;
      }
      case 'deactivate': {
        const count = await service.bulkDeactivate(validated.ids);
        result = { count };
        break;
      }
      case 'delete': {
        const count = await service.bulkDelete(validated.ids);
        result = { count };
        break;
      }
      case 'update_category': {
        const count = await service.bulkUpdateCategory(validated.ids, validated.categoryId);
        result = { count };
        break;
      }
      case 'price_adjustment': {
        const count = await service.bulkPriceAdjustment(validated.ids, {
          type: validated.adjustmentType,
          value: validated.adjustmentValue,
          target: validated.target,
        });
        result = { count };
        break;
      }
      case 'stock_movement': {
        const results = await service.addBulkStockMovements(
          validated.movements,
          tenantContext.userId
        );
        result = { count: results.length, results };
        break;
      }
      default:
        throw new ValidationError('Ação inválida');
    }

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

export const POST = withErrorHandler(handlePost);
