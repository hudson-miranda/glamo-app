/**
 * GLAMO - Supplier Service
 * Business logic layer for supplier management
 * 
 * @version 2.0.0
 * @description Multi-tenant supplier management aligned with Prisma schema
 * 
 * Prisma Supplier model fields:
 * - id, tenantId, name, contactName, email, phone, cnpj
 * - address, notes, isActive, createdAt, updatedAt
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES - Aligned with Prisma schema
// ============================================================================

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    products?: number;
  };
}

export interface SupplierFormData {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierListResult {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class SupplierService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  async create(data: SupplierFormData): Promise<Supplier> {
    // Check for duplicate CNPJ
    if (data.cnpj) {
      const existing = await prisma.supplier.findFirst({
        where: {
          tenantId: this.tenantId,
          cnpj: data.cnpj,
          isActive: true,
        },
      });

      if (existing) {
        throw new Error('Já existe um fornecedor com este CNPJ');
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        cnpj: data.cnpj || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    return this.mapToSupplier(supplier);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  async getById(id: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isActive: true,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!supplier) return null;

    return this.mapToSupplier(supplier);
  }

  async list(params: SupplierListParams = {}): Promise<SupplierListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
    } = params;

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { products: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers: suppliers.map((s) => this.mapToSupplier(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAll(): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    return suppliers.map((s) => this.mapToSupplier(s));
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  async update(id: string, data: Partial<SupplierFormData>): Promise<Supplier> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Fornecedor não encontrado');
    }

    if (data.cnpj && data.cnpj !== existing.cnpj) {
      const duplicate = await prisma.supplier.findFirst({
        where: {
          tenantId: this.tenantId,
          cnpj: data.cnpj,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new Error('Já existe um fornecedor com este CNPJ');
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        cnpj: data.cnpj,
        address: data.address,
        notes: data.notes,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    return this.mapToSupplier(supplier);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Fornecedor não encontrado');
    }

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private mapToSupplier(supplier: Record<string, unknown>): Supplier {
    return {
      id: supplier.id as string,
      tenantId: supplier.tenantId as string,
      name: supplier.name as string,
      contactName: supplier.contactName as string | null,
      email: supplier.email as string | null,
      phone: supplier.phone as string | null,
      cnpj: supplier.cnpj as string | null,
      address: supplier.address as string | null,
      notes: supplier.notes as string | null,
      isActive: supplier.isActive as boolean,
      createdAt: supplier.createdAt as Date,
      updatedAt: supplier.updatedAt as Date,
      _count: supplier._count as Supplier['_count'],
    };
  }
}

// ============================================================================
// FACTORY FUNCTION - For API routes
// ============================================================================

export function createSupplierService(tenantId: string): SupplierService {
  return new SupplierService(tenantId);
}
