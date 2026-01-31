/**
 * GLAMO - Stock Export API
 * GET /api/stock/export - Export movements to CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import {
  StockMovementService,
  movementFiltersSchema,
} from '@/lib/services/stockMovementService';

// GET /api/stock/export - Export movements to CSV
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
    const filters = movementFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      productId: searchParams.get('productId') || undefined,
      type: searchParams.get('type')?.split(',') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const service = new StockMovementService(tenantId);
    const csv = await service.exportToCsv({
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `movimentacoes-estoque-${date}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting stock movements:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
