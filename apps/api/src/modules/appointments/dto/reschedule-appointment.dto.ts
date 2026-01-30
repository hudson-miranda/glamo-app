import {
  IsUUID,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para reagendamento
 */
export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'Nova data e hora (ISO 8601)' })
  @IsISO8601()
  newScheduledAt: string;

  @ApiPropertyOptional({ description: 'Novo profissional (se mudar)' })
  @IsOptional()
  @IsUUID()
  newProfessionalId?: string;

  @ApiPropertyOptional({ description: 'Motivo do reagendamento' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: 'Notificar cliente sobre o reagendamento' })
  @IsOptional()
  @IsBoolean()
  notifyClient?: boolean = true;

  @ApiPropertyOptional({ description: 'Pular validação de conflitos (admin only)' })
  @IsOptional()
  @IsBoolean()
  skipConflictCheck?: boolean = false;
}
