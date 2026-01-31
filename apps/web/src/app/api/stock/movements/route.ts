/**
 * GLAMO - Stock Movements API Routes
 * GET /api/stock/movements - List movements with filters
 * POST /api/stock/movements - Create new movement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId, getApiUserId } from '@/lib/auth';
import {
  StockMovementService,
  stockMovementSchema,
  movementFiltersSchema,
} from '@/lib/services/stockMovementService';

// GET /api/stock/movements - List stock movements
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
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const service = new StockMovementService(tenantId);
    const result = await service.list({
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing stock movements:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/stock/movements - Create stock movement
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
    const data = stockMovementSchema.parse(body);

    const service = new StockMovementService(tenantId);
    const movement = await service.createMovement(data, userId || undefined);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);

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
