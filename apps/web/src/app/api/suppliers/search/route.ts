/**
 * GLAMO - Suppliers Search API Route
 * GET /api/suppliers/search - Search suppliers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';

/**
 * GET /api/suppliers/search
 * Search suppliers by term
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('q') || searchParams.get('term') || '';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    const service = new SupplierService(tenantId);
    const suppliers = await service.search(term, limit);

    return NextResponse.json({ data: suppliers });
  } catch (error) {
    console.error('Error searching suppliers:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}
