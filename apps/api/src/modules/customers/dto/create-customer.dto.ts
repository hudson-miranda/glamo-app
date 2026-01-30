import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsDateString,
  IsObject,
  IsPhoneNumber,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerGender, CommunicationChannel } from '../interfaces';

/**
 * DTO para endereço do cliente
 */
export class CustomerAddressDto {
  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ example: '01234-567' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP deve ter formato válido' })
  zipCode?: string;

  @ApiPropertyOptional({ example: 'BR', default: 'BR' })
  @IsOptional()
  @IsString()
  country?: string;
}

/**
 * DTO para preferências do cliente
 */
export class CustomerPreferencesDto {
  @ApiPropertyOptional({ description: 'ID do profissional preferido' })
  @IsOptional()
  @IsString()
  preferredProfessionalId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs dos serviços preferidos',
    example: ['svc_1', 'svc_2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredServices?: string[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Dias preferidos (0=domingo, 6=sábado)',
    example: [1, 3, 5],
  })
  @IsOptional()
  @IsArray()
  preferredDays?: number[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Horários preferidos (HH:mm)',
    example: ['09:00', '14:00'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[];

  @ApiPropertyOptional({
    enum: CommunicationChannel,
    default: CommunicationChannel.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  communicationChannel?: CommunicationChannel;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  receivePromotions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  receiveBirthdayMessage?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  receiveReminders?: boolean;
}

/**
 * DTO para criação de cliente
 */
export class CreateCustomerDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome completo do cliente' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+5511999999999', description: 'Telefone com DDD' })
  @IsString()
  @Matches(/^\+?[1-9]\d{10,14}$/, { message: 'Telefone deve ter formato válido' })
  phone: string;

  @ApiPropertyOptional({ example: '123.456.789-00', description: 'CPF do cliente' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF deve ter formato válido' })
  cpf?: string;

  @ApiPropertyOptional({ example: '1990-05-15', description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: CustomerGender })
  @IsOptional()
  @IsEnum(CustomerGender)
  gender?: CustomerGender;

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  address?: CustomerAddressDto;

  @ApiPropertyOptional({ default: true, description: 'Aceita receber marketing' })
  @IsOptional()
  @IsBoolean()
  acceptsMarketing?: boolean;

  @ApiPropertyOptional({ example: 'Instagram', description: 'Fonte de aquisição' })
  @IsOptional()
  @IsString()
  acquisitionSource?: string;

  @ApiPropertyOptional({ description: 'ID do cliente que indicou' })
  @IsOptional()
  @IsString()
  referredBy?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['vip', 'premium'],
    description: 'Tags do cliente',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Notas sobre o cliente' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: CustomerPreferencesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerPreferencesDto)
  preferences?: CustomerPreferencesDto;
}
