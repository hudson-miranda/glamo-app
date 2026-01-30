import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '@glamo/database';
import { ROLES_KEY } from './roles.decorator';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator para definir permissões necessárias em uma rota
 * 
 * @example
 * ```typescript
 * @Permissions('appointments:create', 'appointments:read')
 * @Post('appointments')
 * createAppointment() {
 *   // ...
 * }
 * ```
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator composto para autenticação + autorização
 * 
 * @example
 * ```typescript
 * @Auth(UserRole.OWNER, UserRole.MANAGER)
 * @Get('financial')
 * getFinancialData() {
 *   // ...
 * }
 * ```
 */
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiForbiddenResponse({ description: 'Sem permissão' }),
  );
}

/**
 * Decorator para rotas que requerem apenas autenticação
 */
export function Authenticated() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
  );
}
