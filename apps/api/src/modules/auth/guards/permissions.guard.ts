import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators';
import { AuthenticatedUser } from '../interfaces';

/**
 * Guard de verificação de permissões granulares
 * Verifica se o usuário possui as permissões específicas para acessar a rota
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
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

    // Obtém as permissões requeridas
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há permissões requeridas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Owner e Admin têm todas as permissões
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return true;
    }

    const userPermissions = user.permissions || [];

    // Verifica se o usuário possui todas as permissões requeridas
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (p) => !userPermissions.includes(p),
      );
      throw new ForbiddenException(
        `Permissões insuficientes. Requeridas: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Lista de permissões padrão do sistema
 */
export const SystemPermissions = {
  // Agendamentos
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_MANAGE: 'appointments:manage',

  // Clientes
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_READ: 'clients:read',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_EXPORT: 'clients:export',

  // Serviços
  SERVICES_CREATE: 'services:create',
  SERVICES_READ: 'services:read',
  SERVICES_UPDATE: 'services:update',
  SERVICES_DELETE: 'services:delete',

  // Profissionais
  PROFESSIONALS_CREATE: 'professionals:create',
  PROFESSIONALS_READ: 'professionals:read',
  PROFESSIONALS_UPDATE: 'professionals:update',
  PROFESSIONALS_DELETE: 'professionals:delete',
  PROFESSIONALS_MANAGE_SCHEDULE: 'professionals:manage_schedule',

  // Financeiro
  FINANCIAL_READ: 'financial:read',
  FINANCIAL_CREATE: 'financial:create',
  FINANCIAL_UPDATE: 'financial:update',
  FINANCIAL_DELETE: 'financial:delete',
  FINANCIAL_REPORTS: 'financial:reports',

  // Estoque
  INVENTORY_READ: 'inventory:read',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_ADJUST: 'inventory:adjust',

  // Relatórios
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Configurações
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',

  // Usuários
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Marketing
  MARKETING_CAMPAIGNS: 'marketing:campaigns',
  MARKETING_TEMPLATES: 'marketing:templates',
  MARKETING_SEND: 'marketing:send',

  // Integrações
  INTEGRATIONS_VIEW: 'integrations:view',
  INTEGRATIONS_MANAGE: 'integrations:manage',
} as const;

export type Permission = (typeof SystemPermissions)[keyof typeof SystemPermissions];
