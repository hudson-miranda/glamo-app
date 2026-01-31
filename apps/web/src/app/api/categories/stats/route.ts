/**
 * GLAMO - Categories Stats API Route
 * GET: Get category statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { CategoryService } from '@/lib/services/categoryService';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const service = new CategoryService(tenantId);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
