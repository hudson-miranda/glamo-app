/**
 * GLAMO - Service Service
 * Business logic layer for service operations
 * 
 * @version 2.0.0
 * @description Multi-tenant service management aligned with Prisma schema
 * 
 * Prisma Service model fields:
 * - id, tenantId, categoryId, name, description, durationMinutes, price
 * - commissionRate, allowOnline, requiresDeposit, depositAmount, depositPercentage
 * - parallelQuantity, imageUrl, sortOrder, isActive, isFeatured
 * - createdAt, updatedAt
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES - Aligned with Prisma schema
// ============================================================================

export interface Service {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  commissionRate: number | null;
  allowOnline: boolean;
  requiresDeposit: boolean;
  depositAmount: number | null;
  depositPercentage: number | null;
  parallelQuantity: number;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  category?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  professionals?: {
    id: string;
    name: string;
  }[];
  _count?: {
    appointmentServices?: number;
  };
}

export interface ServiceFormData {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  categoryId?: string | null;
  commissionRate?: number | null;
  allowOnline?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number | null;
  depositPercentage?: number | null;
  parallelQuantity?: number;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  professionalIds?: string[];
}

export interface ServiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  professionalId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCategory?: boolean;
  includeProfessionals?: boolean;
}

export interface ServiceListResult {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  averagePrice: number;
  averageDuration: number;
  byCategory: { categoryId: string; categoryName: string; count: number }[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ServiceService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  async create(data: ServiceFormData): Promise<Service> {
    // Validate unique name within tenant
    const existing = await prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        name: data.name,
        isActive: true,
      },
    });

    if (existing) {
      throw new Error('Já existe um serviço com este nome');
    }

    // Validate category exists
    if (data.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: data.categoryId,
          tenantId: this.tenantId,
          isActive: true,
        },
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }
    }

    const service = await prisma.service.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description || null,
        durationMinutes: data.durationMinutes,
        price: data.price,
        categoryId: data.categoryId || null,
        commissionRate: data.commissionRate || null,
        allowOnline: data.allowOnline ?? true,
        requiresDeposit: data.requiresDeposit ?? false,
        depositAmount: data.depositAmount || null,
        depositPercentage: data.depositPercentage || null,
        parallelQuantity: data.parallelQuantity ?? 1,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      },
      include: {
        category: true,
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    });

    // Assign professionals if provided
    if (data.professionalIds && data.professionalIds.length > 0) {
      await prisma.serviceProfessional.createMany({
        data: data.professionalIds.map((professionalId) => ({
          serviceId: service.id,
          professionalId,
        })),
      });
    }

    return this.mapToService(service);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  async getById(id: string, options?: {
    includeCategory?: boolean;
    includeProfessionals?: boolean;
  }): Promise<Service | null> {
    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: true,
      },
      include: {
        category: options?.includeCategory ?? true,
        professionals: options?.includeProfessionals ? {
          include: {
            professional: true,
          },
        } : false,
      },
    });

    if (!service) return null;

    return this.mapToService(service);
  }

  async getByIdIncludingInactive(id: string): Promise<Service | null> {
    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        category: true,
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    });

    if (!service) return null;

    return this.mapToService(service);
  }

  async list(params: ServiceListParams = {}): Promise<ServiceListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      isActive,
      isFeatured,
      professionalId,
      sortBy = 'name',
      sortOrder = 'asc',
      includeCategory = true,
      includeProfessionals = false,
    } = params;

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    // Default to active services unless explicitly set
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

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // Professional filter
    if (professionalId) {
      where.professionals = {
        some: {
          professionalId,
        },
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: includeCategory,
          professionals: includeProfessionals ? {
            include: {
              professional: true,
            },
          } : false,
          _count: {
            select: {
              appointmentServices: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services: services.map((s) => this.mapToService(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: string, limit = 10): Promise<Pick<Service, 'id' | 'name' | 'durationMinutes' | 'price'>[]> {
    const services = await prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return services.map(s => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
    }));
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  async update(id: string, data: Partial<ServiceFormData>): Promise<Service> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Serviço não encontrado');
    }

    // Check unique name
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.service.findFirst({
        where: {
          tenantId: this.tenantId,
          name: data.name,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new Error('Já existe um serviço com este nome');
      }
    }

    // Validate category
    if (data.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: data.categoryId,
          tenantId: this.tenantId,
          isActive: true,
        },
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: data.price,
        categoryId: data.categoryId,
        commissionRate: data.commissionRate,
        allowOnline: data.allowOnline,
        requiresDeposit: data.requiresDeposit,
        depositAmount: data.depositAmount,
        depositPercentage: data.depositPercentage,
        parallelQuantity: data.parallelQuantity,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    });

    // Update professionals if provided
    if (data.professionalIds !== undefined) {
      // Remove existing
      await prisma.serviceProfessional.deleteMany({
        where: { serviceId: id },
      });

      // Add new
      if (data.professionalIds.length > 0) {
        await prisma.serviceProfessional.createMany({
          data: data.professionalIds.map((professionalId) => ({
            serviceId: id,
            professionalId,
          })),
        });
      }
    }

    return this.mapToService(service);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Serviço não encontrado');
    }

    // Soft delete by setting isActive to false
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<void> {
    // Remove professional relations
    await prisma.serviceProfessional.deleteMany({
      where: { serviceId: id },
    });

    await prisma.service.delete({
      where: { id },
    });
  }

  async restore(id: string): Promise<Service> {
    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: false,
      },
    });

    if (!service) {
      throw new Error('Serviço não encontrado ou já está ativo');
    }

    const restored = await prisma.service.update({
      where: { id },
      data: { isActive: true },
      include: {
        category: true,
      },
    });

    return this.mapToService(restored);
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await prisma.service.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive: false },
    });

    return result.count;
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await prisma.service.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive },
    });

    return result.count;
  }

  async bulkUpdateCategory(ids: string[], categoryId: string | null): Promise<number> {
    // Validate category
    if (categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: categoryId,
          tenantId: this.tenantId,
          isActive: true,
        },
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }
    }

    const result = await prisma.service.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
        isActive: true,
      },
      data: { categoryId },
    });

    return result.count;
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  async getStats(): Promise<ServiceStats> {
    const [
      total,
      active,
      inactive,
      featured,
      priceStats,
      durationStats,
      byCategory,
    ] = await Promise.all([
      prisma.service.count({
        where: { tenantId: this.tenantId },
      }),
      prisma.service.count({
        where: { tenantId: this.tenantId, isActive: true },
      }),
      prisma.service.count({
        where: { tenantId: this.tenantId, isActive: false },
      }),
      prisma.service.count({
        where: { tenantId: this.tenantId, isActive: true, isFeatured: true },
      }),
      prisma.service.aggregate({
        where: { tenantId: this.tenantId, isActive: true },
        _avg: { price: true },
      }),
      prisma.service.aggregate({
        where: { tenantId: this.tenantId, isActive: true },
        _avg: { durationMinutes: true },
      }),
      prisma.service.groupBy({
        by: ['categoryId'],
        where: { tenantId: this.tenantId, isActive: true },
        _count: { _all: true },
      }),
    ]);

    // Get category names
    const categoryIds = byCategory
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null);

    const categories = categoryIds.length > 0 
      ? await prisma.serviceCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      total,
      active,
      inactive,
      featured,
      averagePrice: Number(priceStats._avg.price) || 0,
      averageDuration: durationStats._avg.durationMinutes || 0,
      byCategory: byCategory.map((c) => ({
        categoryId: c.categoryId || 'uncategorized',
        categoryName: c.categoryId ? categoryMap.get(c.categoryId) || 'Desconhecida' : 'Sem categoria',
        count: c._count._all,
      })),
    };
  }

  // --------------------------------------------------------------------------
  // PROFESSIONAL MANAGEMENT
  // --------------------------------------------------------------------------

  async assignProfessional(serviceId: string, professionalId: string): Promise<void> {
    // Check if already assigned
    const existing = await prisma.serviceProfessional.findUnique({
      where: {
        serviceId_professionalId: {
          serviceId,
          professionalId,
        },
      },
    });

    if (existing) {
      throw new Error('Profissional já está atribuído a este serviço');
    }

    await prisma.serviceProfessional.create({
      data: {
        serviceId,
        professionalId,
      },
    });
  }

  async removeProfessional(serviceId: string, professionalId: string): Promise<void> {
    await prisma.serviceProfessional.delete({
      where: {
        serviceId_professionalId: {
          serviceId,
          professionalId,
        },
      },
    });
  }

  async getProfessionals(serviceId: string): Promise<{ id: string; name: string }[]> {
    const relations = await prisma.serviceProfessional.findMany({
      where: { serviceId },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return relations.map((r) => ({
      id: r.professional.id,
      name: r.professional.name,
    }));
  }

  // --------------------------------------------------------------------------
  // EXPORT
  // --------------------------------------------------------------------------

  async exportToCSV(params: ServiceListParams = {}): Promise<string> {
    const { services } = await this.list({ ...params, limit: 10000 });

    const headers = [
      'Nome',
      'Descrição',
      'Duração (min)',
      'Preço',
      'Categoria',
      'Status',
      'Agendamento Online',
      'Destaque',
      'Criado em',
    ];

    const rows = services.map((service) => [
      service.name,
      service.description || '',
      service.durationMinutes.toString(),
      service.price.toFixed(2).replace('.', ','),
      service.category?.name || '',
      service.isActive ? 'Ativo' : 'Inativo',
      service.allowOnline ? 'Sim' : 'Não',
      service.isFeatured ? 'Sim' : 'Não',
      new Date(service.createdAt).toLocaleDateString('pt-BR'),
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

  private mapToService(service: Record<string, unknown>): Service {
    const professionals = service.professionals as { professional: { id: string; name: string } }[] | undefined;
    
    return {
      id: service.id as string,
      tenantId: service.tenantId as string,
      categoryId: service.categoryId as string | null,
      name: service.name as string,
      description: service.description as string | null,
      durationMinutes: service.durationMinutes as number,
      price: Number(service.price),
      commissionRate: service.commissionRate ? Number(service.commissionRate) : null,
      allowOnline: service.allowOnline as boolean,
      requiresDeposit: service.requiresDeposit as boolean,
      depositAmount: service.depositAmount ? Number(service.depositAmount) : null,
      depositPercentage: service.depositPercentage ? Number(service.depositPercentage) : null,
      parallelQuantity: service.parallelQuantity as number,
      imageUrl: service.imageUrl as string | null,
      sortOrder: service.sortOrder as number,
      isActive: service.isActive as boolean,
      isFeatured: service.isFeatured as boolean,
      createdAt: service.createdAt as Date,
      updatedAt: service.updatedAt as Date,
      category: service.category as Service['category'],
      professionals: professionals?.map((p) => p.professional),
      _count: service._count as Service['_count'],
    };
  }
}

// ============================================================================
// TENANT SERVICE WRAPPER
// ============================================================================

export class TenantServiceService {
  private service: ServiceService;

  constructor(tenantId: string) {
    this.service = new ServiceService(tenantId);
  }

  // Expose all ServiceService methods
  create(data: ServiceFormData) { return this.service.create(data); }
  getById(id: string, options?: { includeCategory?: boolean; includeProfessionals?: boolean }) { 
    return this.service.getById(id, options); 
  }
  list(params?: ServiceListParams) { return this.service.list(params); }
  search(query: string, limit?: number) { return this.service.search(query, limit); }
  update(id: string, data: Partial<ServiceFormData>) { return this.service.update(id, data); }
  delete(id: string) { return this.service.delete(id); }
  hardDelete(id: string) { return this.service.hardDelete(id); }
  restore(id: string) { return this.service.restore(id); }
  bulkDelete(ids: string[]) { return this.service.bulkDelete(ids); }
  bulkUpdateStatus(ids: string[], isActive: boolean) { return this.service.bulkUpdateStatus(ids, isActive); }
  bulkUpdateCategory(ids: string[], categoryId: string | null) { return this.service.bulkUpdateCategory(ids, categoryId); }
  getStats() { return this.service.getStats(); }
  assignProfessional(serviceId: string, professionalId: string) { return this.service.assignProfessional(serviceId, professionalId); }
  removeProfessional(serviceId: string, professionalId: string) { return this.service.removeProfessional(serviceId, professionalId); }
  getProfessionals(serviceId: string) { return this.service.getProfessionals(serviceId); }
  exportToCSV(params?: ServiceListParams) { return this.service.exportToCSV(params); }
}

// ============================================================================
// FACTORY FUNCTION - For API routes
// ============================================================================

export function createServiceService(tenantId: string): TenantServiceService {
  return new TenantServiceService(tenantId);
}
