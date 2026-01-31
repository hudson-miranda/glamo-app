/**
 * GLAMO - Stock Batch Operations API
 * POST /api/stock/batch - Create batch movement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId, getApiUserId } from '@/lib/auth';
import {
  StockMovementService,
  batchMovementSchema,
} from '@/lib/services/stockMovementService';

// POST /api/stock/batch - Create batch movement
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    const userId = await getApiUserId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = batchMovementSchema.parse(body);

    const service = new StockMovementService(tenantId);
    const result = await service.createBatchMovement(data, userId || undefined);

    return NextResponse.json({
      success: result.movements.length,
      failed: result.failed.length,
      movements: result.movements,
      errors: result.failed,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating batch movement:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
