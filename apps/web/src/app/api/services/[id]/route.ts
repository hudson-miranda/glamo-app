/**
 * GLAMO - Service Detail API Routes
 * GET - Get service by ID
 * PUT - Update service
 * DELETE - Soft delete service
 * PATCH - Partial updates (status, professionals)
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiTenantId } from '@/lib/auth';
import { ServiceService } from '@/lib/services/serviceService';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  duration: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  promotionalPrice: z.number().nonnegative().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  segment: z.enum(['BELEZA', 'ESTETICA', 'SAUDE', 'BEM_ESTAR', 'TATUAGEM_PIERCING', 'PET', 'SERVICOS_GERAIS']).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  requiresConfirmation: z.boolean().optional(),
  allowOnlineBooking: z.boolean().optional(),
  maxAdvanceBookingDays: z.number().int().positive().optional(),
  minAdvanceBookingMinutes: z.number().int().nonnegative().optional(),
  bufferTimeBefore: z.number().int().nonnegative().optional(),
  bufferTimeAfter: z.number().int().nonnegative().optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  commissionValue: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  professionalIds: z.array(z.string().uuid()).optional(),
});

const patchServiceSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'restore', 'assignProfessional', 'removeProfessional']),
  professionalId: z.string().uuid().optional(),
});

// ============================================================================
// GET - Get Service by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeCategory = searchParams.get('includeCategory') !== 'false';
    const includeProfessionals = searchParams.get('includeProfessionals') === 'true';

    const serviceService = new ServiceService(tenantId);
    const service = await serviceService.getById(params.id, {
      includeCategory,
      includeProfessionals,
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error getting service:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Service
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateServiceSchema.parse(body);

    const serviceService = new ServiceService(tenantId);
    const service = await serviceService.update(params.id, validatedData);

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Já existe')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Soft Delete Service
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const serviceService = new ServiceService(tenantId);

    if (hardDelete) {
      // TODO: Add role check when needed
      await serviceService.hardDelete(params.id);
    } else {
      await serviceService.delete(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Partial Updates
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await getApiTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, professionalId } = patchServiceSchema.parse(body);

    const serviceService = new ServiceService(tenantId);

    switch (action) {
      case 'activate':
        await serviceService.update(params.id, { status: 'ACTIVE' });
        break;

      case 'deactivate':
        await serviceService.update(params.id, { status: 'INACTIVE' });
        break;

      case 'restore':
        await serviceService.restore(params.id);
        break;

      case 'assignProfessional':
        if (!professionalId) {
          return NextResponse.json(
            { error: 'ID do profissional é obrigatório' },
            { status: 400 }
          );
        }
        await serviceService.assignProfessional(params.id, professionalId);
        break;

      case 'removeProfessional':
        if (!professionalId) {
          return NextResponse.json(
            { error: 'ID do profissional é obrigatório' },
            { status: 400 }
          );
        }
        await serviceService.removeProfessional(params.id, professionalId);
        break;
    }

    const service = await serviceService.getById(params.id);
    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('já está atribuído')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    console.error('Error patching service:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
