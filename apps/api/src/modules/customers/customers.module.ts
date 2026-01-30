import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './repositories';
import {
  CustomerAnalyticsService,
  CustomerSegmentationService,
  CustomerMergeService,
  CustomerImportService,
} from './services';
import { CustomersListener } from './listeners';
import { PrismaModule } from '@/core/database/prisma.module';
import { TenancyModule } from '@/core/tenancy/tenancy.module';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomersRepository,
    CustomerAnalyticsService,
    CustomerSegmentationService,
    CustomerMergeService,
    CustomerImportService,
    CustomersListener,
  ],
  exports: [
    CustomersService,
    CustomersRepository,
    CustomerAnalyticsService,
    CustomerSegmentationService,
  ],
})
export class CustomersModule {}
