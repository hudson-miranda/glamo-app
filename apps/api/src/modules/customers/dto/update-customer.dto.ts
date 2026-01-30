import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de cliente
 * Todos os campos são opcionais
 */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({ description: 'ID do cliente no Stripe' })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @ApiPropertyOptional({ description: 'Atualizar data da última visita' })
  @IsOptional()
  @IsBoolean()
  updateLastVisit?: boolean;
}

/**
 * DTO para adicionar/remover tags
 */
export class UpdateCustomerTagsDto {
  @ApiPropertyOptional({ type: [String], description: 'Tags a adicionar' })
  @IsOptional()
  @IsString({ each: true })
  addTags?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Tags a remover' })
  @IsOptional()
  @IsString({ each: true })
  removeTags?: string[];
}

/**
 * DTO para adicionar pontos de fidelidade
 */
export class AddLoyaltyPointsDto {
  @ApiPropertyOptional({ description: 'Pontos a adicionar (pode ser negativo para subtrair)' })
  @IsNumber()
  points: number;

  @ApiPropertyOptional({ description: 'Descrição da transação' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'ID de referência (agendamento, compra, etc.)' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

/**
 * DTO para adicionar nota ao cliente
 */
export class AddCustomerNoteDto {
  @ApiPropertyOptional({ description: 'Conteúdo da nota' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Nota é privada (só visível para staff)' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
