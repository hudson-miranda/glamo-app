/**
 * GLAMO - Suppliers Bulk Operations API Route
 * POST /api/suppliers/bulk - Bulk operations on suppliers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService } from '@/lib/services/supplierService';
import { z } from 'zod';

const bulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete']),
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um fornecedor'),
});

/**
 * POST /api/suppliers/bulk
 * Bulk operations on suppliers
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, ids } = bulkOperationSchema.parse(body);

    const service = new SupplierService(tenantId);

    let count: number;
    let message: string;

    switch (operation) {
      case 'activate':
        count = await service.bulkActivate(ids);
        message = `${count} fornecedor(es) ativado(s) com sucesso`;
        break;
      case 'deactivate':
        count = await service.bulkDeactivate(ids);
        message = `${count} fornecedor(es) desativado(s) com sucesso`;
        break;
      case 'delete':
        count = await service.bulkDelete(ids);
        message = `${count} fornecedor(es) excluído(s) com sucesso`;
        break;
      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Operação inválida' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, count, message });
  } catch (error) {
    console.error('Error in bulk operation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Não é possível')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro na operação em massa' },
      { status: 500 }
    );
  }
}
