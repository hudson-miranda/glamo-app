import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService, TenantContext } from '../tenant-context.service';

/**
 * Interceptor para garantir que o contexto do tenant está disponível
 * durante toda a execução da requisição
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantContextInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Se já tem contexto de tenant no middleware, usa ele
    if (request.tenantContext) {
      return new Observable((subscriber) => {
        TenantContextService.runAsync(request.tenantContext, async () => {
          try {
            const result = await next.handle().toPromise();
            subscriber.next(result);
            subscriber.complete();
          } catch (error) {
            subscriber.error(error);
          }
        });
      });
    }

    // Se tem tenantId no request (de JWT ou header), cria contexto
    if (request.tenantId || request.user?.tenantId) {
      const tenantContext: TenantContext = {
        tenantId: request.tenantId || request.user?.tenantId,
        slug: request.tenantSlug,
        planType: request.user?.planType,
      };

      return new Observable((subscriber) => {
        TenantContextService.runAsync(tenantContext, async () => {
          try {
            const result = await next.handle().toPromise();
            subscriber.next(result);
            subscriber.complete();
          } catch (error) {
            subscriber.error(error);
          }
        });
      });
    }

    // Sem contexto de tenant, prossegue normalmente
    return next.handle();
  }
}
