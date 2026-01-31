/**
 * GLAMO - Service Category Service
 * Business logic layer for service category operations
 * 
 * @version 2.0.0
 * @description Multi-tenant service category management aligned with Prisma schema
 * 
 * Prisma ServiceCategory model fields:
 * - id, tenantId, name, description, color, icon, sortOrder, isActive
 * - createdAt, updatedAt
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES - Aligned with Prisma schema
// ============================================================================

export interface ServiceCategory {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  services?: {
    id: string;
    name: string;
  }[];
  _count?: {
    services?: number;
  };
}

export interface ServiceCategoryFormData {
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ServiceCategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  includeServices?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceCategoryListResult {
  categories: ServiceCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceCategoryStats {
  total: number;
  active: number;
  inactive: number;
  withServices: number;
}

// Legacy type alias for backward compatibility
export type Category = ServiceCategory;
export type CategoryFormData = ServiceCategoryFormData;
export type CategoryListParams = ServiceCategoryListParams;
export type CategoryListResult = ServiceCategoryListResult;
export type CategoryStats = ServiceCategoryStats;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ServiceCategoryService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  async create(data: ServiceCategoryFormData): Promise<ServiceCategory> {
    // Check for duplicate name within tenant
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        tenantId: this.tenantId,
        name: { equals: data.name, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (existing) {
      throw new Error('Já existe uma categoria com este nome');
    }

    // Get max sort order
    const maxOrder = await prisma.serviceCategory.aggregate({
      where: { tenantId: this.tenantId },
      _max: { sortOrder: true },
    });

    const category = await prisma.serviceCategory.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description || null,
        color: data.color,
        icon: data.icon || null,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return this.mapToServiceCategory(category);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  async getById(id: string, options?: {
    includeServices?: boolean;
  }): Promise<ServiceCategory | null> {
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: true,
      },
      include: {
        services: options?.includeServices ? {
          where: { isActive: true },
          select: { id: true, name: true },
        } : false,
        _count: {
          select: { services: true },
        },
      },
    });

    if (!category) return null;

    return this.mapToServiceCategory(category);
  }

  async getByIdIncludingInactive(id: string): Promise<ServiceCategory | null> {
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!category) return null;

    return this.mapToServiceCategory(category);
  }

  async list(params: ServiceCategoryListParams = {}): Promise<ServiceCategoryListResult> {
    const {
      page = 1,
      limit = 50,
      search,
      isActive,
      includeServices = false,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = params;

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    // Default to active categories unless explicitly set
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.serviceCategory.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          services: includeServices ? {
            where: { isActive: true },
            select: { id: true, name: true },
          } : false,
          _count: {
            select: { services: true },
          },
        },
      }),
      prisma.serviceCategory.count({ where }),
    ]);

    return {
      categories: categories.map((c) => this.mapToServiceCategory(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAll(): Promise<ServiceCategory[]> {
    const categories = await prisma.serviceCategory.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return categories.map((c) => this.mapToServiceCategory(c));
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  async update(id: string, data: Partial<ServiceCategoryFormData>): Promise<ServiceCategory> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Categoria não encontrada');
    }

    // Check unique name
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.serviceCategory.findFirst({
        where: {
          tenantId: this.tenantId,
          name: { equals: data.name, mode: 'insensitive' },
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new Error('Já existe uma categoria com este nome');
      }
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return this.mapToServiceCategory(category);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Categoria não encontrada');
    }

    // Check if has services
    const serviceCount = await prisma.service.count({
      where: { categoryId: id, isActive: true },
    });

    if (serviceCount > 0) {
      throw new Error(`Não é possível excluir: categoria possui ${serviceCount} serviço(s) vinculado(s)`);
    }

    // Soft delete by setting isActive to false
    await prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.serviceCategory.delete({
      where: { id },
    });
  }

  async restore(id: string): Promise<ServiceCategory> {
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: false,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada ou já está ativa');
    }

    const restored = await prisma.serviceCategory.update({
      where: { id },
      data: { isActive: true },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return this.mapToServiceCategory(restored);
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  async bulkDelete(ids: string[]): Promise<number> {
    // Check if any category has services
    const categoriesWithServices = await prisma.serviceCategory.findMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      include: {
        _count: { select: { services: true } },
      },
    });

    const hasServices = categoriesWithServices.filter(c => c._count.services > 0);
    if (hasServices.length > 0) {
      throw new Error(`Não é possível excluir: ${hasServices.length} categoria(s) possui(em) serviços vinculados`);
    }

    const result = await prisma.serviceCategory.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive: false },
    });

    return result.count;
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await prisma.serviceCategory.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive },
    });

    return result.count;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      prisma.serviceCategory.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    );

    await prisma.$transaction(updates);
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  async getStats(): Promise<ServiceCategoryStats> {
    const [total, active, inactive, withServices] = await Promise.all([
      prisma.serviceCategory.count({
        where: { tenantId: this.tenantId },
      }),
      prisma.serviceCategory.count({
        where: { tenantId: this.tenantId, isActive: true },
      }),
      prisma.serviceCategory.count({
        where: { tenantId: this.tenantId, isActive: false },
      }),
      prisma.serviceCategory.count({
        where: {
          tenantId: this.tenantId,
          isActive: true,
          services: { some: { isActive: true } },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      withServices,
    };
  }

  // --------------------------------------------------------------------------
  // EXPORT
  // --------------------------------------------------------------------------

  async exportToCSV(): Promise<string> {
    const categories = await this.getAll();

    const headers = [
      'Nome',
      'Descrição',
      'Cor',
      'Ícone',
      'Ordem',
      'Status',
      'Qtd. Serviços',
      'Criado em',
    ];

    const rows = categories.map((cat) => [
      cat.name,
      cat.description || '',
      cat.color,
      cat.icon || '',
      cat.sortOrder.toString(),
      cat.isActive ? 'Ativo' : 'Inativo',
      (cat._count?.services || 0).toString(),
      new Date(cat.createdAt).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n');

    return csvContent;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private mapToServiceCategory(category: Record<string, unknown>): ServiceCategory {
    return {
      id: category.id as string,
      tenantId: category.tenantId as string,
      name: category.name as string,
      description: category.description as string | null,
      color: category.color as string,
      icon: category.icon as string | null,
      sortOrder: category.sortOrder as number,
      isActive: category.isActive as boolean,
      createdAt: category.createdAt as Date,
      updatedAt: category.updatedAt as Date,
      services: category.services as ServiceCategory['services'],
      _count: category._count as ServiceCategory['_count'],
    };
  }
}

// Legacy class alias for backward compatibility
export class CategoryService extends ServiceCategoryService {}

// ============================================================================
// TENANT SERVICE WRAPPER
// ============================================================================

export class TenantCategoryService {
  private service: ServiceCategoryService;

  constructor(tenantId: string) {
    this.service = new ServiceCategoryService(tenantId);
  }

  // Expose all ServiceCategoryService methods
  create(data: ServiceCategoryFormData) { return this.service.create(data); }
  getById(id: string, options?: { includeServices?: boolean }) { return this.service.getById(id, options); }
  list(params?: ServiceCategoryListParams) { return this.service.list(params); }
  getAll() { return this.service.getAll(); }
  update(id: string, data: Partial<ServiceCategoryFormData>) { return this.service.update(id, data); }
  delete(id: string) { return this.service.delete(id); }
  hardDelete(id: string) { return this.service.hardDelete(id); }
  restore(id: string) { return this.service.restore(id); }
  bulkDelete(ids: string[]) { return this.service.bulkDelete(ids); }
  bulkUpdateStatus(ids: string[], isActive: boolean) { return this.service.bulkUpdateStatus(ids, isActive); }
  reorder(orderedIds: string[]) { return this.service.reorder(orderedIds); }
  getStats() { return this.service.getStats(); }
  exportToCSV() { return this.service.exportToCSV(); }
}

// ============================================================================
// FACTORY FUNCTION - For API routes
// ============================================================================

export function createCategoryService(tenantId: string): TenantCategoryService {
  return new TenantCategoryService(tenantId);
}

export function createServiceCategoryService(tenantId: string): TenantCategoryService {
  return new TenantCategoryService(tenantId);
}
