import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialRepository } from './repositories';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { ReportingService } from './services/reporting.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenancyModule } from '@/core/tenancy';

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [FinancialController],
  providers: [
    FinancialService,
    FinancialRepository,
    PaymentGatewayService,
    ReportingService,
  ],
  exports: [FinancialService, PaymentGatewayService, ReportingService],
})
export class FinancialModule {}
