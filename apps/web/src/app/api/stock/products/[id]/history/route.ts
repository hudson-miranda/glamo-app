/**
 * GLAMO - Product Stock History API
 * GET /api/stock/products/[id]/history - Get product movement history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { StockMovementService } from '@/lib/services/stockMovementService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/stock/products/[id]/history - Get product movement history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const service = new StockMovementService(tenantId);
    const result = await service.getProductHistory(productId, {
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching product history:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
