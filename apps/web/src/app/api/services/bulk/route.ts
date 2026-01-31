/**
 * GLAMO - Services Bulk Operations API
 * Bulk delete, activate, deactivate, update category
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate', 'updateCategory']),
  ids: z.array(z.string().uuid()).min(1, 'Pelo menos um ID é obrigatório'),
  categoryId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ids, categoryId } = bulkOperationSchema.parse(body);

    const serviceService = new ServiceService(tenantId);
    let affectedCount = 0;

    switch (action) {
      case 'delete':
        affectedCount = await serviceService.bulkDelete(ids);
        break;

      case 'activate':
        affectedCount = await serviceService.bulkUpdateStatus(ids, 'ACTIVE');
        break;

      case 'deactivate':
        affectedCount = await serviceService.bulkUpdateStatus(ids, 'INACTIVE');
        break;

      case 'updateCategory':
        affectedCount = await serviceService.bulkUpdateCategory(ids, categoryId || null);
        break;
    }

    return NextResponse.json({
      success: true,
      affectedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
