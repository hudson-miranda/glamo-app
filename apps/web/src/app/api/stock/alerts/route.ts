/**
 * GLAMO - Stock Alerts API
 * GET /api/stock/alerts - Get stock alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiTenantId } from '@/lib/auth';
import { StockMovementService } from '@/lib/services/stockMovementService';

// GET /api/stock/alerts - Get stock alerts
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getApiTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const service = new StockMovementService(tenantId);
    const alerts = await service.getAlerts();

    return NextResponse.json({
      alerts,
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
    });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
