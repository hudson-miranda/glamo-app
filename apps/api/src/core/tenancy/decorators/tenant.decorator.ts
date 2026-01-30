import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { TenantContextService } from '../tenant-context.service';

/**
 * Decorator para obter o ID do tenant atual
 * 
 * @example
 * ```typescript
 * @Get()
 * async findAll(@CurrentTenant() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // Tenta obter do contexto AsyncLocalStorage primeiro
    const contextTenantId = TenantContextService.getCurrentTenantId();
    if (contextTenantId) {
      return contextTenantId;
    }

    // Fallback para request
    return (
      request.tenantId ||
      request.user?.tenantId ||
      request.headers['x-tenant-id']
    );
  },
);

/**
 * Decorator para obter o contexto completo do tenant
 */
export const GetTenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext || TenantContextService.getStore();
  },
);

/**
 * Metadata key para pular validação de tenant
 */
export const SKIP_TENANT_CHECK = 'skipTenantCheck';

/**
 * Decorator para pular validação de tenant em uma rota
 * Útil para rotas de super admin ou operações cross-tenant
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK, true);

/**
 * Metadata key para requerer feature específica
 */
export const REQUIRED_FEATURE = 'requiredFeature';

/**
 * Decorator para requerer uma feature específica do plano
 * 
 * @example
 * ```typescript
 * @RequireFeature('marketing')
 * @Post('campaigns')
 * async createCampaign() {}
 * ```
 */
export const RequireFeature = (feature: string) =>
  SetMetadata(REQUIRED_FEATURE, feature);

/**
 * Metadata key para requerer limite específico
 */
export const REQUIRED_LIMIT = 'requiredLimit';

/**
 * Interface para configuração de limite
 */
export interface LimitConfig {
  type: string;
  countFn?: string; // Nome do método no service para contar
}

/**
 * Decorator para verificar limite antes de criar recurso
 * 
 * @example
 * ```typescript
 * @CheckLimit({ type: 'maxClients' })
 * @Post()
 * async create() {}
 * ```
 */
export const CheckLimit = (config: LimitConfig) =>
  SetMetadata(REQUIRED_LIMIT, config);
