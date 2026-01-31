/**
 * GLAMO - Stock Report API
 * GET /api/stock/report - Get stock movement report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { StockMovementService } from '@/lib/services/stockMovementService';

const reportFiltersSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  type: z.string().optional(),
});

// GET /api/stock/report - Get stock report
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const filters = reportFiltersSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupBy: searchParams.get('groupBy') || undefined,
      type: searchParams.get('type') || undefined,
    });

    const service = new StockMovementService(tenantId);
    const report = await service.getReport({
      startDate: new Date(filters.startDate),
      endDate: new Date(filters.endDate),
      groupBy: filters.groupBy,
      type: filters.type?.split(',') as any[],
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating stock report:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. startDate e endDate são obrigatórios.', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
