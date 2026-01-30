import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o tenant ID do request
 * 
 * @example
 * ```typescript
 * @Get('data')
 * getData(@CurrentTenant() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    
    // Primeiro tenta pegar do usuário autenticado
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }
    
    // Depois tenta pegar do header (para casos especiais)
    const tenantHeader = request.headers['x-tenant-id'];
    if (tenantHeader) {
      return tenantHeader;
    }
    
    return null;
  },
);
