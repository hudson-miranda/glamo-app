/**
 * GLAMO - Suppliers Stats API Route
 * GET /api/suppliers/stats - Get supplier statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';

/**
 * GET /api/suppliers/stats
 * Get supplier statistics
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

    const service = new SupplierService(tenantId);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting supplier stats:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
