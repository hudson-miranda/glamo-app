import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { GoalType, GoalPeriod } from '../interfaces';

export class CreateGoalDto {
  @ApiProperty({ description: 'Nome da meta' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: GoalType, description: 'Tipo de meta' })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty({ enum: GoalPeriod, description: 'Período' })
  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  @ApiProperty({ description: 'Valor alvo' })
  @IsNumber()
  @Min(0)
  target: number;

  @ApiPropertyOptional({ description: 'Valor do bônus ao atingir' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bonusAmount?: number;

  @ApiPropertyOptional({ description: 'Percentual adicional de comissão' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bonusPercentage?: number;

  @ApiPropertyOptional({ description: 'ID do profissional (se individual)' })
  @IsUUID()
  @IsOptional()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'ID do time (se por equipe)' })
  @IsUUID()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Meta global?' })
  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({ description: 'Nome da meta' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Valor alvo' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  target?: number;

  @ApiPropertyOptional({ description: 'Valor do bônus' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bonusAmount?: number;

  @ApiPropertyOptional({ description: 'Meta ativa?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
