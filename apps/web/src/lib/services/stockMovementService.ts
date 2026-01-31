/**
 * GLAMO - Stock Movement Service
 * Enterprise-grade stock movement management
 * Production-ready SaaS implementation
 * 
 * Aligned with Prisma schema:
 * - stock_movements: id, tenant_id, product_id, type, quantity, unit_cost, reason, reference_id, reference_type, created_by, created_at
 * - products: stock_quantity (not currentStock), min_stock, max_stock
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma as PrismaNamespace } from '@glamo/database';

// Define StockMovementType enum based on database schema
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'LOSS';

type Prisma = typeof PrismaNamespace;

// ============================================================================
// Types & Interfaces
// ============================================================================

export { StockMovementType };

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number | null;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdBy: string | null;
  createdAt: Date;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    imageUrl: string | null;
    stockQuantity: number;
    minStock: number;
    maxStock: number | null;
  };
}

export interface StockAlert {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    minStock: number;
    maxStock: number | null;
    unit: string;
  };
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  severity: 'warning' | 'critical';
  message: string;
  createdAt: Date;
}

export interface StockSummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  movementsToday: number;
  movementsThisWeek: number;
  movementsThisMonth: number;
}

export interface MovementFilters {
  search?: string;
  productId?: string;
  type?: StockMovementType | StockMovementType[];
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const stockMovementSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'LOSS'] as const),
  quantity: z.number().int().positive('Quantidade deve ser um inteiro positivo'),
  unitCost: z.number().min(0, 'Custo unitário não pode ser negativo').optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
});

export const batchMovementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'LOSS'] as const),
  reason: z.string().max(200).optional().nullable(),
  items: z.array(z.object({
    productId: z.string().uuid('ID do produto inválido'),
    quantity: z.number().int().positive('Quantidade deve ser maior que zero'),
    unitCost: z.number().min(0).optional().nullable(),
  })).min(1, 'Pelo menos um item é necessário'),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  newQuantity: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  reason: z.string().max(200).optional().nullable(),
});

export const movementFiltersSchema = z.object({
  search: z.string().optional(),
  productId: z.string().uuid().optional(),
  type: z.union([
    z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'LOSS'] as const),
    z.array(z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'LOSS'] as const)),
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'quantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Stock Movement Service
// ============================================================================

export class StockMovementService {
  private tenantId: string;

  constructor(tenantId: string) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // Create Movement
  // --------------------------------------------------------------------------

  async createMovement(
    data: z.infer<typeof stockMovementSchema>,
    userId?: string
  ): Promise<StockMovement> {
    // Get current product stock
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        tenantId: this.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const currentStock = product.stockQuantity;
    let newStock: number;

    // Calculate new quantity based on movement type
    switch (data.type) {
      case 'IN':
        newStock = currentStock + data.quantity;
        break;
      case 'OUT':
      case 'LOSS':
        newStock = currentStock - data.quantity;
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
        }
        break;
      case 'RETURN':
        // RETURN type decreases stock (returned to supplier)
        newStock = currentStock - data.quantity;
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
        }
        break;
      case 'ADJUSTMENT':
        // Adjustment quantity can be positive or negative
        newStock = currentStock + data.quantity;
        if (newStock < 0) {
          throw new Error('O ajuste resultaria em estoque negativo');
        }
        break;
      case 'TRANSFER':
        // Transfer out decreases stock
        newStock = currentStock - data.quantity;
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
        }
        break;
      default:
        throw new Error('Tipo de movimentação inválido');
    }

    // Create movement and update stock in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          tenantId: this.tenantId,
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost,
          reason: data.reason,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          createdBy: userId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              imageUrl: true,
              stockQuantity: true,
              minStock: true,
              maxStock: true,
            },
          },
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { stockQuantity: newStock },
      });

      return movement;
    });

    return this.formatMovement(result);
  }

  // --------------------------------------------------------------------------
  // Batch Movement
  // --------------------------------------------------------------------------

  async createBatchMovement(
    data: z.infer<typeof batchMovementSchema>,
    userId?: string
  ): Promise<{ movements: StockMovement[]; failed: { productId: string; error: string }[] }> {
    const movements: StockMovement[] = [];
    const failed: { productId: string; error: string }[] = [];

    for (const item of data.items) {
      try {
        const movement = await this.createMovement(
          {
            productId: item.productId,
            type: data.type,
            quantity: item.quantity,
            unitCost: item.unitCost,
            reason: data.reason,
          },
          userId
        );
        movements.push(movement);
      } catch (error) {
        failed.push({
          productId: item.productId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return { movements, failed };
  }

  // --------------------------------------------------------------------------
  // Inventory Adjustment
  // --------------------------------------------------------------------------

  async adjustInventory(
    data: z.infer<typeof inventoryAdjustmentSchema>,
    userId?: string
  ): Promise<StockMovement> {
    // Get current product stock
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        tenantId: this.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const currentStock = product.stockQuantity;
    const difference = data.newQuantity - currentStock;

    if (difference === 0) {
      throw new Error('A nova quantidade é igual à quantidade atual');
    }

    // Create adjustment movement
    const movement = await this.createMovement(
      {
        productId: data.productId,
        type: 'ADJUSTMENT',
        quantity: difference, // Can be positive or negative
        reason: data.reason || `Ajuste de ${currentStock} para ${data.newQuantity}`,
      },
      userId
    );

    return movement;
  }

  // --------------------------------------------------------------------------
  // List Movements
  // --------------------------------------------------------------------------

  async list(filters: MovementFilters = {}): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      productId,
      type,
      startDate,
      endDate,
      createdBy,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.StockMovementWhereInput = {
      tenantId: this.tenantId,
    };

    // Filter by product
    if (productId) {
      where.productId = productId;
    }

    // Filter by type
    if (type) {
      where.type = Array.isArray(type) ? { in: type } : type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Filter by creator
    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Search in product name or reason
    if (search) {
      where.OR = [
        {
          product: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          product: {
            sku: { contains: search, mode: 'insensitive' },
          },
        },
        {
          reason: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              imageUrl: true,
              stockQuantity: true,
              minStock: true,
              maxStock: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map(this.formatMovement),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // --------------------------------------------------------------------------
  // Get Movement by ID
  // --------------------------------------------------------------------------

  async getById(id: string): Promise<StockMovement | null> {
    const movement = await prisma.stockMovement.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            imageUrl: true,
            stockQuantity: true,
            minStock: true,
            maxStock: true,
          },
        },
      },
    });

    return movement ? this.formatMovement(movement) : null;
  }

  // --------------------------------------------------------------------------
  // Get Product Movement History
  // --------------------------------------------------------------------------

  async getProductHistory(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, startDate, endDate } = options;

    const where: Prisma.StockMovementWhereInput = {
      tenantId: this.tenantId,
      productId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              imageUrl: true,
              stockQuantity: true,
              minStock: true,
              maxStock: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map(this.formatMovement),
      total,
      page,
      limit,
    };
  }

  // --------------------------------------------------------------------------
  // Get Stock Alerts
  // --------------------------------------------------------------------------

  async getAlerts(): Promise<StockAlert[]> {
    // Get products with zero stock
    const outOfStockProducts = await prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        stockQuantity: { lte: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStock: true,
        maxStock: true,
        unit: true,
      },
    });

    // Get products with low stock (below min_stock but above 0)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        stockQuantity: { gt: 0 },
        minStock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStock: true,
        maxStock: true,
        unit: true,
      },
    });

    const alerts: StockAlert[] = [];

    // Add out of stock alerts
    for (const product of outOfStockProducts) {
      alerts.push({
        id: `${product.id}-out`,
        productId: product.id,
        product,
        type: 'OUT_OF_STOCK',
        severity: 'critical',
        message: `${product.name} está sem estoque`,
        createdAt: new Date(),
      });
    }

    // Add low stock alerts
    for (const product of lowStockProducts) {
      if (product.minStock && product.stockQuantity <= product.minStock) {
        alerts.push({
          id: `${product.id}-low`,
          productId: product.id,
          product,
          type: 'LOW_STOCK',
          severity: product.stockQuantity <= product.minStock / 2 ? 'critical' : 'warning',
          message: `${product.name} está com estoque baixo (${product.stockQuantity} ${product.unit})`,
          createdAt: new Date(),
        });
      }
    }

    // Check overstock
    const overstockProducts = await prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        maxStock: { not: null },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStock: true,
        maxStock: true,
        unit: true,
      },
    });

    for (const product of overstockProducts) {
      if (product.maxStock && product.stockQuantity >= product.maxStock) {
        alerts.push({
          id: `${product.id}-over`,
          productId: product.id,
          product,
          type: 'OVERSTOCK',
          severity: 'warning',
          message: `${product.name} está acima do estoque máximo (${product.stockQuantity}/${product.maxStock})`,
          createdAt: new Date(),
        });
      }
    }

    // Sort by severity (critical first)
    return alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return 0;
    });
  }

  // --------------------------------------------------------------------------
  // Get Stock Summary
  // --------------------------------------------------------------------------

  async getSummary(): Promise<StockSummary> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      productStats,
      movementsToday,
      movementsThisWeek,
      movementsThisMonth,
    ] = await Promise.all([
      prisma.product.aggregate({
        where: {
          tenantId: this.tenantId,
          isActive: true,
        },
        _count: { id: true },
      }),
      prisma.stockMovement.count({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.stockMovement.count({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.stockMovement.count({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    // Get products with stock issues
    const products = await prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
      },
      select: {
        stockQuantity: true,
        minStock: true,
        maxStock: true,
        costPrice: true,
      },
    });

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overstockCount = 0;

    for (const product of products) {
      // Calculate total value
      if (product.costPrice) {
        totalValue += Number(product.costPrice) * product.stockQuantity;
      }

      // Count stock issues
      if (product.stockQuantity <= 0) {
        outOfStockCount++;
      } else if (product.minStock && product.stockQuantity <= product.minStock) {
        lowStockCount++;
      }

      if (product.maxStock && product.stockQuantity >= product.maxStock) {
        overstockCount++;
      }
    }

    return {
      totalProducts: productStats._count.id,
      totalValue,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      movementsToday,
      movementsThisWeek,
      movementsThisMonth,
    };
  }

  // --------------------------------------------------------------------------
  // Get Movement Report
  // --------------------------------------------------------------------------

  async getReport(options: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
    type?: StockMovementType[];
  }): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalIn: number;
      totalOut: number;
      netChange: number;
      totalValue: number;
    };
    byType: { type: string; count: number; quantity: number; value: number }[];
    byProduct: { productId: string; productName: string; movements: number; netChange: number }[];
    timeline: { date: string; in: number; out: number }[];
  }> {
    const { startDate, endDate, type } = options;

    const where: Prisma.StockMovementWhereInput = {
      tenantId: this.tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate summary
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    const byTypeMap = new Map<string, { count: number; quantity: number; value: number }>();
    const byProductMap = new Map<string, { productName: string; movements: number; netChange: number }>();
    const timelineMap = new Map<string, { in: number; out: number }>();

    for (const movement of movements) {
      const isIncoming = movement.type === 'IN';
      const unitCost = movement.unitCost ? Number(movement.unitCost) : 0;
      const movementValue = unitCost * movement.quantity;

      // Summary
      if (isIncoming) {
        totalIn += movement.quantity;
      } else {
        totalOut += movement.quantity;
      }
      totalValue += movementValue;

      // By type
      const typeData = byTypeMap.get(movement.type) || { count: 0, quantity: 0, value: 0 };
      typeData.count++;
      typeData.quantity += movement.quantity;
      typeData.value += movementValue;
      byTypeMap.set(movement.type, typeData);

      // By product
      const productData = byProductMap.get(movement.productId) || {
        productName: movement.product.name,
        movements: 0,
        netChange: 0,
      };
      productData.movements++;
      productData.netChange += isIncoming ? movement.quantity : -movement.quantity;
      byProductMap.set(movement.productId, productData);

      // Timeline
      const dateKey = movement.createdAt.toISOString().split('T')[0];
      const timelineData = timelineMap.get(dateKey) || { in: 0, out: 0 };
      if (isIncoming) {
        timelineData.in += movement.quantity;
      } else {
        timelineData.out += movement.quantity;
      }
      timelineMap.set(dateKey, timelineData);
    }

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalIn,
        totalOut,
        netChange: totalIn - totalOut,
        totalValue,
      },
      byType: Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
      byProduct: Array.from(byProductMap.entries()).map(([productId, data]) => ({
        productId,
        ...data,
      })),
      timeline: Array.from(timelineMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // --------------------------------------------------------------------------
  // Export Movements to CSV
  // --------------------------------------------------------------------------

  async exportToCsv(filters: MovementFilters = {}): Promise<string> {
    const { data: movements } = await this.list({ ...filters, limit: 10000 });

    const headers = [
      'Data',
      'Produto',
      'SKU',
      'Tipo',
      'Quantidade',
      'Custo Unit.',
      'Motivo',
    ];

    const rows = movements.map((m) => [
      m.createdAt.toLocaleString('pt-BR'),
      m.product?.name || '',
      m.product?.sku || '',
      getMovementTypeLabel(m.type),
      m.quantity.toString(),
      m.unitCost ? m.unitCost.toFixed(2) : '',
      m.reason || '',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n');

    return csvContent;
  }

  // --------------------------------------------------------------------------
  // Helper: Format Movement
  // --------------------------------------------------------------------------

  private formatMovement(movement: any): StockMovement {
    return {
      id: movement.id,
      tenantId: movement.tenantId,
      productId: movement.productId,
      type: movement.type as StockMovementType,
      quantity: movement.quantity,
      unitCost: movement.unitCost ? Number(movement.unitCost) : null,
      reason: movement.reason,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      createdBy: movement.createdBy,
      createdAt: movement.createdAt,
      product: movement.product ? {
        id: movement.product.id,
        name: movement.product.name,
        sku: movement.product.sku,
        unit: movement.product.unit,
        imageUrl: movement.product.imageUrl,
        stockQuantity: movement.product.stockQuantity,
        minStock: movement.product.minStock,
        maxStock: movement.product.maxStock,
      } : undefined,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getMovementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    IN: 'Entrada',
    OUT: 'Saída',
    ADJUSTMENT: 'Ajuste',
    TRANSFER: 'Transferência',
    RETURN: 'Devolução',
    LOSS: 'Perda',
  };
  return labels[type] || type;
}

export function getMovementTypeVariant(type: StockMovementType): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<StockMovementType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    IN: 'default',
    OUT: 'destructive',
    ADJUSTMENT: 'secondary',
    TRANSFER: 'outline',
    RETURN: 'secondary',
    LOSS: 'destructive',
  };
  return variants[type] || 'outline';
}

export function getMovementIcon(type: StockMovementType): string {
  const icons: Record<StockMovementType, string> = {
    IN: 'arrow-down',
    OUT: 'arrow-up',
    ADJUSTMENT: 'settings',
    TRANSFER: 'arrows-horizontal',
    RETURN: 'rotate-ccw',
    LOSS: 'alert-triangle',
  };
  return icons[type] || 'box';
}

export function isIncomingMovement(type: StockMovementType): boolean {
  return type === 'IN';
}

export function formatQuantityChange(type: StockMovementType, quantity: number): string {
  const isIncoming = isIncomingMovement(type);
  const sign = isIncoming ? '+' : '-';
  return `${sign}${quantity}`;
}

// ============================================================================
// Factory Function
// ============================================================================

export function createStockMovementService(tenantId: string): StockMovementService {
  return new StockMovementService(tenantId);
}
