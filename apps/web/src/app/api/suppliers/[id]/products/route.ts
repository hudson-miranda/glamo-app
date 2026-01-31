/**
 * GLAMO - Supplier Products API Routes
 * GET /api/suppliers/[id]/products - Get supplier products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/suppliers/[id]/products
 * Get products from supplier
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

    const service = new SupplierService(tenantId);
    const result = await service.getProducts(params.id, { page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting supplier products:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: 'Not Found', message: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao buscar produtos do fornecedor' },
      { status: 500 }
    );
  }
}
