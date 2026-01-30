import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/core/tenancy/tenant.guard';
import { ServicesService } from './services.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
  CreateServiceDto,
  UpdateServiceDto,
  ReorderServicesDto,
  DuplicateServiceDto,
  BulkUpdateServicesDto,
  AddProfessionalToServiceDto,
  ServiceQueryDto,
  CategoryQueryDto,
  CalculatePriceDto,
} from './dto';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ========================
  // CATEGORIES
  // ========================

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria de serviço' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.servicesService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async findCategories(@Query() query: CategoryQueryDto) {
    return this.servicesService.findCategories(query);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findCategoryById(id);
  }

  @Get('categories/:id/services')
  @ApiOperation({ summary: 'Listar serviços de uma categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  async findServicesByCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findByCategory(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.servicesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 204, description: 'Categoria deletada' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.deleteCategory(id);
  }

  @Post('categories/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar categorias' })
  @ApiResponse({ status: 200, description: 'Categorias reordenadas' })
  async reorderCategories(@Body() dto: ReorderCategoriesDto) {
    return this.servicesService.reorderCategories(dto);
  }

  // ========================
  // SERVICES
  // ========================

  @Post()
  @ApiOperation({ summary: 'Criar serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado' })
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar serviços' })
  @ApiResponse({ status: 200, description: 'Lista paginada de serviços' })
  async findMany(@Query() query: ServiceQueryDto) {
    return this.servicesService.findMany(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de serviços' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats() {
    return this.servicesService.getStats();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Serviços populares' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de serviços populares' })
  async getPopularServices(@Query('limit') limit?: number) {
    return this.servicesService.getPopularServices(limit);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Serviços em destaque' })
  @ApiResponse({ status: 200, description: 'Lista de serviços em destaque' })
  async getFeaturedServices() {
    return this.servicesService.getFeaturedServices();
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Buscar serviço por slug' })
  @ApiParam({ name: 'slug', description: 'Slug do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  async findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }

  @Get('by-professional/:professionalId')
  @ApiOperation({ summary: 'Listar serviços de um profissional' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  async findByProfessional(@Param('professionalId', ParseUUIDPipe) professionalId: string) {
    return this.servicesService.findByProfessional(professionalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar serviço (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 204, description: 'Serviço deletado' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.delete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar serviço deletado' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço restaurado' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.restore(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 201, description: 'Serviço duplicado' })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateServiceDto,
  ) {
    return this.servicesService.duplicate(id, dto);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar serviços' })
  @ApiResponse({ status: 200, description: 'Serviços reordenados' })
  async reorderServices(@Body() dto: ReorderServicesDto) {
    return this.servicesService.reorderServices(dto);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Atualizar serviços em lote' })
  @ApiResponse({ status: 200, description: 'Resultado da operação' })
  async bulkUpdate(@Body() dto: BulkUpdateServicesDto) {
    return this.servicesService.bulkUpdate(dto);
  }

  // ========================
  // PROFESSIONALS
  // ========================

  @Post(':id/professionals')
  @ApiOperation({ summary: 'Adicionar profissional ao serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Profissional adicionado' })
  async addProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProfessionalToServiceDto,
  ) {
    return this.servicesService.addProfessional(id, dto);
  }

  @Delete(':id/professionals/:professionalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover profissional do serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiResponse({ status: 204, description: 'Profissional removido' })
  async removeProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
  ) {
    return this.servicesService.removeProfessional(id, professionalId);
  }

  // ========================
  // PRICING
  // ========================

  @Post(':id/calculate-price')
  @ApiOperation({ summary: 'Calcular preço do serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Cálculo de preço' })
  async calculatePrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CalculatePriceDto,
  ) {
    return this.servicesService.calculatePrice(id, dto);
  }

  @Post(':id/calculate-duration')
  @ApiOperation({ summary: 'Calcular duração do serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Cálculo de duração' })
  async calculateDuration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { optionId?: string; professionalId?: string },
  ) {
    return this.servicesService.calculateDuration(id, dto);
  }
}
