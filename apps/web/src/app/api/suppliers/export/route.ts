/**
 * GLAMO - Suppliers Export API Route
 * GET /api/suppliers/export - Export suppliers to CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';

/**
 * GET /api/suppliers/export
 * Export suppliers to CSV
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
    const csv = await service.exportToCsv();

    const filename = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting suppliers:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao exportar fornecedores' },
      { status: 500 }
    );
  }
}
