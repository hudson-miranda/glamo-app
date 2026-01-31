/**
 * GLAMO - Stock Movement by ID API Routes
 * GET /api/stock/movements/[id] - Get movement details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { StockMovementService } from '@/lib/services/stockMovementService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/stock/movements/[id] - Get movement by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const service = new StockMovementService(tenantId);
    const movement = await service.getById(id);

    if (!movement) {
      return NextResponse.json(
        { error: 'Movimentação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(movement);
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
