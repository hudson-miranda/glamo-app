import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsRepository } from './repositories';
import { ScheduleService } from './services/schedule.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [ProfessionalsController],
  providers: [
    ProfessionalsService,
    ProfessionalsRepository,
    ScheduleService,
  ],
  exports: [ProfessionalsService, ScheduleService],
})
export class ProfessionalsModule {}
