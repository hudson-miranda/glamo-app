/**
 * GLAMO - Stock Summary API
 * GET /api/stock/summary - Get stock summary statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { StockMovementService } from '@/lib/services/stockMovementService';

// GET /api/stock/summary - Get stock summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const service = new StockMovementService(tenantId);
    const summary = await service.getSummary();

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
