import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { AuthenticatedUser } from '../interfaces';

/**
 * Guard de verificação de tenant
 * Garante que o contexto do tenant está definido para operações multi-tenant
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // Se não há usuário, o JwtAuthGuard já bloqueou
    if (!user) {
      return true;
    }

    // Obtém tenantId do usuário ou do header
    const userTenantId = user.tenantId;
    const headerTenantId = request.headers['x-tenant-id'];

    // Se há header de tenant, valida que é o mesmo do usuário
    if (headerTenantId && headerTenantId !== userTenantId) {
      throw new ForbiddenException(
        'Tenant do header não corresponde ao tenant do usuário',
      );
    }

    // Garante que há um tenantId definido
    if (!userTenantId) {
      throw new BadRequestException(
        'Contexto de tenant não definido. Faça login novamente.',
      );
    }

    // Define o tenantId no request para uso posterior
    request.tenantId = userTenantId;

    return true;
  }
}

/**
 * Metadata key para pular validação de tenant
 */
export const SKIP_TENANT_KEY = 'skipTenant';

/**
 * Guard que permite pular validação de tenant em rotas específicas
 * Útil para rotas de super admin ou rotas cross-tenant
 */
@Injectable()
export class OptionalTenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se deve pular validação de tenant
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (user?.tenantId) {
      request.tenantId = user.tenantId;
    } else if (request.headers['x-tenant-id']) {
      request.tenantId = request.headers['x-tenant-id'];
    }

    return true;
  }
}
