/**
 * GLAMO - Professionals Statistics API Route
 * GET: Get aggregated statistics for professionals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const service = new ProfessionalService(tenantId);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting professional stats:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
