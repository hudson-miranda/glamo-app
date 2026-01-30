import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';
import { TenantContextService, TenantContext } from '../tenant-context.service';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
      tenantContext?: TenantContext;
    }
  }
}

/**
 * Rotas que não precisam de tenant
 */
const TENANT_FREE_ROUTES = [
  '/health',
  '/api/health',
  '/api/docs',
  '/api/swagger',
  '/favicon.ico',
];

/**
 * Middleware para resolver e validar o tenant da requisição
 * 
 * Ordem de resolução:
 * 1. Subdomínio (ex: salaoxyz.glamo.app)
 * 2. Header X-Tenant-ID
 * 3. JWT claim tenantId (se usuário autenticado)
 */
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  // Domínios base que não são tenants
  private readonly baseDomains = [
    'glamo.app',
    'glamo.com.br',
    'localhost',
    '127.0.0.1',
  ];

  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Pula rotas que não precisam de tenant
    if (this.isTenantFreeRoute(req.path)) {
      return next();
    }

    try {
      let tenantId: string | undefined;
      let tenantSlug: string | undefined;

      // 1. Tentar resolver por subdomínio
      const subdomainResult = this.resolveFromSubdomain(req.headers.host);
      if (subdomainResult) {
        tenantSlug = subdomainResult;
        const tenant = await this.tenantService.findBySlug(subdomainResult);
        if (tenant) {
          tenantId = tenant.id;
        }
      }

      // 2. Tentar resolver por header X-Tenant-ID
      if (!tenantId) {
        const headerTenantId = req.headers['x-tenant-id'] as string;
        if (headerTenantId) {
          tenantId = headerTenantId;
        }
      }

      // 3. Tentar resolver por JWT (se usuário já autenticado)
      if (!tenantId && (req as any).user?.tenantId) {
        tenantId = (req as any).user.tenantId;
      }

      // Se não encontrou tenant, verifica se rota é pública
      if (!tenantId) {
        // Permite continuar para rotas públicas de auth
        // Usa originalUrl pois req.path pode ser alterado por middlewares de versionamento
        const urlPath = req.originalUrl || req.path;
        if (this.isAuthRoute(urlPath)) {
          return next();
        }
        throw new UnauthorizedException('Tenant não identificado');
      }

      // Validar tenant existe e está ativo
      const validation = await this.tenantService.validateTenant(tenantId);

      if (!validation.valid) {
        throw new ForbiddenException(validation.reason || 'Tenant inválido');
      }

      const tenant = validation.tenant;

      // Configura contexto do tenant no request
      req.tenantId = tenantId;
      req.tenantSlug = tenant.slug;

      const tenantContext: TenantContext = {
        tenantId,
        slug: tenant.slug,
        planType: tenant.subscription?.planType,
        features: this.extractFeatures(tenant),
      };

      req.tenantContext = tenantContext;

      // Executa o restante da requisição dentro do contexto do tenant
      TenantContextService.run(tenantContext, () => {
        next();
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extrai slug do subdomínio
   */
  private resolveFromSubdomain(host: string | undefined): string | null {
    if (!host) return null;

    // Remove porta se existir
    const hostname = host.split(':')[0];

    // Verifica se é um dos domínios base
    for (const baseDomain of this.baseDomains) {
      if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
        return null;
      }

      // Extrai subdomínio
      if (hostname.endsWith(`.${baseDomain}`)) {
        const subdomain = hostname.replace(`.${baseDomain}`, '');
        
        // Ignora subdomínios reservados
        if (['www', 'api', 'app', 'admin', 'dashboard'].includes(subdomain)) {
          return null;
        }

        return subdomain;
      }
    }

    // Pode ser um domínio customizado
    // Tentar buscar por domínio completo
    return null;
  }

  /**
   * Verifica se é rota que não precisa de tenant
   */
  private isTenantFreeRoute(path: string): boolean {
    return TENANT_FREE_ROUTES.some(
      (route) => path === route || path.startsWith(route),
    );
  }

  /**
   * Verifica se é rota de autenticação
   */
  private isAuthRoute(path: string): boolean {
    const authRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/resend-verification',
      '/auth/refresh',
      '/auth/me',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-email',
      '/api/auth/resend-verification',
      '/api/auth/refresh',
      '/api/auth/me',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/verify-email',
      '/api/v1/auth/resend-verification',
      '/api/v1/auth/refresh',
      '/api/v1/auth/me',
      // Tenant routes (creating/joining a tenant)
      '/tenants',
      '/api/tenants',
      '/api/v1/tenants',
      // Invitations routes
      '/invitations',
      '/api/invitations',
      '/api/v1/invitations',
    ];

    return authRoutes.some((route) => path.includes(route));
  }

  /**
   * Extrai features habilitadas do tenant
   */
  private extractFeatures(tenant: any): string[] {
    const features: string[] = [];
    
    // Features podem vir das settings ou do plano
    if (tenant.settings?.features) {
      features.push(...Object.keys(tenant.settings.features).filter(
        (f) => tenant.settings.features[f] === true,
      ));
    }

    return features;
  }
}
