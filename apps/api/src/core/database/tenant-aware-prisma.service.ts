import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContextService } from '../tenancy/tenant-context.service';

/**
 * Lista de modelos que têm tenantId
 */
const TENANT_MODELS = [
  'User',
  'Professional',
  'Client',
  'Service',
  'ServiceCategory',
  'Appointment',
  'AppointmentService',
  'Transaction',
  'TransactionItem',
  'Product',
  'ProductCategory',
  'InventoryMovement',
  'Commission',
  'Campaign',
  'LoyaltyProgram',
  'LoyaltyTransaction',
  'Notification',
  'WorkingHours',
  'BlockedTime',
  'Review',
];

/**
 * PrismaService estendido com suporte a multi-tenancy e RLS
 */
@Injectable()
export class TenantAwarePrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantAwarePrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma conectado ao banco de dados');

    // Log de queries em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 100) {
          this.logger.warn(`Query lenta (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma desconectado');
  }

  /**
   * Verifica se um modelo tem campo tenantId
   */
  private hasTenantId(model: string): boolean {
    return TENANT_MODELS.includes(model);
  }

  /**
   * Executa operação com RLS ativado para o tenant
   * Define a variável de sessão app.current_tenant_id no PostgreSQL
   */
  async withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // Define a variável de sessão do PostgreSQL para RLS
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return fn();
    });
  }

  /**
   * Executa operação com RLS usando o tenant do contexto atual
   */
  async withCurrentTenant<T>(fn: () => Promise<T>): Promise<T> {
    const tenantId = TenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Nenhum contexto de tenant ativo');
    }

    return this.withTenant(tenantId, fn);
  }

  /**
   * Executa query raw com RLS
   */
  async executeWithTenant<T>(
    tenantId: string,
    query: TemplateStringsArray,
    ...values: any[]
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return tx.$queryRaw(query, ...values);
    }) as Promise<T>;
  }

  /**
   * Cria extensão do Prisma com filtro automático de tenant
   * 
   * @example
   * const db = prismaService.forTenant(tenantId);
   * const clients = await db.client.findMany(); // Já filtrado por tenant
   */
  forTenant(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
          async findUnique({ model, args, query }) {
            // findUnique não pode ter tenantId adicional no where
            // mas podemos verificar após buscar
            const result = await query(args);
            if (result && TENANT_MODELS.includes(model) && (result as any).tenantId !== tenantId) {
              return null;
            }
            return result;
          },
          async count({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
          async create({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              (args.data as any).tenantId = tenantId;
            }
            return query(args);
          },
          async createMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model) && Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                tenantId,
              }));
            }
            return query(args);
          },
          async update({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId } as any;
            }
            return query(args);
          },
          async updateMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
          async delete({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId } as any;
            }
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model)) {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
        },
      },
    });
  }

  /**
   * Retorna cliente Prisma para o tenant atual do contexto
   */
  forCurrentTenant() {
    const tenantId = TenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Nenhum contexto de tenant ativo');
    }

    return this.forTenant(tenantId);
  }
}
