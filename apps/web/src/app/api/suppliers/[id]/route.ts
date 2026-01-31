/**
 * GLAMO - Supplier Detail API Routes
 * GET /api/suppliers/[id] - Get supplier details
 * PUT /api/suppliers/[id] - Update supplier
 * DELETE /api/suppliers/[id] - Delete supplier
 * PATCH /api/suppliers/[id] - Partial update (status actions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { SupplierService, updateSupplierSchema } from '@/lib/services/supplierService';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/suppliers/[id]
 * Get supplier details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const service = new SupplierService(tenantId);
    const supplier = await service.getById(params.id);

    if (!supplier) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao buscar fornecedor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/suppliers/[id]
 * Full update supplier
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateSupplierSchema.parse(body);

    const service = new SupplierService(tenantId);
    const supplier = await service.update(params.id, validated);

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: 'Not Found', message: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Já existe')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Soft delete supplier
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const service = new SupplierService(tenantId);
    await service.delete(params.id);

    return NextResponse.json({ success: true, message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting supplier:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: 'Not Found', message: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('produtos vinculados')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao excluir fornecedor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/suppliers/[id]
 * Partial update - status actions
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const service = new SupplierService(tenantId);

    let supplier;

    switch (body.action) {
      case 'activate':
        supplier = await service.activate(params.id);
        break;
      case 'deactivate':
        supplier = await service.deactivate(params.id);
        break;
      case 'block':
        supplier = await service.block(params.id);
        break;
      case 'updateRating':
        if (typeof body.rating !== 'number') {
          return NextResponse.json(
            { error: 'Validation Error', message: 'Avaliação inválida' },
            { status: 400 }
          );
        }
        supplier = await service.updateRating(params.id, body.rating);
        break;
      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Ação inválida' },
          { status: 400 }
        );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error patching supplier:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: 'Not Found', message: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    );
  }
}
