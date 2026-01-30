import { Injectable } from '@nestjs/common';
import { PrismaService } from '@glamo/database';
import { TenantContext } from '@/core/tenancy';
import {
  ProductQueryDto,
  MovementQueryDto,
  AlertQueryDto,
  SupplierQueryDto,
  PurchaseOrderQueryDto,
} from '../dto';
import { ProductStatus, MovementType, AlertStatus, AlertType, PurchaseOrderStatus } from '../interfaces';

@Injectable()
export class InventoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private get tenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ========================
  // PRODUCTS
  // ========================

  async createProduct(data: any) {
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        stock: {
          ...data.stock,
          reserved: 0,
          available: data.stock.quantity,
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findProductById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, tenantId: this.tenantId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        batches: true,
      },
    });
  }

  async findProductBySku(sku: string) {
    return this.prisma.product.findFirst({
      where: { sku, tenantId: this.tenantId, deletedAt: null },
    });
  }

  async findProductByBarcode(barcode: string) {
    return this.prisma.product.findFirst({
      where: { barcode, tenantId: this.tenantId, deletedAt: null },
    });
  }

  async findProducts(query: ProductQueryDto) {
    const {
      search,
      type,
      status,
      categoryId,
      brandId,
      supplierId,
      lowStock,
      outOfStock,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId: this.tenantId, deletedAt: null };

    if (type) where.type = type;
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (supplierId) where.supplierId = supplierId;

    if (lowStock) {
      where.stock = { path: ['available'], lte: where.stock?.path?.['minStock'] || 10 };
    }

    if (outOfStock) {
      where.status = ProductStatus.OUT_OF_STOCK;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProduct(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async softDeleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: { not: ProductStatus.DISCONTINUED },
      },
    });
  }

  // ========================
  // STOCK MOVEMENTS
  // ========================

  async createMovement(data: any) {
    return this.prisma.stockMovement.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  async findMovements(query: MovementQueryDto) {
    const {
      productId,
      type,
      reason,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: any = { tenantId: this.tenantId };

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (reason) where.reason = reason;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========================
  // BATCHES
  // ========================

  async createBatch(data: any) {
    return this.prisma.productBatch.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        receivedAt: new Date(),
      },
    });
  }

  async findBatches(productId: string) {
    return this.prisma.productBatch.findMany({
      where: { productId, tenantId: this.tenantId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async findExpiringBatches(daysAhead: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return this.prisma.productBatch.findMany({
      where: {
        tenantId: this.tenantId,
        quantity: { gt: 0 },
        expiryDate: { lte: expiryDate },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ========================
  // ALERTS
  // ========================

  async createAlert(data: any) {
    return this.prisma.stockAlert.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async findAlerts(query: AlertQueryDto) {
    const { type, status, productId, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const [data, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockAlert.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateAlert(id: string, data: any) {
    return this.prisma.stockAlert.update({
      where: { id },
      data,
    });
  }

  async findPendingAlerts() {
    return this.prisma.stockAlert.findMany({
      where: {
        tenantId: this.tenantId,
        status: AlertStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================
  // SUPPLIERS
  // ========================

  async createSupplier(data: any) {
    return this.prisma.supplier.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        isActive: true,
      },
    });
  }

  async findSupplierById(id: string) {
    return this.prisma.supplier.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async findSuppliers(query: SupplierQueryDto) {
    const { search, activeOnly, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (activeOnly) where.isActive = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateSupplier(id: string, data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async deleteSupplier(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========================
  // PURCHASE ORDERS
  // ========================

  async createPurchaseOrder(data: any) {
    const number = await this.generatePurchaseOrderNumber();

    return this.prisma.purchaseOrder.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        number,
        status: PurchaseOrderStatus.DRAFT,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findPurchaseOrderById(id: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findPurchaseOrders(query: PurchaseOrderQueryDto) {
    const { search, status, supplierId, startDate, endDate, page = 1, limit = 20 } = query;

    const where: any = { tenantId: this.tenantId };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePurchaseOrder(id: string, data: any) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  // ========================
  // INVENTORY COUNT
  // ========================

  async createInventoryCount(data: any) {
    return this.prisma.inventoryCount.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async findInventoryCountById(id: string) {
    return this.prisma.inventoryCount.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async updateInventoryCount(id: string, data: any) {
    return this.prisma.inventoryCount.update({
      where: { id },
      data,
    });
  }

  // ========================
  // STATS
  // ========================

  async getStats() {
    const products = await this.prisma.product.groupBy({
      by: ['status'],
      where: { tenantId: this.tenantId, deletedAt: null },
      _count: true,
    });

    const alerts = await this.prisma.stockAlert.count({
      where: { tenantId: this.tenantId, status: AlertStatus.PENDING },
    });

    const lowStock = await this.prisma.product.count({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        status: { in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
      },
    });

    return {
      products: products.reduce(
        (acc, p) => ({ ...acc, [p.status]: p._count }),
        {},
      ),
      pendingAlerts: alerts,
      lowStockCount: lowStock,
    };
  }

  // ========================
  // CATEGORIES & BRANDS
  // ========================

  async createCategory(data: any) {
    return this.prisma.productCategory.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findCategories() {
    return this.prisma.productCategory.findMany({
      where: { tenantId: this.tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createBrand(data: any) {
    return this.prisma.productBrand.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findBrands() {
    return this.prisma.productBrand.findMany({
      where: { tenantId: this.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ========================
  // HELPERS
  // ========================

  private async generatePurchaseOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        tenantId: this.tenantId,
        number: { startsWith: `PO-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastOrder?.number) {
      const parts = lastOrder.number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `PO-${year}-${String(sequence).padStart(5, '0')}`;
  }
}
