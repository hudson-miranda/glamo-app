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
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockSettingsDto,
  StockAdjustmentDto,
  CreateBatchDto,
  BulkStockAdjustmentDto,
  StartInventoryCountDto,
  SubmitInventoryCountDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  ProductQueryDto,
  MovementQueryDto,
  AlertQueryDto,
  SupplierQueryDto,
  PurchaseOrderQueryDto,
} from './dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ========================
  // PRODUCTS
  // ========================

  @Post('products')
  @ApiOperation({ summary: 'Criar produto' })
  @ApiResponse({ status: 201, description: 'Produto criado' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findProducts(@Query() query: ProductQueryDto) {
    return this.inventoryService.findProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  async findProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findProductById(id);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(id, dto);
  }

  @Patch('products/:id/stock-settings')
  @ApiOperation({ summary: 'Atualizar configurações de estoque' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas' })
  async updateStockSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockSettingsDto,
  ) {
    return this.inventoryService.updateStockSettings(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.deleteProduct(id);
  }

  // ========================
  // STOCK
  // ========================

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Ajustar estoque' })
  @ApiResponse({ status: 201, description: 'Movimento registrado' })
  async adjustStock(@Body() dto: StockAdjustmentDto, @CurrentUser() user: any) {
    return this.inventoryService.adjustStock(dto, user.id);
  }

  @Post('stock/bulk-adjust')
  @ApiOperation({ summary: 'Ajuste de estoque em lote' })
  @ApiResponse({ status: 201, description: 'Movimentos registrados' })
  async bulkAdjustStock(@Body() dto: BulkStockAdjustmentDto, @CurrentUser() user: any) {
    return this.inventoryService.bulkAdjustStock(dto, user.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimentações' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findMovements(@Query() query: MovementQueryDto) {
    return this.inventoryService.findMovements(query);
  }

  // ========================
  // BATCHES
  // ========================

  @Post('batches')
  @ApiOperation({ summary: 'Criar lote' })
  @ApiResponse({ status: 201, description: 'Lote criado' })
  async createBatch(@Body() dto: CreateBatchDto) {
    return this.inventoryService.createBatch(dto);
  }

  @Get('products/:id/batches')
  @ApiOperation({ summary: 'Listar lotes do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Lista de lotes' })
  async findBatches(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findBatches(id);
  }

  @Get('batches/expiring')
  @ApiOperation({ summary: 'Lotes próximos do vencimento' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de lotes' })
  async findExpiringBatches(@Query('daysAhead') daysAhead?: number) {
    return this.inventoryService.findExpiringBatches(daysAhead);
  }

  // ========================
  // ALERTS
  // ========================

  @Get('alerts')
  @ApiOperation({ summary: 'Listar alertas' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findAlerts(@Query() query: AlertQueryDto) {
    return this.inventoryService.findAlerts(query);
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Reconhecer alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 200, description: 'Alerta reconhecido' })
  async acknowledgeAlert(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.inventoryService.acknowledgeAlert(id, user.id);
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolver alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 200, description: 'Alerta resolvido' })
  async resolveAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.resolveAlert(id);
  }

  @Post('alerts/:id/ignore')
  @ApiOperation({ summary: 'Ignorar alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 200, description: 'Alerta ignorado' })
  async ignoreAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.ignoreAlert(id);
  }

  // ========================
  // SUPPLIERS
  // ========================

  @Post('suppliers')
  @ApiOperation({ summary: 'Criar fornecedor' })
  @ApiResponse({ status: 201, description: 'Fornecedor criado' })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(dto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Listar fornecedores' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findSuppliers(@Query() query: SupplierQueryDto) {
    return this.inventoryService.findSuppliers(query);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor encontrado' })
  async findSupplierById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findSupplierById(id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor atualizado' })
  async updateSupplier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.inventoryService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor' })
  @ApiResponse({ status: 204, description: 'Deletado' })
  async deleteSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.deleteSupplier(id);
  }

  // ========================
  // PURCHASE ORDERS
  // ========================

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Criar pedido de compra' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.inventoryService.createPurchaseOrder(dto, user.id);
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  async findPurchaseOrders(@Query() query: PurchaseOrderQueryDto) {
    return this.inventoryService.findPurchaseOrders(query);
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  async findPurchaseOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findPurchaseOrderById(id);
  }

  @Patch('purchase-orders/:id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado' })
  async updatePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.inventoryService.updatePurchaseOrder(id, dto);
  }

  @Post('purchase-orders/:id/approve')
  @ApiOperation({ summary: 'Aprovar pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido aprovado' })
  async approvePurchaseOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.inventoryService.approvePurchaseOrder(id, user.id);
  }

  @Post('purchase-orders/:id/receive')
  @ApiOperation({ summary: 'Receber produtos do pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Produtos recebidos' })
  async receivePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.receivePurchaseOrder(id, dto, user.id);
  }

  @Post('purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  async cancelPurchaseOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.cancelPurchaseOrder(id);
  }

  // ========================
  // INVENTORY COUNT
  // ========================

  @Post('counts')
  @ApiOperation({ summary: 'Iniciar contagem de inventário' })
  @ApiResponse({ status: 201, description: 'Contagem iniciada' })
  async startInventoryCount(@Body() dto: StartInventoryCountDto, @CurrentUser() user: any) {
    return this.inventoryService.startInventoryCount(dto, user.id);
  }

  @Post('counts/:id/submit')
  @ApiOperation({ summary: 'Submeter contagem' })
  @ApiParam({ name: 'id', description: 'ID da contagem' })
  @ApiResponse({ status: 200, description: 'Contagem submetida' })
  async submitInventoryCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitInventoryCountDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.submitInventoryCount(id, dto, user.id);
  }

  // ========================
  // CATEGORIES & BRANDS
  // ========================

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async findCategories() {
    return this.inventoryService.findCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  async createCategory(@Body() dto: { name: string; parentId?: string }) {
    return this.inventoryService.createCategory(dto.name, dto.parentId);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listar marcas' })
  @ApiResponse({ status: 200, description: 'Lista de marcas' })
  async findBrands() {
    return this.inventoryService.findBrands();
  }

  @Post('brands')
  @ApiOperation({ summary: 'Criar marca' })
  @ApiResponse({ status: 201, description: 'Marca criada' })
  async createBrand(@Body() dto: { name: string; logo?: string }) {
    return this.inventoryService.createBrand(dto.name, dto.logo);
  }

  // ========================
  // STATS
  // ========================

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do inventário' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats() {
    return this.inventoryService.getStats();
  }
}
