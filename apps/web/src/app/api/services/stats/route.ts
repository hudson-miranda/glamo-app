/**
 * GLAMO - Services Statistics API
 * Aggregated statistics for services
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const serviceService = new ServiceService(tenantId);
    const stats = await serviceService.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting service stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
