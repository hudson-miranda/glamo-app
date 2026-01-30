import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServicesRepository } from './repositories';
import { PricingService } from './services/pricing.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
  CreateServiceDto,
  UpdateServiceDto,
  ReorderServicesDto,
  DuplicateServiceDto,
  BulkUpdateServicesDto,
  AddProfessionalToServiceDto,
  ServiceQueryDto,
  CategoryQueryDto,
  CalculatePriceDto,
} from './dto';
import { ServiceType, ServiceStatus } from './interfaces';

@Injectable()
export class ServicesService {
  private readonly _logger = new Logger(ServicesService.name);

  constructor(
    private readonly repository: ServicesRepository,
    private readonly pricingService: PricingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // CATEGORIES
  // ========================

  async createCategory(dto: CreateCategoryDto): Promise<any> {
    // Verificar slug único
    const slug = this.generateSlug(dto.name);
    const existing = await this.repository.findCategoryBySlug(slug);
    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    // Verificar categoria pai se informada
    if (dto.parentId) {
      const parent = await this.repository.findCategoryById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Categoria pai não encontrada');
      }
    }

    const category = await this.repository.createCategory({
      ...dto,
      slug,
    } as any);

    this.eventEmitter.emit('service-category.created', { category });

    return category;
  }

  async findCategoryById(id: string): Promise<any> {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  async findCategories(query: CategoryQueryDto = {}): Promise<any[]> {
    return this.repository.findCategories(query);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<any> {
    await this.findCategoryById(id);

    if (dto.name) {
      const slug = this.generateSlug(dto.name);
      const existing = await this.repository.findCategoryBySlug(slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
      (dto as any).slug = slug;
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Categoria não pode ser pai de si mesma');
      }
      const parent = await this.repository.findCategoryById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Categoria pai não encontrada');
      }
    }

    const category = await this.repository.updateCategory(id, dto as any);

    this.eventEmitter.emit('service-category.updated', { category });

    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);

    // Verificar se tem serviços
    if (category._count?.services > 0) {
      throw new BadRequestException(
        'Categoria possui serviços vinculados. Mova ou delete os serviços primeiro.',
      );
    }

    // Verificar se tem subcategorias
    if (category.children?.length > 0) {
      throw new BadRequestException(
        'Categoria possui subcategorias. Delete as subcategorias primeiro.',
      );
    }

    await this.repository.deleteCategory(id);

    this.eventEmitter.emit('service-category.deleted', { categoryId: id });
  }

  async reorderCategories(dto: ReorderCategoriesDto): Promise<void> {
    await this.repository.reorderCategories(dto.categoryIds);
  }

  // ========================
  // SERVICES
  // ========================

  async create(dto: CreateServiceDto): Promise<any> {
    // Verificar categoria
    await this.findCategoryById(dto.categoryId);

    // Validações específicas por tipo
    if (dto.type === ServiceType.COMBO && (!dto.comboItems || dto.comboItems.length < 2)) {
      throw new BadRequestException('Combo deve ter pelo menos 2 serviços');
    }

    if (dto.type === ServiceType.PACKAGE && !dto.packageConfig) {
      throw new BadRequestException('Pacote deve ter configuração de sessões');
    }

    const service = await this.repository.create({
      ...dto,
      status: dto.status || ServiceStatus.ACTIVE,
    });

    this.eventEmitter.emit('service.created', { service });

    return service;
  }

  async findById(id: string): Promise<any> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return service;
  }

  async findBySlug(slug: string): Promise<any> {
    const service = await this.repository.findBySlug(slug);
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return service;
  }

  async findMany(query: ServiceQueryDto) {
    return this.repository.findMany(query);
  }

  async findByCategory(categoryId: string): Promise<any[]> {
    await this.findCategoryById(categoryId);
    return this.repository.findByCategory(categoryId);
  }

  async findByProfessional(professionalId: string): Promise<any[]> {
    return this.repository.findByProfessional(professionalId);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<any> {
    const existing = await this.findById(id);

    // Verificar categoria se mudou
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      await this.findCategoryById(dto.categoryId);
    }

    const service = await this.repository.update(id, dto);

    this.eventEmitter.emit('service.updated', { service, changes: dto });

    return service;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id);

    this.eventEmitter.emit('service.deleted', { serviceId: id });
  }

  async restore(id: string): Promise<any> {
    const service = await this.repository.restore(id);
    return service;
  }

  async duplicate(id: string, dto: DuplicateServiceDto = {}): Promise<any> {
    const original = await this.findById(id);

    const duplicateData = {
      ...original,
      id: undefined,
      name: dto.name || `${original.name} (Cópia)`,
      categoryId: dto.categoryId || original.categoryId,
      status: ServiceStatus.DRAFT,
      totalBookings: 0,
      averageRating: 0,
      totalReviews: 0,
      createdAt: undefined,
      updatedAt: undefined,
    };

    delete duplicateData.id;
    delete duplicateData.slug;
    delete duplicateData.category;
    delete duplicateData.professionals;

    const duplicated = await this.repository.create(duplicateData);

    return duplicated;
  }

  async reorderServices(dto: ReorderServicesDto): Promise<void> {
    await this.repository.reorderServices(dto.serviceIds, dto.categoryId);
  }

  async bulkUpdate(dto: BulkUpdateServicesDto): Promise<{
    total: number;
    success: number;
    failed: number;
    errors: { serviceId: string; error: string }[];
  }> {
    const results = {
      total: dto.serviceIds.length,
      success: 0,
      failed: 0,
      errors: [] as { serviceId: string; error: string }[],
    };

    for (const serviceId of dto.serviceIds) {
      try {
        const service = await this.findById(serviceId);
        const updateData: any = {};

        if (dto.categoryId) {
          updateData.categoryId = dto.categoryId;
        }

        if (dto.priceAdjustmentPercentage) {
          updateData.price = service.price * (1 + dto.priceAdjustmentPercentage / 100);
        } else if (dto.priceAdjustmentFixed) {
          updateData.price = service.price + dto.priceAdjustmentFixed;
        }

        if (dto.durationAdjustment) {
          updateData.duration = Math.max(5, service.duration + dto.durationAdjustment);
        }

        if (Object.keys(updateData).length > 0) {
          await this.repository.update(serviceId, updateData);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          serviceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  // ========================
  // PROFESSIONALS
  // ========================

  async addProfessional(serviceId: string, dto: AddProfessionalToServiceDto): Promise<void> {
    await this.findById(serviceId);
    await this.repository.addProfessional(serviceId, dto.professionalId);

    // Se tem preço específico, adicionar
    if (dto.price !== undefined || dto.duration !== undefined) {
      const service = await this.findById(serviceId);
      const professionalPrices = [...(service.professionalPrices || [])];
      
      const existingIndex = professionalPrices.findIndex(
        (pp) => pp.professionalId === dto.professionalId,
      );

      if (existingIndex >= 0) {
        professionalPrices[existingIndex] = {
          ...professionalPrices[existingIndex],
          price: dto.price ?? professionalPrices[existingIndex].price,
          duration: dto.duration ?? professionalPrices[existingIndex].duration,
        };
      } else {
        professionalPrices.push({
          professionalId: dto.professionalId,
          price: dto.price ?? service.price,
          duration: dto.duration,
        });
      }

      await this.repository.update(serviceId, { professionalPrices });
    }
  }

  async removeProfessional(serviceId: string, professionalId: string): Promise<void> {
    await this.findById(serviceId);
    await this.repository.removeProfessional(serviceId, professionalId);

    // Remover preço específico
    const service = await this.findById(serviceId);
    if (service.professionalPrices?.length) {
      const professionalPrices = service.professionalPrices.filter(
        (pp: { professionalId: string }) => pp.professionalId !== professionalId,
      );
      await this.repository.update(serviceId, { professionalPrices });
    }
  }

  // ========================
  // PRICING
  // ========================

  async calculatePrice(id: string, dto: CalculatePriceDto = {}) {
    const service = await this.findById(id);
    return this.pricingService.calculatePrice(service, dto);
  }

  async calculateDuration(id: string, dto: { optionId?: string; professionalId?: string } = {}) {
    const service = await this.findById(id);
    return this.pricingService.calculateDuration(service, dto);
  }

  // ========================
  // LISTINGS
  // ========================

  async getPopularServices(limit: number = 10): Promise<any[]> {
    return this.repository.getPopularServices(limit);
  }

  async getFeaturedServices(): Promise<any[]> {
    return this.repository.getFeaturedServices();
  }

  async getStats() {
    return this.repository.getStats();
  }

  // ========================
  // HELPERS
  // ========================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
