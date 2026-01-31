/**
 * GLAMO - Professional Services Management API Route
 * POST: Add services to professional
 * DELETE: Remove services from professional
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

const servicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { serviceIds } = servicesSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    const professional = await service.addServices(id, serviceIds);

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error adding services to professional:', error);
    
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
    const body = await request.json();
    const { serviceIds } = servicesSchema.parse(body);

    const service = new ProfessionalService(tenantId);
    const professional = await service.removeServices(id, serviceIds);

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error removing services from professional:', error);
    
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
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
