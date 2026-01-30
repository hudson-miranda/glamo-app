import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsController, WebhookReceiverController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationsRepository } from './repositories';
import { WhatsAppService, WebhookService, PaymentGatewayService, CalendarService } from './services';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [
    PrismaModule,
    TenancyModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [IntegrationsController, WebhookReceiverController],
  providers: [
    IntegrationsService,
    IntegrationsRepository,
    WhatsAppService,
    WebhookService,
    PaymentGatewayService,
    CalendarService,
  ],
  exports: [IntegrationsService, WebhookService],
})
export class IntegrationsModule {}
