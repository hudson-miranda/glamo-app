import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@glamo/database';

/**
 * DTO para atualização de agendamento
 */
export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Observações do agendamento' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Notas internas (visíveis apenas para staff)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Status do agendamento', enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
