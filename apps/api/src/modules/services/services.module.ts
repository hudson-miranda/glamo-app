import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './repositories';
import { PricingService } from './services/pricing.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServicesRepository,
    PricingService,
  ],
  exports: [ServicesService, PricingService],
})
export class ServicesModule {}
