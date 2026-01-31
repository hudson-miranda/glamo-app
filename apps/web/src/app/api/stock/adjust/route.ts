/**
 * GLAMO - Stock Adjustment API
 * POST /api/stock/adjust - Adjust inventory quantity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId, getApiUserId } from '@/lib/auth';
import {
  StockMovementService,
  inventoryAdjustmentSchema,
} from '@/lib/services/stockMovementService';

// POST /api/stock/adjust - Adjust inventory
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
    const data = inventoryAdjustmentSchema.parse(body);

    const service = new StockMovementService(tenantId);
    const movement = await service.adjustInventory(data, userId || undefined);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error adjusting inventory:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
