import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Motivo de cancelamento
 */
export enum CancellationReason {
  CLIENT_REQUEST = 'CLIENT_REQUEST',
  PROFESSIONAL_UNAVAILABLE = 'PROFESSIONAL_UNAVAILABLE',
  NO_SHOW = 'NO_SHOW',
  DUPLICATE = 'DUPLICATE',
  SCHEDULING_ERROR = 'SCHEDULING_ERROR',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

/**
 * DTO para cancelamento de agendamento
 */
export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Motivo do cancelamento', enum: CancellationReason })
  @IsOptional()
  @IsEnum(CancellationReason)
  reason?: CancellationReason = CancellationReason.OTHER;

  @ApiPropertyOptional({ description: 'Descrição detalhada do motivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Notificar cliente sobre o cancelamento' })
  @IsOptional()
  @IsBoolean()
  notifyClient?: boolean = true;

  @ApiPropertyOptional({ description: 'Notificar profissional sobre o cancelamento' })
  @IsOptional()
  @IsBoolean()
  notifyProfessional?: boolean = true;

  @ApiPropertyOptional({ description: 'Cancelado pelo cliente (vs staff)' })
  @IsOptional()
  @IsBoolean()
  cancelledByClient?: boolean = false;
}
