import api from '@/lib/api';
import { PaginatedResponse } from './appointments.service';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: ProductCategory;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  supplierId?: string;
  supplier?: { id: string; name: string };
  isActive: boolean;
  image?: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  productsCount: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  notes?: string;
  userId: string;
  user: { id: string; name: string };
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

export interface MovementQuery {
  page?: number;
  limit?: number;
  productId?: string;
  type?: 'in' | 'out' | 'adjustment';
  startDate?: string;
  endDate?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  cost: number;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
  supplierId?: string;
}

export interface CreateMovementRequest {
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  notes?: string;
}

export const inventoryService = {
  // Products
  async listProducts(query?: ProductQuery): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>('/inventory/products', {
      params: query,
    });
    return response.data;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await api.get<Product>(`/inventory/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<Product>('/inventory/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
    const response = await api.patch<Product>(`/inventory/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/inventory/products/${id}`);
  },

  // Stock Movements
  async listMovements(query?: MovementQuery): Promise<PaginatedResponse<StockMovement>> {
    const response = await api.get<PaginatedResponse<StockMovement>>('/inventory/movements', {
      params: query,
    });
    return response.data;
  },

  async createMovement(data: CreateMovementRequest): Promise<StockMovement> {
    const response = await api.post<StockMovement>('/inventory/movements', data);
    return response.data;
  },

  // Categories
  async listCategories(): Promise<ProductCategory[]> {
    const response = await api.get<ProductCategory[]>('/inventory/categories');
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }): Promise<ProductCategory> {
    const response = await api.post<ProductCategory>('/inventory/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: { name?: string; description?: string }): Promise<ProductCategory> {
    const response = await api.patch<ProductCategory>(`/inventory/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/inventory/categories/${id}`);
  },

  // Suppliers
  async listSuppliers(): Promise<Supplier[]> {
    const response = await api.get<Supplier[]>('/inventory/suppliers');
    return response.data;
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.post<Supplier>('/inventory/suppliers', data);
    return response.data;
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.patch<Supplier>(`/inventory/suppliers/${id}`, data);
    return response.data;
  },

  // Low Stock Alert
  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get<Product[]>('/inventory/low-stock');
    return response.data;
  },

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/inventory/suppliers/${id}`);
  },

  async getSummary(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    categories: number;
  }> {
    const response = await api.get('/inventory/summary');
    return response.data;
  },
};
