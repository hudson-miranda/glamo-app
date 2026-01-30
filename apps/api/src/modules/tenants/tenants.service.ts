import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, TenantPlan, TenantStatus, UserRole } from '@prisma/client';

export interface CreateTenantDto {
  name: string;
  businessType: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  // Address
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Operating hours
  operatingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
}

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique slug from tenant name
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const uniqueSuffix = Date.now().toString(36);
    return `${baseSlug}-${uniqueSuffix}`;
  }

  /**
   * Create a new tenant and assign the user as owner
   */
  async create(userId: string, dto: CreateTenantDto) {
    // Check if user already owns a tenant
    const existingUserWithTenant = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, role: true },
    });

    if (existingUserWithTenant?.tenantId && existingUserWithTenant?.role === UserRole.OWNER) {
      throw new ConflictException('Você já possui um estabelecimento cadastrado');
    }

    const slug = this.generateSlug(dto.name);

    // Build settings JSON with business type, social media and operating hours
    const settings = {
      businessType: dto.businessType,
      socialMedia: {
        instagram: dto.instagram,
        facebook: dto.facebook,
        whatsapp: dto.whatsapp,
      },
      operatingHours: dto.operatingHours,
    };

    // Create tenant with transaction
    const tenant = await this.prisma.$transaction(async (tx) => {
      // Create the tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
          plan: TenantPlan.FREE,
          status: TenantStatus.TRIAL,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          phone: dto.phone,
          email: dto.email,
          website: dto.website,
          // Address
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          // Settings as JSON (includes businessType, socialMedia, operatingHours)
          settings: settings as Prisma.InputJsonValue,
        },
      });

      // Update user to be owner of this tenant
      await tx.user.update({
        where: { id: userId },
        data: {
          tenantId: newTenant.id,
          role: UserRole.OWNER,
        },
      });

      return newTenant;
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
    };
  }

  /**
   * Get tenant by ID
   */
  async findById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return tenant;
  }

  /**
   * Get tenant by slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return tenant;
  }

  /**
   * Get tenants where user works (as employee)
   */
  async findUserTenants(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            settings: true,
          },
        },
      },
    });

    // TODO: When we implement multiple tenants per user,
    // we'll need to query a UserTenant join table instead
    return user?.tenant ? [user.tenant] : [];
  }

  /**
   * Update tenant
   */
  async update(tenantId: string, userId: string, dto: Partial<CreateTenantDto>) {
    // Check if user has permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, role: true },
    });

    if (user?.tenantId !== tenantId || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Você não tem permissão para editar este estabelecimento');
    }

    // Get current tenant to merge settings
    const currentTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = (currentTenant?.settings as Record<string, unknown>) || {};

    const updateData: Prisma.TenantUpdateInput = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email) updateData.email = dto.email;
    if (dto.website) updateData.website = dto.website;
    if (dto.street) updateData.street = dto.street;
    if (dto.number) updateData.number = dto.number;
    if (dto.complement) updateData.complement = dto.complement;
    if (dto.neighborhood) updateData.neighborhood = dto.neighborhood;
    if (dto.city) updateData.city = dto.city;
    if (dto.state) updateData.state = dto.state;
    if (dto.zipCode) updateData.zipCode = dto.zipCode;

    // Update settings JSON
    const newSettings = { ...currentSettings };
    if (dto.businessType) newSettings.businessType = dto.businessType;
    if (dto.operatingHours) newSettings.operatingHours = dto.operatingHours;
    if (dto.instagram || dto.facebook || dto.whatsapp) {
      newSettings.socialMedia = {
        instagram: dto.instagram,
        facebook: dto.facebook,
        whatsapp: dto.whatsapp,
      };
    }
    updateData.settings = newSettings as Prisma.InputJsonValue;

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return tenant;
  }
}
