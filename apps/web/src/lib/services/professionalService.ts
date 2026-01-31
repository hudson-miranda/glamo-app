/**
 * GLAMO - Professional Service
 * Business logic layer for professional management
 * 
 * @version 2.0.0
 * @description Multi-tenant professional management aligned with Prisma schema
 * 
 * Prisma Professional model fields:
 * - id, tenantId, userId, unitId, name, email, phone, avatarUrl
 * - specialties, bio, commissionRate, calendarColor, workingHours
 * - isActive, sortOrder, createdAt, updatedAt
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES - Aligned with Prisma schema
// ============================================================================

export interface Professional {
  id: string;
  tenantId: string;
  userId: string | null;
  unitId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  specialties: string[];
  bio: string | null;
  commissionRate: number;
  calendarColor: string | null;
  workingHours: WorkingHours | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  services?: {
    id: string;
    name: string;
  }[];
  _count?: {
    services?: number;
    appointments?: number;
  };
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  breakStart?: string;
  breakEnd?: string;
}

export interface ProfessionalFormData {
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  specialties?: string[];
  bio?: string | null;
  commissionRate?: number;
  calendarColor?: string | null;
  workingHours?: WorkingHours | null;
  unitId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  serviceIds?: string[];
}

export interface ProfessionalListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  unitId?: string;
  serviceId?: string;
  includeServices?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProfessionalListResult {
  professionals: Professional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProfessionalStats {
  total: number;
  active: number;
  inactive: number;
  withServices: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ProfessionalService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  async create(data: ProfessionalFormData): Promise<Professional> {
    // Check for duplicate email within tenant
    if (data.email) {
      const existing = await prisma.professional.findFirst({
        where: {
          tenantId: this.tenantId,
          email: data.email,
          isActive: true,
        },
      });

      if (existing) {
        throw new Error('Já existe um profissional com este email');
      }
    }

    // Get max sort order
    const maxOrder = await prisma.professional.aggregate({
      where: { tenantId: this.tenantId },
      _max: { sortOrder: true },
    });

    const professional = await prisma.professional.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        avatarUrl: data.avatarUrl || null,
        specialties: data.specialties || [],
        bio: data.bio || null,
        commissionRate: data.commissionRate ?? 0,
        calendarColor: data.calendarColor || null,
        workingHours: data.workingHours as object || null,
        unitId: data.unitId || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
      },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    // Assign services if provided
    if (data.serviceIds && data.serviceIds.length > 0) {
      await prisma.serviceProfessional.createMany({
        data: data.serviceIds.map((serviceId) => ({
          serviceId,
          professionalId: professional.id,
        })),
      });
    }

    return this.mapToProfessional(professional);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  async getById(id: string, options?: {
    includeServices?: boolean;
  }): Promise<Professional | null> {
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: true,
      },
      include: {
        services: options?.includeServices ? {
          include: {
            service: { select: { id: true, name: true } },
          },
        } : false,
        _count: {
          select: { services: true },
        },
      },
    });

    if (!professional) return null;

    return this.mapToProfessional(professional);
  }

  async getByIdIncludingInactive(id: string): Promise<Professional | null> {
    const professional = await prisma.professional.findFirst({
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

    if (!professional) return null;

    return this.mapToProfessional(professional);
  }

  async list(params: ProfessionalListParams = {}): Promise<ProfessionalListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      unitId,
      serviceId,
      includeServices = false,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = params;

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    // Default to active professionals unless explicitly set
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Unit filter
    if (unitId) {
      where.unitId = unitId;
    }

    // Service filter
    if (serviceId) {
      where.services = {
        some: { serviceId },
      };
    }

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          services: includeServices ? {
            include: {
              service: { select: { id: true, name: true } },
            },
          } : false,
          _count: {
            select: { services: true },
          },
        },
      }),
      prisma.professional.count({ where }),
    ]);

    return {
      professionals: professionals.map((p) => this.mapToProfessional(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAll(): Promise<Professional[]> {
    const professionals = await prisma.professional.findMany({
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

    return professionals.map((p) => this.mapToProfessional(p));
  }

  async search(query: string, limit = 10): Promise<Pick<Professional, 'id' | 'name' | 'avatarUrl'>[]> {
    const professionals = await prisma.professional.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return professionals;
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  async update(id: string, data: Partial<ProfessionalFormData>): Promise<Professional> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Profissional não encontrado');
    }

    // Check unique email
    if (data.email && data.email !== existing.email) {
      const duplicate = await prisma.professional.findFirst({
        where: {
          tenantId: this.tenantId,
          email: data.email,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new Error('Já existe um profissional com este email');
      }
    }

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        specialties: data.specialties,
        bio: data.bio,
        commissionRate: data.commissionRate,
        calendarColor: data.calendarColor,
        workingHours: data.workingHours as object,
        unitId: data.unitId,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    // Update services if provided
    if (data.serviceIds !== undefined) {
      // Remove existing
      await prisma.serviceProfessional.deleteMany({
        where: { professionalId: id },
      });

      // Add new
      if (data.serviceIds.length > 0) {
        await prisma.serviceProfessional.createMany({
          data: data.serviceIds.map((serviceId) => ({
            serviceId,
            professionalId: id,
          })),
        });
      }
    }

    return this.mapToProfessional(professional);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const existing = await this.getByIdIncludingInactive(id);
    if (!existing) {
      throw new Error('Profissional não encontrado');
    }

    // Soft delete by setting isActive to false
    await prisma.professional.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<void> {
    // Remove service relations
    await prisma.serviceProfessional.deleteMany({
      where: { professionalId: id },
    });

    await prisma.professional.delete({
      where: { id },
    });
  }

  async restore(id: string): Promise<Professional> {
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: false,
      },
    });

    if (!professional) {
      throw new Error('Profissional não encontrado ou já está ativo');
    }

    const restored = await prisma.professional.update({
      where: { id },
      data: { isActive: true },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return this.mapToProfessional(restored);
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await prisma.professional.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive: false },
    });

    return result.count;
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await prisma.professional.updateMany({
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
      prisma.professional.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    );

    await prisma.$transaction(updates);
  }

  // --------------------------------------------------------------------------
  // SERVICE MANAGEMENT
  // --------------------------------------------------------------------------

  async assignService(professionalId: string, serviceId: string): Promise<void> {
    const existing = await prisma.serviceProfessional.findUnique({
      where: {
        serviceId_professionalId: {
          serviceId,
          professionalId,
        },
      },
    });

    if (existing) {
      throw new Error('Serviço já está atribuído a este profissional');
    }

    await prisma.serviceProfessional.create({
      data: {
        serviceId,
        professionalId,
      },
    });
  }

  async removeService(professionalId: string, serviceId: string): Promise<void> {
    await prisma.serviceProfessional.delete({
      where: {
        serviceId_professionalId: {
          serviceId,
          professionalId,
        },
      },
    });
  }

  async getServices(professionalId: string): Promise<{ id: string; name: string }[]> {
    const relations = await prisma.serviceProfessional.findMany({
      where: { professionalId },
      include: {
        service: {
          select: { id: true, name: true },
        },
      },
    });

    return relations.map((r) => ({
      id: r.service.id,
      name: r.service.name,
    }));
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  async getStats(): Promise<ProfessionalStats> {
    const [total, active, inactive, withServices] = await Promise.all([
      prisma.professional.count({
        where: { tenantId: this.tenantId },
      }),
      prisma.professional.count({
        where: { tenantId: this.tenantId, isActive: true },
      }),
      prisma.professional.count({
        where: { tenantId: this.tenantId, isActive: false },
      }),
      prisma.professional.count({
        where: {
          tenantId: this.tenantId,
          isActive: true,
          services: { some: {} },
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
    const professionals = await this.getAll();

    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'Especialidades',
      'Taxa de Comissão',
      'Status',
      'Qtd. Serviços',
      'Criado em',
    ];

    const rows = professionals.map((prof) => [
      prof.name,
      prof.email || '',
      prof.phone || '',
      prof.specialties.join(', '),
      `${prof.commissionRate}%`,
      prof.isActive ? 'Ativo' : 'Inativo',
      (prof._count?.services || 0).toString(),
      new Date(prof.createdAt).toLocaleDateString('pt-BR'),
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

  private mapToProfessional(professional: Record<string, unknown>): Professional {
    const services = professional.services as { service: { id: string; name: string } }[] | undefined;
    
    return {
      id: professional.id as string,
      tenantId: professional.tenantId as string,
      userId: professional.userId as string | null,
      unitId: professional.unitId as string | null,
      name: professional.name as string,
      email: professional.email as string | null,
      phone: professional.phone as string | null,
      avatarUrl: professional.avatarUrl as string | null,
      specialties: professional.specialties as string[] || [],
      bio: professional.bio as string | null,
      commissionRate: Number(professional.commissionRate) || 0,
      calendarColor: professional.calendarColor as string | null,
      workingHours: professional.workingHours as WorkingHours | null,
      isActive: professional.isActive as boolean,
      sortOrder: professional.sortOrder as number,
      createdAt: professional.createdAt as Date,
      updatedAt: professional.updatedAt as Date,
      services: services?.map((s) => s.service),
      _count: professional._count as Professional['_count'],
    };
  }
}

// ============================================================================
// TENANT SERVICE WRAPPER
// ============================================================================

export class TenantProfessionalService {
  private service: ProfessionalService;

  constructor(tenantId: string) {
    this.service = new ProfessionalService(tenantId);
  }

  // Expose all ProfessionalService methods
  create(data: ProfessionalFormData) { return this.service.create(data); }
  getById(id: string, options?: { includeServices?: boolean }) { return this.service.getById(id, options); }
  list(params?: ProfessionalListParams) { return this.service.list(params); }
  getAll() { return this.service.getAll(); }
  search(query: string, limit?: number) { return this.service.search(query, limit); }
  update(id: string, data: Partial<ProfessionalFormData>) { return this.service.update(id, data); }
  delete(id: string) { return this.service.delete(id); }
  hardDelete(id: string) { return this.service.hardDelete(id); }
  restore(id: string) { return this.service.restore(id); }
  bulkDelete(ids: string[]) { return this.service.bulkDelete(ids); }
  bulkUpdateStatus(ids: string[], isActive: boolean) { return this.service.bulkUpdateStatus(ids, isActive); }
  reorder(orderedIds: string[]) { return this.service.reorder(orderedIds); }
  assignService(professionalId: string, serviceId: string) { return this.service.assignService(professionalId, serviceId); }
  removeService(professionalId: string, serviceId: string) { return this.service.removeService(professionalId, serviceId); }
  getServices(professionalId: string) { return this.service.getServices(professionalId); }
  getStats() { return this.service.getStats(); }
  exportToCSV() { return this.service.exportToCSV(); }
}

// ============================================================================
// FACTORY FUNCTION - For API routes
// ============================================================================

export function createProfessionalService(tenantId: string): TenantProfessionalService {
  return new TenantProfessionalService(tenantId);
}
