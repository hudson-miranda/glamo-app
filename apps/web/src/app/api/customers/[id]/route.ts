/**
 * GLAMO - Single Customer API Route Handler
 * GET: Get customer by ID
 * PUT: Update customer
 * DELETE: Delete customer (soft delete)
 * 
 * @version 1.0.0
 * @description RESTful API for single customer operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { createCustomerService } from '@/lib/services/customerService';
import { customerUpdateSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET - GET CUSTOMER BY ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Check for include relations param
    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('include') === 'relations';

    // Get customer
    const service = createCustomerService(tenantId);
    const customer = await service.getById(id, includeRelations);

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - UPDATE CUSTOMER
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate
    const validatedData = customerUpdateSchema.parse(body);

    // Update customer
    const service = createCustomerService(tenantId);
    const customer = await service.update(id, validatedData);

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Cliente não encontrado') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (
        error.message.includes('Já existe') ||
        error.message.includes('email') ||
        error.message.includes('CPF')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - SOFT DELETE CUSTOMER
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Check for hard delete param (admin only)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Delete customer
    const service = createCustomerService(tenantId);
    
    if (hardDelete) {
      // TODO: Check admin permissions
      await service.hardDelete(id);
    } else {
      await service.delete(id);
    }

    return NextResponse.json(
      { message: 'Cliente excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting customer:', error);

    if (error instanceof Error) {
      if (error.message === 'Cliente não encontrado') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - PARTIAL UPDATE (Tags, Status, etc.)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Auth check
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { action, ...data } = body;

    const service = createCustomerService(tenantId);
    let customer;

    switch (action) {
      case 'addTag':
        if (!data.tag) {
          return NextResponse.json(
            { error: 'Tag é obrigatória' },
            { status: 400 }
          );
        }
        customer = await service.addTag(id, data.tag);
        break;

      case 'removeTag':
        if (!data.tag) {
          return NextResponse.json(
            { error: 'Tag é obrigatória' },
            { status: 400 }
          );
        }
        customer = await service.removeTag(id, data.tag);
        break;

      case 'updateAnamnesis':
        if (!data.anamnesis) {
          return NextResponse.json(
            { error: 'Dados de anamnese são obrigatórios' },
            { status: 400 }
          );
        }
        customer = await service.updateAnamnesis(id, data.anamnesis);
        break;

      case 'restore':
        customer = await service.restore(id);
        break;

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error patching customer:', error);

    if (error instanceof Error) {
      if (
        error.message === 'Cliente não encontrado' ||
        error.message.includes('não está excluído')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
