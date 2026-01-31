/**
 * GLAMO - Customer Search API Route Handler
 * GET: Search customers for autocomplete/select
 * 
 * @version 1.0.0
 * @description Lightweight search endpoint for customer selection
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Search customers
    const service = createCustomerService(tenantId);
    const customers = await service.search(query, limit);

    // Return simplified data for selection
    const data = customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
