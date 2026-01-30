import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Contexto do tenant para RLS
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

/**
 * Opções de configuração do PrismaService
 */
export interface PrismaServiceOptions {
  logQueries?: boolean;
  enableRLS?: boolean;
}

/**
 * PrismaService - Serviço do Prisma para NestJS com suporte a RLS
 * 
 * Este serviço gerencia a conexão com o banco de dados e implementa
 * Row-Level Security para isolamento multi-tenant.
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const tenants = await prismaService.tenant.findMany();
 * 
 * // Com contexto de tenant (RLS)
 * const customers = await prismaService.withTenant(
 *   { tenantId: 'uuid', userId: 'uuid', userRole: 'ADMIN' },
 *   async (tx) => tx.customer.findMany()
 * );
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly enableRLS: boolean;

  constructor(options: PrismaServiceOptions = {}) {
    const logConfig: Prisma.LogLevel[] = options.logQueries
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'];

    super({
      log: logConfig,
      errorFormat: 'pretty',
    });

    this.enableRLS = options.enableRLS ?? true;
  }

  /**
   * Inicializa a conexão com o banco de dados
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🔌 Conectando ao banco de dados...');
    
    try {
      await this.$connect();
      this.logger.log('✅ Conexão estabelecida com sucesso!');

      // Verificar se RLS está configurado
      if (this.enableRLS) {
        await this.verifyRLSSetup();
      }
    } catch (error) {
      this.logger.error('❌ Falha na conexão com o banco de dados', error);
      throw error;
    }
  }

  /**
   * Encerra a conexão com o banco de dados
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('🔌 Desconectando do banco de dados...');
    await this.$disconnect();
  }

  /**
   * Verifica se as funções de RLS estão configuradas
   */
  private async verifyRLSSetup(): Promise<void> {
    try {
      await this.$queryRaw`SELECT public.current_tenant_id()`;
      this.logger.log('🔐 RLS configurado corretamente');
    } catch (error) {
      this.logger.warn(
        '⚠️ RLS não configurado. Execute: pnpm db:setup-rls'
      );
    }
  }

  /**
   * Executa operações com contexto de tenant (RLS ativo)
   * 
   * @param context - Contexto do tenant
   * @param callback - Função a ser executada com o contexto
   * @returns Resultado da operação
   * 
   * @example
   * ```typescript
   * const customers = await prismaService.withTenant(
   *   { tenantId: 'abc-123', userId: 'user-456', userRole: 'ADMIN' },
   *   async (tx) => {
   *     return tx.customer.findMany();
   *   }
   * );
   * ```
   */
  async withTenant<T>(
    context: TenantContext,
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Definir contexto RLS
      await tx.$executeRaw`
        SELECT auth.set_user_context(
          ${context.tenantId}::UUID,
          ${context.userId ?? null}::UUID,
          ${context.userRole ?? null}::TEXT
        )
      `;

      try {
        // Executar callback com contexto ativo
        return await callback(tx);
      } finally {
        // Limpar contexto após execução
        await tx.$executeRaw`SELECT auth.clear_user_context()`;
      }
    });
  }

  /**
   * Define o contexto do tenant para a sessão atual
   * Use com cuidado - o contexto persiste até ser limpo
   * 
   * @param context - Contexto do tenant
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    await this.$executeRaw`
      SELECT auth.set_user_context(
        ${context.tenantId}::UUID,
        ${context.userId ?? null}::UUID,
        ${context.userRole ?? null}::TEXT
      )
    `;
  }

  /**
   * Limpa o contexto do tenant da sessão atual
   */
  async clearTenantContext(): Promise<void> {
    await this.$executeRaw`SELECT auth.clear_user_context()`;
  }

  /**
   * Executa uma query com contexto de tenant de forma simplificada
   * 
   * @param tenantId - ID do tenant
   * @param callback - Função a ser executada
   */
  async forTenant<T>(
    tenantId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.withTenant({ tenantId }, callback);
  }

  /**
   * Health check do banco de dados
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Verifica a conexão com retry
   * 
   * @param maxRetries - Número máximo de tentativas
   * @param delayMs - Delay entre tentativas em ms
   */
  async ensureConnection(
    maxRetries = 5,
    delayMs = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$queryRaw`SELECT 1`;
        return true;
      } catch (error) {
        this.logger.warn(
          `Tentativa ${attempt}/${maxRetries} de conexão falhou`
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    return false;
  }

  /**
   * Cria uma transação com timeout customizado
   * 
   * @param callback - Função a ser executada na transação
   * @param timeout - Timeout em ms (padrão: 10000)
   */
  async transactionWithTimeout<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    timeout = 10000
  ): Promise<T> {
    return this.$transaction(callback, {
      timeout,
      maxWait: 5000,
    });
  }

  /**
   * Soft delete - marca registro como inativo ao invés de deletar
   * 
   * @param model - Nome do modelo Prisma
   * @param id - ID do registro
   */
  async softDelete<T extends keyof PrismaClient>(
    model: T,
    id: string
  ): Promise<void> {
    const delegate = this[model] as any;
    if (delegate && typeof delegate.update === 'function') {
      await delegate.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }
}

/**
 * Factory para criar PrismaService configurado
 */
export function createPrismaService(
  options?: PrismaServiceOptions
): PrismaService {
  return new PrismaService(options);
}

/**
 * Middleware de logging para Prisma
 */
export function createLoggingMiddleware(
  logger: Logger
): Prisma.Middleware {
  return async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    logger.debug(
      `Query ${params.model}.${params.action} levou ${after - before}ms`
    );

    return result;
  };
}

export default PrismaService;
