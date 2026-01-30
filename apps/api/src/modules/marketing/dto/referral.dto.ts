import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsEmail,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReferralRewardDto {
  @ApiProperty({ enum: ['POINTS', 'DISCOUNT', 'CREDIT', 'FREE_SERVICE'], description: 'Tipo de recompensa' })
  @IsString()
  type: 'POINTS' | 'DISCOUNT' | 'CREDIT' | 'FREE_SERVICE';

  @ApiProperty({ description: 'Valor da recompensa' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'ID do serviço (se FREE_SERVICE)' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;
}

export class CreateReferralProgramDto {
  @ApiProperty({ description: 'Nome do programa' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Recompensa do indicador', type: ReferralRewardDto })
  @ValidateNested()
  @Type(() => ReferralRewardDto)
  referrerReward: ReferralRewardDto;

  @ApiProperty({ description: 'Recompensa do indicado', type: ReferralRewardDto })
  @ValidateNested()
  @Type(() => ReferralRewardDto)
  refereeReward: ReferralRewardDto;

  @ApiPropertyOptional({ description: 'Valor mínimo de compra para validar' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Máximo de indicações por cliente' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxReferralsPerCustomer?: number;

  @ApiProperty({ description: 'Dias de validade da indicação' })
  @IsNumber()
  @Min(1)
  validDays: number;
}

export class UpdateReferralProgramDto {
  @ApiPropertyOptional({ description: 'Nome do programa' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Recompensa do indicador', type: ReferralRewardDto })
  @ValidateNested()
  @Type(() => ReferralRewardDto)
  @IsOptional()
  referrerReward?: ReferralRewardDto;

  @ApiPropertyOptional({ description: 'Recompensa do indicado', type: ReferralRewardDto })
  @ValidateNested()
  @Type(() => ReferralRewardDto)
  @IsOptional()
  refereeReward?: ReferralRewardDto;

  @ApiPropertyOptional({ description: 'Programa ativo?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateReferralDto {
  @ApiProperty({ description: 'ID do cliente indicador' })
  @IsUUID()
  referrerCustomerId: string;

  @ApiPropertyOptional({ description: 'Email do indicado' })
  @IsEmail()
  @IsOptional()
  refereeEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone do indicado' })
  @IsString()
  @IsOptional()
  refereePhone?: string;
}

export class CompleteReferralDto {
  @ApiProperty({ description: 'Código da indicação' })
  @IsString()
  referralCode: string;

  @ApiProperty({ description: 'ID do cliente indicado' })
  @IsUUID()
  refereeCustomerId: string;

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;
}
