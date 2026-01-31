/**
 * GLAMO - Professional by ID API Route
 * GET: Get single professional
 * PUT: Update professional
 * DELETE: Soft delete professional
 * PATCH: Special actions (activate, deactivate, restore)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

// Update professional schema
const updateProfessionalSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  documentType: z.enum(['CPF', 'CNPJ']).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  specialties: z.array(z.string()).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isActive: z.boolean().optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED', 'NONE']).optional(),
  commissionValue: z.number().min(0).optional().nullable(),
  workSchedule: z.object({
    monday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    tuesday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    wednesday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    thursday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    friday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    saturday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
    sunday: z.object({
      isWorking: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
    }).optional(),
  }).optional(),
  services: z.array(z.string().uuid()).optional(),
});

// Patch action schema
const patchActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'restore']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const includeServices = request.nextUrl.searchParams.get('includeServices') === 'true';

    const service = new ProfessionalService(tenantId);
    const professional = await service.getById(id, { includeServices });

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error getting professional:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateProfessionalSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    const professional = await service.update(id, data);

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error updating professional:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === 'Profissional não encontrado') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Já existe')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const service = new ProfessionalService(tenantId);
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting professional:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Profissional não encontrado') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('agendamento')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = patchActionSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    let professional;

    switch (action) {
      case 'activate':
        professional = await service.update(id, { isActive: true });
        break;
      case 'deactivate':
        professional = await service.update(id, { isActive: false });
        break;
      case 'restore':
        professional = await service.restore(id);
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error patching professional:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
