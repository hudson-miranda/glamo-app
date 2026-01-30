import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { MarketingRepository } from './repositories';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [MarketingController],
  providers: [MarketingService, MarketingRepository],
  exports: [MarketingService],
})
export class MarketingModule {}
