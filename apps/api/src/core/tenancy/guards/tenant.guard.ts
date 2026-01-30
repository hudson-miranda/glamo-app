import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../tenant.service';
import { TenantContextService } from '../tenant-context.service';
import {
  SKIP_TENANT_CHECK,
  REQUIRED_FEATURE,
  REQUIRED_LIMIT,
  LimitConfig,
} from '../decorators';
import { TenantPlanFeatures, TenantPlanLimits } from '../interfaces';

/**
 * Guard para validação de tenant
 * Garante que o tenant existe, está ativo e o usuário tem acesso
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verifica se deve pular validação de tenant
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId ||
      request.user?.tenantId ||
      TenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new UnauthorizedException('Contexto de tenant não encontrado');
    }

    // Valida tenant
    const validation = await this.tenantService.validateTenant(tenantId);

    if (!validation.valid) {
      throw new ForbiddenException(validation.reason);
    }

    return true;
  }
}

/**
 * Guard para validação de features do plano
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<keyof TenantPlanFeatures>(
      REQUIRED_FEATURE,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId ||
      request.user?.tenantId ||
      TenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new UnauthorizedException('Contexto de tenant não encontrado');
    }

    const hasFeature = await this.tenantService.hasFeature(tenantId, requiredFeature);

    if (!hasFeature) {
      throw new ForbiddenException(
        `A funcionalidade "${requiredFeature}" não está disponível no seu plano. Faça upgrade para ter acesso.`,
      );
    }

    return true;
  }
}

/**
 * Guard para validação de limites do plano
 */
@Injectable()
export class LimitGuard implements CanActivate {
  private readonly logger = new Logger(LimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitConfig = this.reflector.getAllAndOverride<LimitConfig>(
      REQUIRED_LIMIT,
      [context.getHandler(), context.getClass()],
    );

    if (!limitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId ||
      request.user?.tenantId ||
      TenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new UnauthorizedException('Contexto de tenant não encontrado');
    }

    // Este guard apenas marca que o limite deve ser verificado
    // A verificação real é feita no service, pois precisa contar os registros
    // Aqui apenas verificamos se há um plano que suporta o recurso

    const limit = await this.tenantService.getLimit(
      tenantId,
      limitConfig.type as keyof TenantPlanLimits,
    );

    // Se limite é 0, recurso não está disponível
    if (limit === 0) {
      throw new ForbiddenException(
        `Este recurso não está disponível no seu plano atual.`,
      );
    }

    return true;
  }
}

/**
 * Guard combinado para tenant + feature
 */
@Injectable()
export class TenantFeatureGuard implements CanActivate {
  constructor(
    private readonly tenantGuard: TenantGuard,
    private readonly featureGuard: FeatureGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantValid = await this.tenantGuard.canActivate(context);
    if (!tenantValid) return false;

    return this.featureGuard.canActivate(context);
  }
}
