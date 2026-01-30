import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@glamo/database';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles permitidos em uma rota
 * 
 * @example
 * ```typescript
 * @Roles(UserRole.OWNER, UserRole.MANAGER)
 * @Get('admin')
 * adminOnly() {
 *   return 'Admin content';
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator para permitir apenas OWNER
 */
export const OwnerOnly = () => Roles(UserRole.OWNER);

/**
 * Decorator para permitir OWNER e MANAGER
 */
export const ManagersUp = () => Roles(UserRole.OWNER, UserRole.MANAGER);

/**
 * Decorator para permitir OWNER, MANAGER e ADMIN
 */
export const AdminsUp = () => Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN);
