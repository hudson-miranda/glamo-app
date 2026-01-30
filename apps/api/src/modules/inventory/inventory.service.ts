import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryRepository } from './repositories';
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
import {
  ProductStatus,
  MovementType,
  MovementReason,
  AlertType,
  AlertStatus,
  PurchaseOrderStatus,
} from './interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly repository: InventoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================
  // PRODUCTS
  // ========================

  async createProduct(dto: CreateProductDto): Promise<any> {
    // Verificar SKU único
    const existing = await this.repository.findProductBySku(dto.sku);
    if (existing) {
      throw new ConflictException('Já existe um produto com este SKU');
    }

    // Verificar barcode se fornecido
    if (dto.barcode) {
      const byBarcode = await this.repository.findProductByBarcode(dto.barcode);
      if (byBarcode) {
        throw new ConflictException('Já existe um produto com este código de barras');
      }
    }

    const product = await this.repository.createProduct({
      ...dto,
      status: dto.status || ProductStatus.ACTIVE,
      trackInventory: dto.trackInventory ?? true,
      trackBatches: dto.trackBatches ?? false,
      allowNegativeStock: dto.allowNegativeStock ?? false,
    });

    // Criar movimento de entrada inicial se houver quantidade
    if (dto.stock.quantity > 0) {
      await this.repository.createMovement({
        productId: product.id,
        type: MovementType.IN,
        reason: MovementReason.PURCHASE,
        quantity: dto.stock.quantity,
        previousQuantity: 0,
        newQuantity: dto.stock.quantity,
        unitCost: dto.pricing.costPrice,
        totalCost: dto.stock.quantity * dto.pricing.costPrice,
        userId: 'system',
        notes: 'Estoque inicial',
      });
    }

    this.eventEmitter.emit('inventory.product_created', { product });

    return product;
  }

  async findProductById(id: string): Promise<any> {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async findProducts(query: ProductQueryDto) {
    return this.repository.findProducts(query);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<any> {
    const existing = await this.findProductById(id);

    // Verificar SKU se mudou
    if (dto.sku && dto.sku !== existing.sku) {
      const bySku = await this.repository.findProductBySku(dto.sku);
      if (bySku) {
        throw new ConflictException('Já existe um produto com este SKU');
      }
    }

    // Verificar barcode se mudou
    if (dto.barcode && dto.barcode !== existing.barcode) {
      const byBarcode = await this.repository.findProductByBarcode(dto.barcode);
      if (byBarcode) {
        throw new ConflictException('Já existe um produto com este código de barras');
      }
    }

    const product = await this.repository.updateProduct(id, dto);

    this.eventEmitter.emit('inventory.product_updated', { product, changes: dto });

    return product;
  }

  async updateStockSettings(id: string, dto: UpdateStockSettingsDto): Promise<any> {
    await this.findProductById(id);

    return this.repository.updateProduct(id, {
      stock: dto,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.findProductById(id);
    await this.repository.softDeleteProduct(id);

    this.eventEmitter.emit('inventory.product_deleted', { productId: id });
  }

  // ========================
  // STOCK ADJUSTMENTS
  // ========================

  async adjustStock(dto: StockAdjustmentDto, userId: string): Promise<any> {
    const product = await this.findProductById(dto.productId);
    const currentQuantity = product.stock?.available || 0;

    let newQuantity: number;
    if (dto.type === MovementType.IN || dto.type === MovementType.RETURN) {
      newQuantity = currentQuantity + dto.quantity;
    } else if (dto.type === MovementType.ADJUSTMENT) {
      // Adjustment pode ser positivo ou negativo
      newQuantity = currentQuantity + dto.quantity;
    } else {
      newQuantity = currentQuantity - dto.quantity;
    }

    // Verificar estoque negativo
    if (newQuantity < 0 && !product.allowNegativeStock) {
      throw new BadRequestException('Estoque insuficiente');
    }

    // Atualizar estoque do produto
    await this.repository.updateProduct(dto.productId, {
      stock: {
        ...product.stock,
        quantity: newQuantity,
        available: newQuantity - (product.stock?.reserved || 0),
      },
      status: newQuantity <= 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE,
    });

    // Registrar movimento
    const movement = await this.repository.createMovement({
      productId: dto.productId,
      type: dto.type,
      reason: dto.reason,
      quantity: dto.quantity,
      previousQuantity: currentQuantity,
      newQuantity,
      unitCost: dto.unitCost,
      totalCost: dto.unitCost ? dto.quantity * dto.unitCost : undefined,
      batchId: dto.batchId,
      userId,
      notes: dto.notes,
    });

    // Verificar alertas
    await this.checkStockAlerts(dto.productId, newQuantity, product.stock);

    this.eventEmitter.emit('inventory.stock_adjusted', { movement, product });

    return movement;
  }

  async bulkAdjustStock(dto: BulkStockAdjustmentDto, userId: string): Promise<any[]> {
    const results = [];

    for (const item of dto.items) {
      const result = await this.adjustStock(
        {
          productId: item.productId,
          type: dto.type,
          reason: dto.reason,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: dto.notes,
        },
        userId,
      );
      results.push(result);
    }

    return results;
  }

  async reserveStock(productId: string, quantity: number): Promise<void> {
    const product = await this.findProductById(productId);
    const available = product.stock?.available || 0;

    if (quantity > available) {
      throw new BadRequestException('Estoque insuficiente para reserva');
    }

    await this.repository.updateProduct(productId, {
      stock: {
        ...product.stock,
        reserved: (product.stock?.reserved || 0) + quantity,
        available: available - quantity,
      },
    });
  }

  async releaseStock(productId: string, quantity: number): Promise<void> {
    const product = await this.findProductById(productId);

    await this.repository.updateProduct(productId, {
      stock: {
        ...product.stock,
        reserved: Math.max(0, (product.stock?.reserved || 0) - quantity),
        available: (product.stock?.available || 0) + quantity,
      },
    });
  }

  // ========================
  // BATCHES
  // ========================

  async createBatch(dto: CreateBatchDto): Promise<any> {
    await this.findProductById(dto.productId);

    const batch = await this.repository.createBatch({
      ...dto,
      id: uuidv4(),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined,
    });

    // Criar movimento de entrada
    await this.adjustStock(
      {
        productId: dto.productId,
        type: MovementType.IN,
        reason: MovementReason.PURCHASE,
        quantity: dto.quantity,
        batchId: batch.id,
      },
      'system',
    );

    return batch;
  }

  async findBatches(productId: string) {
    return this.repository.findBatches(productId);
  }

  async findExpiringBatches(daysAhead?: number) {
    return this.repository.findExpiringBatches(daysAhead);
  }

  // ========================
  // MOVEMENTS
  // ========================

  async findMovements(query: MovementQueryDto) {
    return this.repository.findMovements(query);
  }

  // ========================
  // ALERTS
  // ========================

  async findAlerts(query: AlertQueryDto) {
    return this.repository.findAlerts(query);
  }

  async acknowledgeAlert(id: string, userId: string): Promise<any> {
    return this.repository.updateAlert(id, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    });
  }

  async resolveAlert(id: string): Promise<any> {
    return this.repository.updateAlert(id, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    });
  }

  async ignoreAlert(id: string): Promise<any> {
    return this.repository.updateAlert(id, {
      status: AlertStatus.IGNORED,
    });
  }

  private async checkStockAlerts(productId: string, quantity: number, stockConfig: any): Promise<void> {
    const product = await this.repository.findProductById(productId);

    // Alerta de estoque baixo
    if (quantity <= stockConfig.minStock && quantity > 0) {
      await this.repository.createAlert({
        type: AlertType.LOW_STOCK,
        status: AlertStatus.PENDING,
        productId,
        productName: product?.name || '',
        message: `Estoque baixo: ${quantity} unidades (mínimo: ${stockConfig.minStock})`,
        data: { currentQuantity: quantity, minStock: stockConfig.minStock },
      });
    }

    // Alerta de estoque zerado
    if (quantity <= 0) {
      await this.repository.createAlert({
        type: AlertType.OUT_OF_STOCK,
        status: AlertStatus.PENDING,
        productId,
        productName: product?.name || '',
        message: 'Produto sem estoque',
        data: { currentQuantity: quantity },
      });
    }

    // Alerta de ponto de reposição
    if (quantity <= stockConfig.reorderPoint) {
      await this.repository.createAlert({
        type: AlertType.REORDER_POINT,
        status: AlertStatus.PENDING,
        productId,
        productName: product?.name || '',
        message: `Ponto de reposição atingido: ${quantity} unidades`,
        data: { currentQuantity: quantity, reorderPoint: stockConfig.reorderPoint },
      });
    }
  }

  // ========================
  // SUPPLIERS
  // ========================

  async createSupplier(dto: CreateSupplierDto): Promise<any> {
    const supplier = await this.repository.createSupplier(dto);

    this.eventEmitter.emit('inventory.supplier_created', { supplier });

    return supplier;
  }

  async findSupplierById(id: string): Promise<any> {
    const supplier = await this.repository.findSupplierById(id);
    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }
    return supplier;
  }

  async findSuppliers(query: SupplierQueryDto) {
    return this.repository.findSuppliers(query);
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto): Promise<any> {
    await this.findSupplierById(id);
    return this.repository.updateSupplier(id, dto);
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.findSupplierById(id);
    await this.repository.deleteSupplier(id);
  }

  // ========================
  // PURCHASE ORDERS
  // ========================

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string): Promise<any> {
    const supplier = await this.findSupplierById(dto.supplierId);

    // Buscar informações dos produtos
    const items = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.findProductById(item.productId);
        return {
          ...item,
          id: uuidv4(),
          productName: product.name,
          sku: product.sku,
          totalCost: item.quantity * item.unitCost,
          receivedQuantity: 0,
        };
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    const total = subtotal - (dto.discount || 0) + (dto.shipping || 0) + (dto.tax || 0);

    const purchaseOrder = await this.repository.createPurchaseOrder({
      supplierId: dto.supplierId,
      supplierName: supplier.name,
      items,
      subtotal,
      discount: dto.discount || 0,
      shipping: dto.shipping || 0,
      tax: dto.tax || 0,
      total,
      expectedDeliveryDate: dto.expectedDeliveryDate
        ? new Date(dto.expectedDeliveryDate)
        : undefined,
      notes: dto.notes,
      createdBy: userId,
    });

    this.eventEmitter.emit('inventory.purchase_order_created', { purchaseOrder });

    return purchaseOrder;
  }

  async findPurchaseOrderById(id: string): Promise<any> {
    const order = await this.repository.findPurchaseOrderById(id);
    if (!order) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }
    return order;
  }

  async findPurchaseOrders(query: PurchaseOrderQueryDto) {
    return this.repository.findPurchaseOrders(query);
  }

  async updatePurchaseOrder(id: string, dto: UpdatePurchaseOrderDto): Promise<any> {
    const existing = await this.findPurchaseOrderById(id);

    if (existing.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Somente pedidos em rascunho podem ser editados');
    }

    return this.repository.updatePurchaseOrder(id, dto);
  }

  async approvePurchaseOrder(id: string, userId: string): Promise<any> {
    const order = await this.findPurchaseOrderById(id);

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Pedido não está em rascunho');
    }

    const updated = await this.repository.updatePurchaseOrder(id, {
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    this.eventEmitter.emit('inventory.purchase_order_approved', { purchaseOrder: updated });

    return updated;
  }

  async receivePurchaseOrder(id: string, dto: ReceivePurchaseOrderDto, userId: string): Promise<any> {
    const order = await this.findPurchaseOrderById(id);

    if (![PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIAL].includes(order.status)) {
      throw new BadRequestException('Pedido não pode receber produtos');
    }

    // Atualizar itens recebidos e dar entrada no estoque
    const updatedItems = order.items.map((item: any) => {
      const received = dto.items.find((r) => r.itemId === item.id);
      if (received) {
        return {
          ...item,
          receivedQuantity: (item.receivedQuantity || 0) + received.receivedQuantity,
        };
      }
      return item;
    });

    // Criar movimentos de entrada
    for (const received of dto.items) {
      const item = order.items.find((i: any) => i.id === received.itemId);
      if (item) {
        // Criar lote se informado
        if (received.batchNumber) {
          await this.createBatch({
            productId: item.productId,
            batchNumber: received.batchNumber,
            quantity: received.receivedQuantity,
            expiryDate: received.expiryDate,
            supplierId: order.supplierId,
          });
        } else {
          await this.adjustStock(
            {
              productId: item.productId,
              type: MovementType.IN,
              reason: MovementReason.PURCHASE,
              quantity: received.receivedQuantity,
              unitCost: item.unitCost,
            },
            userId,
          );
        }
      }
    }

    // Verificar se todos os itens foram recebidos
    const allReceived = updatedItems.every(
      (item: any) => item.receivedQuantity >= item.quantity,
    );
    const anyReceived = updatedItems.some((item: any) => item.receivedQuantity > 0);

    let newStatus = order.status;
    if (allReceived) {
      newStatus = PurchaseOrderStatus.RECEIVED;
    } else if (anyReceived) {
      newStatus = PurchaseOrderStatus.PARTIAL;
    }

    const updated = await this.repository.updatePurchaseOrder(id, {
      items: updatedItems,
      status: newStatus,
      receivedAt: allReceived ? new Date() : undefined,
    });

    this.eventEmitter.emit('inventory.purchase_order_received', { purchaseOrder: updated });

    return updated;
  }

  async cancelPurchaseOrder(id: string): Promise<any> {
    const order = await this.findPurchaseOrderById(id);

    if ([PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Pedido não pode ser cancelado');
    }

    return this.repository.updatePurchaseOrder(id, {
      status: PurchaseOrderStatus.CANCELLED,
    });
  }

  // ========================
  // INVENTORY COUNT
  // ========================

  async startInventoryCount(dto: StartInventoryCountDto, userId: string): Promise<any> {
    const products = await this.repository.findProducts({
      categoryId: dto.categoryId,
      limit: 1000,
    });

    const items = products.data
      .filter((p: any) => !dto.productIds?.length || dto.productIds.includes(p.id))
      .map((p: any) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        systemQuantity: p.stock?.quantity || 0,
        countedQuantity: 0,
        difference: 0,
      }));

    const count = await this.repository.createInventoryCount({
      date: new Date(),
      status: 'IN_PROGRESS',
      items,
      totalDifference: 0,
      differenceCost: 0,
      startedBy: userId,
      notes: dto.notes,
    });

    return count;
  }

  async submitInventoryCount(countId: string, dto: SubmitInventoryCountDto, userId: string): Promise<any> {
    const count = await this.repository.findInventoryCountById(countId);
    if (!count) {
      throw new NotFoundException('Contagem não encontrada');
    }

    if (count.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Contagem não está em andamento');
    }

    let totalDifference = 0;
    let differenceCost = 0;

    // Atualizar itens com contagem
    const updatedItems = count.items.map((item: any) => {
      const counted = dto.items.find((i) => i.productId === item.productId);
      if (counted) {
        const difference = counted.countedQuantity - item.systemQuantity;
        totalDifference += difference;
        return {
          ...item,
          countedQuantity: counted.countedQuantity,
          difference,
          notes: counted.notes,
        };
      }
      return item;
    });

    // Aplicar ajustes de estoque
    for (const item of updatedItems) {
      if (item.difference !== 0) {
        await this.adjustStock(
          {
            productId: item.productId,
            type: MovementType.ADJUSTMENT,
            reason: MovementReason.INVENTORY_COUNT,
            quantity: item.difference,
            notes: `Contagem de inventário #${countId}`,
          },
          userId,
        );
      }
    }

    const updated = await this.repository.updateInventoryCount(countId, {
      items: updatedItems,
      status: 'COMPLETED',
      totalDifference,
      differenceCost,
      completedBy: userId,
      completedAt: new Date(),
      notes: dto.notes || count.notes,
    });

    this.eventEmitter.emit('inventory.count_completed', { count: updated });

    return updated;
  }

  // ========================
  // CATEGORIES & BRANDS
  // ========================

  async createCategory(name: string, parentId?: string): Promise<any> {
    return this.repository.createCategory({
      name,
      parentId,
      sortOrder: 0,
      isActive: true,
    });
  }

  async findCategories() {
    return this.repository.findCategories();
  }

  async createBrand(name: string, logo?: string): Promise<any> {
    return this.repository.createBrand({
      name,
      logo,
      isActive: true,
    });
  }

  async findBrands() {
    return this.repository.findBrands();
  }

  // ========================
  // STATS
  // ========================

  async getStats() {
    return this.repository.getStats();
  }
}
