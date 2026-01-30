import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';

// Services
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';

// Middleware
import { TenantResolverMiddleware } from './middleware';

// Interceptors
import { TenantContextInterceptor } from './interceptors';

// Guards - only TenantGuard exists
import { TenantGuard } from './guards';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    TenantService,
    TenantContextService,
    TenantContextInterceptor,
    TenantGuard,
  ],
  exports: [
    TenantService,
    TenantContextService,
    TenantContextInterceptor,
    TenantGuard,
  ],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantResolverMiddleware)
      .forRoutes('*'); // Aplica para todas as rotas
  }
}
