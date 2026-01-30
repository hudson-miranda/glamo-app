import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './repositories';
import { CalculationService, GoalService } from './services';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [CommissionsController],
  providers: [
    CommissionsService,
    CommissionsRepository,
    CalculationService,
    GoalService,
  ],
  exports: [CommissionsService],
})
export class CommissionsModule {}
