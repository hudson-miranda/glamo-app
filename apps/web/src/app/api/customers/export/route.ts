/**
 * GLAMO - Customer Export API Route Handler
 * GET: Export customers to CSV
 * 
 * @version 1.0.0
 * @description Exports customer data to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { createCustomerService } from '@/lib/services/customerService';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse query params for filters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | undefined,
      gender: searchParams.get('gender') as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
    };

    // Export to CSV
    const service = createCustomerService(tenantId);
    const csv = await service.exportToCSV(filters);

    // Return CSV with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
