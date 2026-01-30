import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomersRepository, PaginatedCustomers } from './repositories';
import {
  CustomerAnalyticsService,
  CustomerSegmentationService,
  CustomerMergeService,
  CustomerImportService,
} from './services';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  UpdateCustomerTagsDto,
  AddLoyaltyPointsDto,
  AddCustomerNoteDto,
  ImportOptionsDto,
  CreateSegmentDto,
  UpdateSegmentDto,
  MergeCustomersDto,
  FindDuplicatesDto,
  BulkUpdateDto,
  BulkAddTagsDto,
  BulkRemoveTagsDto,
  BulkDeleteDto,
  BulkOperationResultDto,
} from './dto';
import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerDeletedEvent,
  CustomerLoyaltyPointsAddedEvent,
  CustomerLoyaltyTierChangedEvent,
} from './events';
import {
  CustomerAnalytics,
  CustomerTimelineItem,
  CustomerMetrics,
  LoyaltyTier,
  getTierByPoints,
} from './interfaces';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { PrismaService } from '@/core/database/prisma.service';
import { differenceInDays } from 'date-fns';

/**
 * Serviço principal de clientes
 */
@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly repository: CustomersRepository,
    private readonly analyticsService: CustomerAnalyticsService,
    private readonly segmentationService: CustomerSegmentationService,
    private readonly mergeService: CustomerMergeService,
    private readonly importService: CustomerImportService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== CRUD ====================

  /**
   * Cria um novo cliente
   */
  async create(dto: CreateCustomerDto, createdBy?: string): Promise<any> {
    // Verificar duplicados por telefone
    const existingByPhone = await this.repository.findByPhone(dto.phone);
    if (existingByPhone) {
      throw new ConflictException('Já existe um cliente com este telefone');
    }

    // Verificar duplicado por email se fornecido
    if (dto.email) {
      const existingByEmail = await this.repository.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException('Já existe um cliente com este email');
      }
    }

    // Verificar duplicado por CPF se fornecido
    if (dto.cpf) {
      const normalizedCpf = dto.cpf.replace(/\D/g, '');
      const existingByCpf = await this.repository.findByCpf(normalizedCpf);
      if (existingByCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    // Normalizar dados
    const customerData = this.normalizeCustomerData(dto);

    // Criar cliente
    const customer = await this.repository.create(customerData);

    // Emitir evento
    this.eventEmitter.emit(
      'customer.created',
      new CustomerCreatedEvent(
        {
          id: customer.id,
          tenantId: customer.tenantId,
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
          tags: customer.tags as string[],
        },
        'MANUAL',
        createdBy,
        dto.referredBy,
      ),
    );

    // Avaliar segmentos
    await this.segmentationService.evaluateCustomerSegments(customer.id);

    return customer;
  }

  /**
   * Busca cliente por ID
   */
  async findById(id: string): Promise<any> {
    const customer = await this.repository.findById(id);

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  /**
   * Busca clientes com filtros e paginação
   */
  async findMany(query: CustomerQueryDto): Promise<PaginatedCustomers<any>> {
    return this.repository.findMany(query);
  }

  /**
   * Atualiza cliente
   */
  async update(id: string, dto: UpdateCustomerDto, updatedBy?: string): Promise<any> {
    const existing = await this.findById(id);

    // Verificar duplicados se alterar campos únicos
    if (dto.email && dto.email !== existing.email) {
      const existingByEmail = await this.repository.findByEmail(dto.email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    if (dto.phone && dto.phone !== existing.phone) {
      const existingByPhone = await this.repository.findByPhone(dto.phone);
      if (existingByPhone && existingByPhone.id !== id) {
        throw new ConflictException('Telefone já está em uso por outro cliente');
      }
    }

    // Identificar campos alterados
    const changedFields = this.identifyChangedFields(existing, dto);

    // Normalizar dados
    const updateData = this.normalizeCustomerData(dto);

    // Atualizar
    const customer = await this.repository.updateAndReturn(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    // Emitir evento se houve alterações
    if (changedFields.length > 0) {
      this.eventEmitter.emit(
        'customer.updated',
        new CustomerUpdatedEvent(
          {
            id: customer.id,
            tenantId: customer.tenantId,
            name: customer.name,
            email: customer.email || undefined,
            phone: customer.phone,
            tags: customer.tags as string[],
          },
          changedFields,
          updatedBy,
        ),
      );
    }

    // Re-avaliar segmentos
    await this.segmentationService.evaluateCustomerSegments(id);

    return customer;
  }

  /**
   * Soft delete de cliente
   */
  async delete(id: string, deletedBy?: string, reason?: string): Promise<void> {
    const customer = await this.findById(id);

    await this.repository.softDelete(id);

    this.eventEmitter.emit(
      'customer.deleted',
      new CustomerDeletedEvent(
        {
          id: customer.id,
          tenantId: customer.tenantId,
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
          tags: customer.tags as string[],
        },
        deletedBy,
        reason,
      ),
    );
  }

  // ==================== TAGS ====================

  /**
   * Atualiza tags do cliente
   */
  async updateTags(id: string, dto: UpdateCustomerTagsDto): Promise<any> {
    const customer = await this.findById(id);

    if (dto.addTags && dto.addTags.length > 0) {
      await this.repository.addTags(id, dto.addTags);
    }

    if (dto.removeTags && dto.removeTags.length > 0) {
      await this.repository.removeTags(id, dto.removeTags);
    }

    return this.findById(id);
  }

  // ==================== FIDELIDADE ====================

  /**
   * Adiciona pontos de fidelidade
   */
  async addLoyaltyPoints(id: string, dto: AddLoyaltyPointsDto): Promise<any> {
    const customer = await this.findById(id);
    const previousPoints = customer.loyaltyPoints || 0;
    const newPoints = previousPoints + dto.points;
    const previousTier = getTierByPoints(previousPoints);
    const newTier = getTierByPoints(newPoints);

    // Atualizar pontos
    await this.repository.addLoyaltyPoints(id, dto.points);

    // Registrar transação
    await this.prisma.loyaltyTransaction.create({
      data: {
        customerId: id,
        type: dto.points >= 0 ? 'EARN' : 'REDEEM',
        points: dto.points,
        balanceAfter: newPoints,
        description: dto.description,
        referenceId: dto.referenceId,
      },
    });

    // Emitir evento de pontos adicionados
    this.eventEmitter.emit(
      'customer.loyalty.points_added',
      new CustomerLoyaltyPointsAddedEvent(
        {
          id: customer.id,
          tenantId: customer.tenantId,
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
          tags: customer.tags as string[],
        },
        dto.points,
        newPoints,
        dto.description,
        dto.referenceId,
      ),
    );

    // Verificar mudança de tier
    if (previousTier.tier !== newTier.tier) {
      await this.repository.updateLoyaltyTier(id, newTier.tier);

      this.eventEmitter.emit(
        'customer.loyalty.tier_changed',
        new CustomerLoyaltyTierChangedEvent(
          {
            id: customer.id,
            tenantId: customer.tenantId,
            name: customer.name,
            email: customer.email || undefined,
            phone: customer.phone,
            tags: customer.tags as string[],
          },
          previousTier.tier as LoyaltyTier,
          newTier.tier as LoyaltyTier,
          newPoints,
        ),
      );
    }

    return this.findById(id);
  }

  // ==================== NOTAS ====================

  /**
   * Adiciona nota ao cliente
   */
  async addNote(id: string, dto: AddCustomerNoteDto, createdBy: string): Promise<any> {
    await this.findById(id);

    const note = await this.prisma.customerNote.create({
      data: {
        customerId: id,
        content: dto.content,
        isPrivate: dto.isPrivate || false,
        createdBy,
      },
    });

    return note;
  }

  /**
   * Lista notas do cliente
   */
  async getNotes(id: string, includePrivate = false): Promise<any[]> {
    await this.findById(id);

    return this.prisma.customerNote.findMany({
      where: {
        customerId: id,
        ...(includePrivate ? {} : { isPrivate: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== ANALYTICS ====================

  /**
   * Obtém analytics do cliente
   */
  async getAnalytics(id: string): Promise<CustomerAnalytics> {
    await this.findById(id);
    return this.analyticsService.getCustomerAnalytics(id);
  }

  /**
   * Obtém timeline do cliente
   */
  async getTimeline(id: string, page = 1, limit = 20): Promise<CustomerTimelineItem[]> {
    await this.findById(id);
    return this.analyticsService.getCustomerTimeline(id, page, limit);
  }

  /**
   * Obtém histórico de agendamentos do cliente
   */
  async getAppointmentHistory(id: string, page = 1, limit = 20): Promise<any> {
    await this.findById(id);

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { customerId: id },
        include: {
          professional: { select: { id: true, name: true } },
          services: {
            include: { service: { select: { id: true, name: true } } },
          },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({
        where: { customerId: id },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recalcula métricas do cliente
   */
  async recalculateMetrics(id: string): Promise<void> {
    await this.findById(id);
    await this.analyticsService.recalculateMetrics(id);
  }

  // ==================== SEGMENTAÇÃO ====================

  /**
   * Lista segmentos
   */
  async listSegments() {
    return this.segmentationService.listSegments();
  }

  /**
   * Cria segmento
   */
  async createSegment(dto: CreateSegmentDto) {
    return this.segmentationService.createSegment(dto);
  }

  /**
   * Atualiza segmento
   */
  async updateSegment(id: string, dto: UpdateSegmentDto) {
    return this.segmentationService.updateSegment(id, dto);
  }

  /**
   * Deleta segmento
   */
  async deleteSegment(id: string) {
    return this.segmentationService.deleteSegment(id);
  }

  /**
   * Busca clientes de um segmento
   */
  async getSegmentCustomers(segmentId: string, page = 1, limit = 20) {
    return this.repository.findBySegment(segmentId, page, limit);
  }

  // ==================== DUPLICADOS E MERGE ====================

  /**
   * Busca duplicados
   */
  async findDuplicates(dto: FindDuplicatesDto) {
    return this.mergeService.findDuplicates(dto);
  }

  /**
   * Mescla clientes
   */
  async mergeCustomers(dto: MergeCustomersDto) {
    return this.mergeService.mergeCustomers(dto);
  }

  // ==================== IMPORTAÇÃO ====================

  /**
   * Valida arquivo de importação
   */
  async validateImport(file: Express.Multer.File, options: ImportOptionsDto) {
    return this.importService.validateFile(file, options);
  }

  /**
   * Importa clientes
   */
  async importCustomers(file: Express.Multer.File, options: ImportOptionsDto) {
    return this.importService.importCustomers(file, options);
  }

  // ==================== OPERAÇÕES EM LOTE ====================

  /**
   * Atualização em lote
   */
  async bulkUpdate(dto: BulkUpdateDto): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultDto = {
      total: dto.customerIds.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const customerId of dto.customerIds) {
      try {
        await this.update(customerId, dto.data as UpdateCustomerDto);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Adiciona tags em lote
   */
  async bulkAddTags(dto: BulkAddTagsDto): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultDto = {
      total: dto.customerIds.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const customerId of dto.customerIds) {
      try {
        await this.repository.addTags(customerId, dto.tags);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Remove tags em lote
   */
  async bulkRemoveTags(dto: BulkRemoveTagsDto): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultDto = {
      total: dto.customerIds.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const customerId of dto.customerIds) {
      try {
        await this.repository.removeTags(customerId, dto.tags);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete em lote
   */
  async bulkDelete(dto: BulkDeleteDto): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultDto = {
      total: dto.customerIds.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const customerId of dto.customerIds) {
      try {
        await this.delete(customerId, undefined, dto.reason);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * Estatísticas gerais
   */
  async getStats() {
    return this.repository.getStats();
  }

  /**
   * Aniversariantes
   */
  async getBirthdays(month?: number, day?: number) {
    const targetMonth = month || new Date().getMonth() + 1;
    return this.repository.findBirthdays(targetMonth, day);
  }

  /**
   * Clientes inativos
   */
  async getInactiveCustomers(days = 90) {
    return this.repository.findInactive(days);
  }

  // ==================== HELPERS ====================

  /**
   * Normaliza dados do cliente
   */
  private normalizeCustomerData(dto: CreateCustomerDto | UpdateCustomerDto): any {
    const data: any = { ...dto };

    // Normalizar telefone
    if (data.phone) {
      data.phone = this.normalizePhone(data.phone);
    }

    // Normalizar CPF
    if (data.cpf) {
      data.cpf = data.cpf.replace(/\D/g, '');
    }

    // Normalizar email
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    // Extrair mês e dia de nascimento
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      data.birthMonth = birthDate.getMonth() + 1;
      data.birthDay = birthDate.getDate();
    }

    // Normalizar tags
    if (data.tags) {
      data.tags = data.tags.map((t: string) => t.toLowerCase().trim());
    }

    return data;
  }

  /**
   * Normaliza telefone
   */
  private normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');

    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }

    return '+' + digits;
  }

  /**
   * Identifica campos alterados
   */
  private identifyChangedFields(
    existing: any,
    dto: UpdateCustomerDto,
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && existing[key] !== value) {
        changes.push({
          field: key,
          oldValue: existing[key],
          newValue: value,
        });
      }
    }

    return changes;
  }
}
