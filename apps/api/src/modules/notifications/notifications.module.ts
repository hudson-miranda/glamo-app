import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories';
import {
  EmailService,
  SmsService,
  PushService,
  TemplateService,
  QueueService,
} from './services';
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
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    EmailService,
    SmsService,
    PushService,
    TemplateService,
    QueueService,
  ],
  exports: [NotificationsService, TemplateService],
})
export class NotificationsModule {}
