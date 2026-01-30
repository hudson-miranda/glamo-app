import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@core/database/database.module';
import { TenancyModule } from '@core/tenancy/tenancy.module';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './repositories/appointments.repository';

import {
  AvailabilityService,
  ConflictCheckerService,
  RecurrenceService,
  ReminderService,
} from './services';

import { AppointmentsListener } from './listeners/appointments.listener';

import {
  SendReminderProcessor,
  AutoCancelProcessor,
} from './jobs';

/**
 * Módulo de Agendamentos
 * 
 * Gerencia todo o ciclo de vida dos agendamentos:
 * - CRUD de agendamentos
 * - Cálculo de disponibilidade
 * - Verificação de conflitos
 * - Recorrência
 * - Lembretes automáticos
 * - Eventos e notificações
 */
@Module({
  imports: [
    DatabaseModule,
    TenancyModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({
      name: 'appointments',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [AppointmentsController],
  providers: [
    // Serviço Principal
    AppointmentsService,

    // Repositório
    AppointmentsRepository,

    // Serviços de Suporte
    AvailabilityService,
    ConflictCheckerService,
    RecurrenceService,
    ReminderService,

    // Listeners
    AppointmentsListener,

    // Processors (Jobs)
    SendReminderProcessor,
    AutoCancelProcessor,
  ],
  exports: [
    AppointmentsService,
    AvailabilityService,
    ConflictCheckerService,
    RecurrenceService,
  ],
})
export class AppointmentsModule {}
