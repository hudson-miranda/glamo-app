import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';
import { CheckLimit } from '@/core/tenancy/decorators/check-limit.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  UpdateCustomerTagsDto,
  AddLoyaltyPointsDto,
  AddCustomerNoteDto,
  ImportOptionsDto,
  CreateSegmentDto,
  UpdateSegmentDto,
  AddToSegmentDto,
  RemoveFromSegmentDto,
  MergeCustomersDto,
  FindDuplicatesDto,
  BulkUpdateDto,
  BulkAddTagsDto,
  BulkRemoveTagsDto,
  BulkDeleteDto,
} from './dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ==================== CRUD ====================

  @Post()
  @CheckLimit('customers')
  @ApiOperation({ summary: 'Criar cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Cliente já existe (email/telefone/cpf duplicado)' })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: any,
  ) {
    return this.customersService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async findMany(@Query() query: CustomerQueryDto) {
    return this.customersService.findMany(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais de clientes' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats() {
    return this.customersService.getStats();
  }

  @Get('birthdays')
  @ApiOperation({ summary: 'Listar aniversariantes' })
  @ApiResponse({ status: 200, description: 'Lista de aniversariantes' })
  async getBirthdays(
    @Query('month') month?: number,
    @Query('day') day?: number,
  ) {
    return this.customersService.getBirthdays(month, day);
  }

  @Get('inactive')
  @ApiOperation({ summary: 'Listar clientes inativos' })
  @ApiResponse({ status: 200, description: 'Lista de clientes inativos' })
  async getInactive(@Query('days') days = 90) {
    return this.customersService.getInactiveCustomers(days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do cliente' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: any,
  ) {
    return this.customersService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir cliente (soft delete)' })
  @ApiResponse({ status: 204, description: 'Cliente excluído' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('reason') reason?: string,
  ) {
    return this.customersService.delete(id, user.id, reason);
  }

  // ==================== TAGS ====================

  @Patch(':id/tags')
  @ApiOperation({ summary: 'Atualizar tags do cliente' })
  @ApiResponse({ status: 200, description: 'Tags atualizadas' })
  async updateTags(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerTagsDto,
  ) {
    return this.customersService.updateTags(id, dto);
  }

  // ==================== FIDELIDADE ====================

  @Post(':id/loyalty/points')
  @ApiOperation({ summary: 'Adicionar/subtrair pontos de fidelidade' })
  @ApiResponse({ status: 200, description: 'Pontos atualizados' })
  async addLoyaltyPoints(
    @Param('id') id: string,
    @Body() dto: AddLoyaltyPointsDto,
  ) {
    return this.customersService.addLoyaltyPoints(id, dto);
  }

  // ==================== NOTAS ====================

  @Post(':id/notes')
  @ApiOperation({ summary: 'Adicionar nota ao cliente' })
  @ApiResponse({ status: 201, description: 'Nota adicionada' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddCustomerNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.customersService.addNote(id, dto, user.id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Listar notas do cliente' })
  @ApiResponse({ status: 200, description: 'Lista de notas' })
  async getNotes(
    @Param('id') id: string,
    @Query('includePrivate') includePrivate = false,
  ) {
    return this.customersService.getNotes(id, includePrivate);
  }

  // ==================== HISTÓRICO E ANALYTICS ====================

  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de atendimentos do cliente' })
  @ApiResponse({ status: 200, description: 'Histórico de agendamentos' })
  async getHistory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.getAppointmentHistory(id, page, limit);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Analytics detalhado do cliente' })
  @ApiResponse({ status: 200, description: 'Analytics do cliente' })
  async getAnalytics(@Param('id') id: string) {
    return this.customersService.getAnalytics(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de interações do cliente' })
  @ApiResponse({ status: 200, description: 'Timeline de eventos' })
  async getTimeline(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.getTimeline(id, page, limit);
  }

  @Post(':id/recalculate-metrics')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Recalcular métricas do cliente' })
  @ApiResponse({ status: 204, description: 'Métricas recalculadas' })
  async recalculateMetrics(@Param('id') id: string) {
    return this.customersService.recalculateMetrics(id);
  }

  // ==================== IMPORTAÇÃO ====================

  @Post('import/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validar arquivo de importação' })
  @ApiResponse({ status: 200, description: 'Validação do arquivo' })
  async validateImport(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ImportOptionsDto,
  ) {
    return this.customersService.validateImport(file, options);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar clientes de CSV/Excel' })
  @ApiResponse({ status: 200, description: 'Resultado da importação' })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ImportOptionsDto,
  ) {
    return this.customersService.importCustomers(file, options);
  }

  // ==================== DUPLICADOS E MERGE ====================

  @Post('duplicates/find')
  @ApiOperation({ summary: 'Buscar clientes duplicados' })
  @ApiResponse({ status: 200, description: 'Grupos de duplicados encontrados' })
  async findDuplicates(@Body() dto: FindDuplicatesDto) {
    return this.customersService.findDuplicates(dto);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Mesclar clientes duplicados' })
  @ApiResponse({ status: 200, description: 'Resultado do merge' })
  async merge(@Body() dto: MergeCustomersDto) {
    return this.customersService.mergeCustomers(dto);
  }

  // ==================== OPERAÇÕES EM LOTE ====================

  @Post('bulk-update')
  @ApiOperation({ summary: 'Atualização em lote' })
  @ApiResponse({ status: 200, description: 'Resultado da atualização' })
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.customersService.bulkUpdate(dto);
  }

  @Post('bulk-add-tags')
  @ApiOperation({ summary: 'Adicionar tags em lote' })
  @ApiResponse({ status: 200, description: 'Resultado da operação' })
  async bulkAddTags(@Body() dto: BulkAddTagsDto) {
    return this.customersService.bulkAddTags(dto);
  }

  @Post('bulk-remove-tags')
  @ApiOperation({ summary: 'Remover tags em lote' })
  @ApiResponse({ status: 200, description: 'Resultado da operação' })
  async bulkRemoveTags(@Body() dto: BulkRemoveTagsDto) {
    return this.customersService.bulkRemoveTags(dto);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Exclusão em lote' })
  @ApiResponse({ status: 200, description: 'Resultado da exclusão' })
  async bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.customersService.bulkDelete(dto);
  }

  // ==================== SEGMENTAÇÃO ====================

  @Get('segments')
  @ApiOperation({ summary: 'Listar segmentos' })
  @ApiResponse({ status: 200, description: 'Lista de segmentos' })
  async listSegments() {
    return this.customersService.listSegments();
  }

  @Post('segments')
  @ApiOperation({ summary: 'Criar segmento' })
  @ApiResponse({ status: 201, description: 'Segmento criado' })
  async createSegment(@Body() dto: CreateSegmentDto) {
    return this.customersService.createSegment(dto);
  }

  @Patch('segments/:id')
  @ApiOperation({ summary: 'Atualizar segmento' })
  @ApiResponse({ status: 200, description: 'Segmento atualizado' })
  async updateSegment(
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.customersService.updateSegment(id, dto);
  }

  @Delete('segments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir segmento' })
  @ApiResponse({ status: 204, description: 'Segmento excluído' })
  async deleteSegment(@Param('id') id: string) {
    return this.customersService.deleteSegment(id);
  }

  @Get('segments/:id/customers')
  @ApiOperation({ summary: 'Listar clientes de um segmento' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async getSegmentCustomers(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.getSegmentCustomers(id, page, limit);
  }
}
