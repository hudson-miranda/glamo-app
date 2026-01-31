/**
 * GLAMO - Professionals Bulk Operations API Route
 * POST: Execute bulk actions on professionals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate']),
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids } = bulkActionSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    let affected: number;

    switch (action) {
      case 'delete':
        affected = await service.bulkDelete(ids);
        break;
      case 'activate':
        affected = await service.bulkUpdateStatus(ids, true);
        break;
      case 'deactivate':
        affected = await service.bulkUpdateStatus(ids, false);
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      requested: ids.length,
      affected,
    });
  } catch (error) {
    console.error('Error executing bulk action:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
