import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { TenantContext } from '@/core/tenancy/tenant-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ImportOptionsDto,
  ImportResultDto,
  ImportRowResultDto,
  ValidateImportFileDto,
  ColumnMappingDto,
  DuplicateAction,
} from '../dto';
import { CustomerCreatedEvent, CustomerUpdatedEvent } from '../events';
import { CustomersRepository } from '../repositories';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';

/**
 * Mapeamento padrão de colunas
 */
const DEFAULT_COLUMN_MAPPING: Record<string, string[]> = {
  name: ['nome', 'name', 'cliente', 'customer', 'nome completo', 'full name'],
  email: ['email', 'e-mail', 'correio', 'mail'],
  phone: ['telefone', 'phone', 'celular', 'mobile', 'whatsapp', 'tel', 'fone'],
  cpf: ['cpf', 'documento', 'document', 'cpf/cnpj'],
  birthDate: ['nascimento', 'data nascimento', 'birthdate', 'birth date', 'aniversário'],
  gender: ['sexo', 'gênero', 'gender'],
  notes: ['observação', 'observações', 'notas', 'notes', 'obs'],
  tags: ['tags', 'etiquetas', 'categorias'],
  address: ['endereço', 'address', 'endereco'],
  city: ['cidade', 'city'],
  state: ['estado', 'state', 'uf'],
  zipCode: ['cep', 'zip', 'zipcode', 'zip code'],
};

/**
 * Serviço de importação de clientes
 */
@Injectable()
export class CustomerImportService {
  private readonly logger = new Logger(CustomerImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly eventEmitter: EventEmitter2,
    private readonly customersRepository: CustomersRepository,
  ) {}

  /**
   * Valida arquivo antes da importação
   */
  async validateFile(
    file: Express.Multer.File,
    options: ImportOptionsDto,
  ): Promise<ValidateImportFileDto> {
    const data = await this.parseFile(file, options);

    if (data.length === 0) {
      throw new BadRequestException('Arquivo vazio ou formato inválido');
    }

    // Detectar colunas
    const detectedColumns = Object.keys(data[0]);

    // Sugerir mapeamento
    const suggestedMapping = this.suggestColumnMapping(detectedColumns);

    // Preview das primeiras linhas
    const previewRows = data.slice(0, 5);

    // Verificar duplicados potenciais
    const duplicateField = options.duplicateField || 'phone';
    const values = data
      .map((row) => this.getValueByMapping(row, duplicateField, suggestedMapping))
      .filter((v) => v);

    const uniqueValues = new Set(values);
    const potentialDuplicates = values.length - uniqueValues.size;

    // Verificar erros de validação básicos
    const validationErrors: string[] = [];

    // Verificar se tem coluna de nome
    const hasName = suggestedMapping.some((m) => m.targetField === 'name');
    if (!hasName) {
      validationErrors.push('Coluna de nome não detectada');
    }

    // Verificar se tem coluna de telefone ou email
    const hasContact = suggestedMapping.some((m) =>
      ['phone', 'email'].includes(m.targetField),
    );
    if (!hasContact) {
      validationErrors.push('Nenhuma coluna de contato (telefone ou email) detectada');
    }

    return {
      previewRows,
      detectedColumns,
      suggestedMapping,
      totalRows: data.length,
      potentialDuplicates,
      validationErrors,
    };
  }

  /**
   * Importa clientes de arquivo
   */
  async importCustomers(
    file: Express.Multer.File,
    options: ImportOptionsDto,
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const data = await this.parseFile(file, options);

    if (data.length === 0) {
      throw new BadRequestException('Arquivo vazio ou formato inválido');
    }

    // Usar mapeamento personalizado ou sugerir
    const columnMapping =
      options.columnMapping || this.suggestColumnMapping(Object.keys(data[0]));

    const results: ImportRowResultDto[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + (options.hasHeader ? 2 : 1);

      try {
        // Normalizar dados
        const normalized = this.normalizeCustomerData(row, columnMapping, options);

        // Validar dados mínimos
        if (!normalized.name || (!normalized.phone && !normalized.email)) {
          results.push({
            row: rowNumber,
            status: 'error',
            error: 'Nome e pelo menos um contato (telefone ou email) são obrigatórios',
            data: row,
          });
          errors++;
          continue;
        }

        // Verificar duplicados
        const existing = await this.findDuplicate(normalized, options.duplicateField);

        if (existing) {
          if (options.duplicateAction === DuplicateAction.UPDATE && !options.dryRun) {
            // Atualizar existente
            await this.prisma.customer.update({
              where: { id: existing.id },
              data: {
                ...normalized,
                updatedAt: new Date(),
              },
            });

            results.push({
              row: rowNumber,
              status: 'updated',
              customerId: existing.id,
            });
            updated++;

            this.eventEmitter.emit(
              'customer.updated',
              new CustomerUpdatedEvent(
                {
                  id: existing.id,
                  tenantId: existing.tenantId,
                  name: existing.name,
                  email: existing.email || undefined,
                  phone: existing.phone,
                  tags: existing.tags as string[],
                },
                [{ field: 'import', oldValue: null, newValue: 'updated' }],
                'IMPORT',
              ),
            );
          } else if (options.duplicateAction === DuplicateAction.CREATE && !options.dryRun) {
            // Criar mesmo assim (pode criar duplicado)
            const customer = await this.createCustomer(normalized, options);
            results.push({
              row: rowNumber,
              status: 'created',
              customerId: customer.id,
            });
            created++;
          } else {
            // Skip
            results.push({
              row: rowNumber,
              status: 'skipped',
              customerId: existing.id,
            });
            skipped++;
          }
        } else if (!options.dryRun) {
          // Criar novo
          const customer = await this.createCustomer(normalized, options);
          results.push({
            row: rowNumber,
            status: 'created',
            customerId: customer.id,
          });
          created++;
        } else {
          // Dry run - seria criado
          results.push({
            row: rowNumber,
            status: 'created',
          });
          created++;
        }
      } catch (error) {
        this.logger.error(`Erro na linha ${rowNumber}: ${error.message}`);
        results.push({
          row: rowNumber,
          status: 'error',
          error: error.message,
          data: row,
        });
        errors++;
      }
    }

    return {
      totalRows: data.length,
      created,
      updated,
      skipped,
      errors,
      details: results,
      processingTimeMs: Date.now() - startTime,
      dryRun: options.dryRun || false,
    };
  }

  /**
   * Parse do arquivo
   */
  private async parseFile(
    file: Express.Multer.File,
    options: ImportOptionsDto,
  ): Promise<Record<string, any>[]> {
    const buffer = file.buffer;

    if (options.format === 'excel' || file.originalname.match(/\.xlsx?$/i)) {
      return this.parseExcel(buffer, options);
    } else if (options.format === 'json' || file.originalname.match(/\.json$/i)) {
      return this.parseJson(buffer);
    } else {
      return this.parseCsv(buffer, options);
    }
  }

  /**
   * Parse CSV
   */
  private parseCsv(buffer: Buffer, options: ImportOptionsDto): Record<string, any>[] {
    const content = buffer.toString(options.encoding as BufferEncoding || 'utf-8');

    return csvParse(content, {
      columns: options.hasHeader !== false,
      delimiter: options.delimiter || ',',
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });
  }

  /**
   * Parse Excel
   */
  private parseExcel(buffer: Buffer, options: ImportOptionsDto): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(sheet, {
      header: options.hasHeader === false ? 1 : undefined,
      defval: '',
    });
  }

  /**
   * Parse JSON
   */
  private parseJson(buffer: Buffer): Record<string, any>[] {
    const content = buffer.toString('utf-8');
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      return parsed.data;
    }

    throw new BadRequestException('Formato JSON inválido');
  }

  /**
   * Sugere mapeamento de colunas
   */
  private suggestColumnMapping(columns: string[]): ColumnMappingDto[] {
    const mapping: ColumnMappingDto[] = [];

    for (const column of columns) {
      const normalizedColumn = column.toLowerCase().trim();

      for (const [targetField, aliases] of Object.entries(DEFAULT_COLUMN_MAPPING)) {
        if (aliases.includes(normalizedColumn) || normalizedColumn === targetField) {
          mapping.push({
            sourceColumn: column,
            targetField,
          });
          break;
        }
      }
    }

    return mapping;
  }

  /**
   * Obtém valor usando mapeamento
   */
  private getValueByMapping(
    row: Record<string, any>,
    targetField: string,
    mapping: ColumnMappingDto[],
  ): any {
    const map = mapping.find((m) => m.targetField === targetField);
    if (map) {
      return row[map.sourceColumn];
    }
    return null;
  }

  /**
   * Normaliza dados do cliente
   */
  private normalizeCustomerData(
    row: Record<string, any>,
    mapping: ColumnMappingDto[],
    options: ImportOptionsDto,
  ): any {
    const data: any = {};

    for (const map of mapping) {
      let value = row[map.sourceColumn];

      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Aplicar transformações
      if (map.transform) {
        value = this.applyTransform(value, map.transform);
      }

      // Normalizar campos específicos
      switch (map.targetField) {
        case 'phone':
          data.phone = this.normalizePhone(String(value));
          break;
        case 'cpf':
          data.cpf = this.normalizeCpf(String(value));
          break;
        case 'email':
          data.email = String(value).toLowerCase().trim();
          break;
        case 'birthDate':
          data.birthDate = this.parseDate(value);
          break;
        case 'gender':
          data.gender = this.normalizeGender(String(value));
          break;
        case 'tags':
          data.tags = this.parseTags(value, options.defaultTags);
          break;
        default:
          data[map.targetField] = String(value).trim();
      }
    }

    // Adicionar tags e fonte padrão
    if (options.defaultTags && options.defaultTags.length > 0) {
      data.tags = [...new Set([...(data.tags || []), ...options.defaultTags])];
    }

    if (options.defaultAcquisitionSource) {
      data.acquisitionSource = options.defaultAcquisitionSource;
    }

    return data;
  }

  /**
   * Aplica transformação
   */
  private applyTransform(value: any, transform: string): any {
    const str = String(value);

    switch (transform) {
      case 'uppercase':
        return str.toUpperCase();
      case 'lowercase':
        return str.toLowerCase();
      case 'trim':
        return str.trim();
      case 'phone':
        return this.normalizePhone(str);
      case 'cpf':
        return this.normalizeCpf(str);
      case 'date':
        return this.parseDate(str);
      default:
        return str;
    }
  }

  /**
   * Normaliza telefone
   */
  private normalizePhone(phone: string): string {
    // Remove tudo exceto dígitos
    let digits = phone.replace(/\D/g, '');

    // Adiciona código do país se não tiver
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }

    // Adiciona + no início
    return '+' + digits;
  }

  /**
   * Normaliza CPF
   */
  private normalizeCpf(cpf: string): string {
    // Remove tudo exceto dígitos
    return cpf.replace(/\D/g, '').padStart(11, '0');
  }

  /**
   * Parse de data
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    const str = String(value).trim();

    // Tenta diferentes formatos
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = str.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        } else if (format === formats[1]) {
          return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        } else if (format === formats[2]) {
          return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        }
      }
    }

    // Tentar parse nativo
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Normaliza gênero
   */
  private normalizeGender(value: string): string | null {
    const normalized = value.toLowerCase().trim();

    if (['m', 'masc', 'masculino', 'male'].includes(normalized)) {
      return 'M';
    }
    if (['f', 'fem', 'feminino', 'female'].includes(normalized)) {
      return 'F';
    }
    if (['o', 'outro', 'other', 'outros'].includes(normalized)) {
      return 'OTHER';
    }

    return null;
  }

  /**
   * Parse de tags
   */
  private parseTags(value: any, defaultTags?: string[]): string[] {
    const tags = new Set<string>(defaultTags || []);

    if (typeof value === 'string') {
      value.split(/[,;|]/).forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) tags.add(trimmed.toLowerCase());
      });
    } else if (Array.isArray(value)) {
      value.forEach((tag) => {
        if (tag) tags.add(String(tag).trim().toLowerCase());
      });
    }

    return Array.from(tags);
  }

  /**
   * Busca duplicado
   */
  private async findDuplicate(data: any, field = 'phone'): Promise<any> {
    if (field === 'phone' && data.phone) {
      return this.customersRepository.findByPhone(data.phone);
    }
    if (field === 'email' && data.email) {
      return this.customersRepository.findByEmail(data.email);
    }
    if (field === 'cpf' && data.cpf) {
      return this.customersRepository.findByCpf(data.cpf);
    }
    return null;
  }

  /**
   * Cria cliente
   */
  private async createCustomer(data: any, options: ImportOptionsDto): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
        acceptsMarketing: true,
        loyaltyPoints: 0,
        tags: data.tags || [],
      },
    });

    this.eventEmitter.emit(
      'customer.created',
      new CustomerCreatedEvent(
        {
          id: customer.id,
          tenantId: customer.tenantId,
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone,
          tags: customer.tags as string[],
        },
        'IMPORT',
        'IMPORT',
      ),
    );

    return customer;
  }
}
