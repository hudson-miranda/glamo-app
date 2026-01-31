/**
 * GLAMO - Customer Bulk Operations API Route Handler
 * POST: Bulk operations (delete, update status, etc.)
 * 
 * @version 1.0.0
 * @description Handles bulk operations on multiple customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { createCustomerService } from '@/lib/services/customerService';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate']),
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um cliente'),
});

// ============================================================================
// POST - BULK OPERATIONS
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate
    const { action, ids } = bulkOperationSchema.parse(body);

    // Execute bulk operation
    const service = createCustomerService(tenantId);
    let affectedCount = 0;

    switch (action) {
      case 'delete':
        affectedCount = await service.bulkDelete(ids);
        break;

      case 'activate':
        affectedCount = await service.bulkUpdateStatus(ids, 'ACTIVE');
        break;

      case 'deactivate':
        affectedCount = await service.bulkUpdateStatus(ids, 'INACTIVE');
        break;
    }

    return NextResponse.json({
      success: true,
      affectedCount,
      message: `${affectedCount} cliente(s) atualizado(s) com sucesso`,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
