/**
 * GLAMO - Professional Availability API Route
 * GET: Get available time slots for a professional
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { ProfessionalService } from '@/lib/services/professionalService';
import { z } from 'zod';

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().uuid().optional(),
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
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { date, serviceId } = querySchema.parse(searchParams);

    const service = new ProfessionalService(tenantId);
    const availability = await service.getAvailability(id, new Date(date), serviceId);

    return NextResponse.json({
      date,
      professionalId: id,
      serviceId: serviceId || null,
      slots: availability,
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
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
