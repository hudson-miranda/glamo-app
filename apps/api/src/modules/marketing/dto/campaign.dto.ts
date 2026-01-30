import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampaignType,
  CampaignTrigger,
  AutomationTrigger,
} from '../interfaces';

export class AudienceFilterDto {
  @ApiProperty({ description: 'Campo para filtrar' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Operador' })
  @IsString()
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';

  @ApiProperty({ description: 'Valor' })
  value: any;
}

export class CampaignAudienceDto {
  @ApiProperty({ enum: ['ALL', 'SEGMENT', 'CUSTOM', 'IMPORT'], description: 'Tipo de audiência' })
  @IsString()
  type: 'ALL' | 'SEGMENT' | 'CUSTOM' | 'IMPORT';

  @ApiPropertyOptional({ description: 'ID do segmento' })
  @IsUUID()
  @IsOptional()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'IDs de clientes específicos' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  customerIds?: string[];

  @ApiPropertyOptional({ description: 'Filtros customizados', type: [AudienceFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceFilterDto)
  @IsOptional()
  filters?: AudienceFilterDto[];

  @ApiPropertyOptional({ description: 'IDs a excluir' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludeIds?: string[];
}

export class CampaignContentDto {
  @ApiPropertyOptional({ description: 'Assunto (para email)' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Corpo da mensagem' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Corpo HTML' })
  @IsString()
  @IsOptional()
  htmlBody?: string;

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Variáveis do template' })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Texto do CTA' })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiPropertyOptional({ description: 'URL do CTA' })
  @IsString()
  @IsOptional()
  ctaUrl?: string;
}

export class CampaignScheduleDto {
  @ApiPropertyOptional({ description: 'Data/hora de envio' })
  @IsDateString()
  @IsOptional()
  sendAt?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Enviar em lotes?' })
  @IsBoolean()
  @IsOptional()
  sendByBatches?: boolean;

  @ApiPropertyOptional({ description: 'Tamanho do lote' })
  @IsNumber()
  @IsOptional()
  batchSize?: number;

  @ApiPropertyOptional({ description: 'Intervalo entre lotes (minutos)' })
  @IsNumber()
  @IsOptional()
  batchIntervalMinutes?: number;
}

export class AutomationConfigDto {
  @ApiProperty({ enum: AutomationTrigger, description: 'Gatilho da automação' })
  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @ApiPropertyOptional({ description: 'Atraso em minutos' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  delayMinutes?: number;

  @ApiPropertyOptional({ description: 'Condições adicionais', type: [AudienceFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceFilterDto)
  @IsOptional()
  conditions?: AudienceFilterDto[];

  @ApiPropertyOptional({ description: 'Habilitar follow-up?' })
  @IsBoolean()
  @IsOptional()
  followUpEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Dias para follow-up' })
  @IsNumber()
  @IsOptional()
  followUpDelayDays?: number;

  @ApiPropertyOptional({ description: 'Máximo de envios por cliente' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSendsPerCustomer?: number;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nome da campanha' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CampaignType, description: 'Tipo de campanha' })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({ enum: CampaignTrigger, description: 'Gatilho' })
  @IsEnum(CampaignTrigger)
  trigger: CampaignTrigger;

  @ApiProperty({ description: 'Audiência', type: CampaignAudienceDto })
  @ValidateNested()
  @Type(() => CampaignAudienceDto)
  audience: CampaignAudienceDto;

  @ApiProperty({ description: 'Conteúdo', type: CampaignContentDto })
  @ValidateNested()
  @Type(() => CampaignContentDto)
  content: CampaignContentDto;

  @ApiPropertyOptional({ description: 'Agendamento', type: CampaignScheduleDto })
  @ValidateNested()
  @Type(() => CampaignScheduleDto)
  @IsOptional()
  schedule?: CampaignScheduleDto;

  @ApiPropertyOptional({ description: 'Configuração de automação', type: AutomationConfigDto })
  @ValidateNested()
  @Type(() => AutomationConfigDto)
  @IsOptional()
  automation?: AutomationConfigDto;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Nome da campanha' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Audiência', type: CampaignAudienceDto })
  @ValidateNested()
  @Type(() => CampaignAudienceDto)
  @IsOptional()
  audience?: CampaignAudienceDto;

  @ApiPropertyOptional({ description: 'Conteúdo', type: CampaignContentDto })
  @ValidateNested()
  @Type(() => CampaignContentDto)
  @IsOptional()
  content?: CampaignContentDto;

  @ApiPropertyOptional({ description: 'Agendamento', type: CampaignScheduleDto })
  @ValidateNested()
  @Type(() => CampaignScheduleDto)
  @IsOptional()
  schedule?: CampaignScheduleDto;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
