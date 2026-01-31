/**
 * GLAMO - Customer Statistics API Route Handler
 * GET: Get customer statistics
 * 
 * @version 1.0.0
 * @description Returns aggregated statistics for customers
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

    // Get statistics
    const service = createCustomerService(tenantId);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
