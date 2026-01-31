/**
 * GLAMO - Product Service
 * Business logic layer for product management
 * 
 * @version 2.0.0
 * @description Multi-tenant product management aligned with Prisma schema
 * 
 * Prisma Product model fields:
 * - id, tenantId, categoryId, supplierId, name, description, sku, barcode
 * - brand, unit, costPrice, salePrice, commissionRate
 * - stockQuantity, minStock, maxStock, imageUrl, sortOrder
 * - isActive, sellOnline, createdAt, updatedAt
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES - Aligned with Prisma schema
// ============================================================================

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  supplierId: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  commissionRate: number | null;
  stockQuantity: number;
  minStock: number;
  maxStock: number | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  sellOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  category?: {
    id: string;
    name: string;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    stockMovements?: number;
  };
}

export interface ProductFormData {
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  unit?: string;
  costPrice: number;
  salePrice: number;
  categoryId?: string | null;
  supplierId?: string | null;
  commissionRate?: number | null;
  stockQuantity?: number;
  minStock?: number;
  maxStock?: number | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  sellOnline?: boolean;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  totalValue: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ProductService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  async create(data: ProductFormData): Promise<Product> {
    // Check for duplicate SKU
    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId: this.tenantId,
          sku: data.sku,
          isActive: true,
        },
      });

      if (existing) {
        throw new Error('Já existe um produto com este SKU');
      }
    }

    const product = await prisma.product.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        brand: data.brand || null,
        unit: data.unit || 'un',
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        categoryId: data.categoryId || null,
        supplierId: data.supplierId || null,
        commissionRate: data.commissionRate || null,
        stockQuantity: data.stockQuantity ?? 0,
        minStock: data.minStock ?? 0,
        maxStock: data.maxStock || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        sellOnline: data.sellOnline ?? false,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return this.mapToProduct(product);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  async getById(id: string): Promise<Product | null> {
    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!product) return null;

    return this.mapToProduct(product);
  }

  async list(params: ProductListParams = {}): Promise<ProductListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      supplierId,
      isActive,
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc',
    } = params;

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (lowStock) {
      where.stockQuantity = { lte: prisma.product.fields.minStock };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.mapToProduct(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  async update(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Produto não encontrado');
    }

    if (data.sku && data.sku !== existing.sku) {
      const duplicate = await prisma.product.findFirst({
        where: {
          tenantId: this.tenantId,
          sku: data.sku,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new Error('Já existe um produto com este SKU');
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        brand: data.brand,
        unit: data.unit,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        commissionRate: data.commissionRate,
        stockQuantity: data.stockQuantity,
        minStock: data.minStock,
        maxStock: data.maxStock,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        sellOnline: data.sellOnline,
        updatedAt: new Date(),
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return this.mapToProduct(product);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Produto não encontrado');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  async getStats(): Promise<ProductStats> {
    const [total, active, inactive, lowStockProducts, valueStats] = await Promise.all([
      prisma.product.count({ where: { tenantId: this.tenantId } }),
      prisma.product.count({ where: { tenantId: this.tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId: this.tenantId, isActive: false } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products 
        WHERE tenant_id = ${this.tenantId}::uuid 
        AND is_active = true 
        AND stock_quantity <= min_stock
      `,
      prisma.product.aggregate({
        where: { tenantId: this.tenantId, isActive: true },
        _sum: { stockQuantity: true, salePrice: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      lowStock: Number(lowStockProducts[0]?.count) || 0,
      totalValue: Number(valueStats._sum.salePrice) || 0,
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private mapToProduct(product: Record<string, unknown>): Product {
    return {
      id: product.id as string,
      tenantId: product.tenantId as string,
      categoryId: product.categoryId as string | null,
      supplierId: product.supplierId as string | null,
      name: product.name as string,
      description: product.description as string | null,
      sku: product.sku as string | null,
      barcode: product.barcode as string | null,
      brand: product.brand as string | null,
      unit: product.unit as string,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      commissionRate: product.commissionRate ? Number(product.commissionRate) : null,
      stockQuantity: product.stockQuantity as number,
      minStock: product.minStock as number,
      maxStock: product.maxStock as number | null,
      imageUrl: product.imageUrl as string | null,
      sortOrder: product.sortOrder as number,
      isActive: product.isActive as boolean,
      sellOnline: product.sellOnline as boolean,
      createdAt: product.createdAt as Date,
      updatedAt: product.updatedAt as Date,
      category: product.category as Product['category'],
      supplier: product.supplier as Product['supplier'],
      _count: product._count as Product['_count'],
    };
  }
}

// ============================================================================
// FACTORY FUNCTION - For API routes
// ============================================================================

export function createProductService(tenantId: string): ProductService {
  return new ProductService(tenantId);
}
