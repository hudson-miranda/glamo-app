/**
 * GLAMO - Category Types
 * Hierarchical category system for services, products, and financial
 * 
 * @version 1.0.0
 * @description Unified category system with tree structure
 */

import {
  UUID,
  ISODateTime,
  EntityStatus,
  AuditFields,
} from './base';

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/** Category domain */
export type CategoryDomain = 
  | 'service'
  | 'product'
  | 'financial_income'
  | 'financial_expense'
  | 'supplier'
  | 'customer_tag';

// ============================================================================
// BASE CATEGORY INTERFACE
// ============================================================================

/** Base category structure */
export interface BaseCategory extends AuditFields {
  id: UUID;
  tenantId: UUID;
  domain: CategoryDomain;
  parentId?: UUID;
  
  // Basic info
  name: string;
  description?: string;
  slug: string;
  
  // Display
  icon?: string;
  color: string;
  imageUrl?: string;
  
  // Hierarchy
  level: number;
  path: string; // Full path like "Cabelo/Coloração"
  pathIds: UUID[]; // Array of parent IDs
  
  // Ordering
  order: number;
  
  // Status
  isActive: boolean;
  isSystem: boolean; // System-defined, cannot be deleted
  
  // Metrics
  itemCount: number;
  
  // Children (for tree views)
  children?: BaseCategory[];
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE CATEGORY
// ============================================================================

/** Service category with domain-specific fields */
export interface ServiceCategory extends BaseCategory {
  domain: 'service';
  
  // Online booking visibility
  showInOnlineBooking: boolean;
  
  // Commission defaults
  defaultCommissionPercentage?: string;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// ============================================================================
// PRODUCT CATEGORY
// ============================================================================

/** Product category with domain-specific fields */
export interface ProductCategory extends BaseCategory {
  domain: 'product';
  
  // Display settings
  showInPOS: boolean;
  showInOnlineStore: boolean;
  
  // Inventory defaults
  defaultMinimumStock?: string;
  defaultReorderQuantity?: string;
  
  // Tax defaults
  defaultTaxRate?: string;
  defaultNcm?: string;
}

// ============================================================================
// FINANCIAL CATEGORY
// ============================================================================

/** Financial category with domain-specific fields */
export interface FinancialCategory extends BaseCategory {
  domain: 'financial_income' | 'financial_expense';
  
  // Budget tracking
  monthlyBudget?: string;
  
  // Auto-categorization rules
  autoRules?: {
    keywords: string[];
    supplierId?: UUID;
    professionalId?: UUID;
  };
}

// ============================================================================
// CATEGORY TREE NODE
// ============================================================================

/** Node for tree display */
export interface CategoryTreeNode {
  id: UUID;
  parentId?: UUID;
  name: string;
  slug: string;
  icon?: string;
  color: string;
  level: number;
  order: number;
  isActive: boolean;
  itemCount: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  children: CategoryTreeNode[];
}

// ============================================================================
// CATEGORY FILTERS
// ============================================================================

/** Category filter options */
export interface CategoryFilters {
  domain?: CategoryDomain;
  parentId?: UUID | null;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
  level?: number;
}

// ============================================================================
// CATEGORY FORM DATA
// ============================================================================

/** Data for creating a category */
export interface CreateCategoryData {
  domain: CategoryDomain;
  parentId?: UUID;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
  
  // Domain-specific fields
  showInOnlineBooking?: boolean;
  showInPOS?: boolean;
  showInOnlineStore?: boolean;
  defaultCommissionPercentage?: string;
  defaultMinimumStock?: string;
  defaultTaxRate?: string;
  monthlyBudget?: string;
  
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  
  metadata?: Record<string, unknown>;
}

/** Data for updating a category */
export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  // Cannot change domain
  domain?: never;
}

/** Data for reordering categories */
export interface ReorderCategoryData {
  categoryId: UUID;
  newParentId?: UUID | null;
  newOrder: number;
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/** Bulk update result */
export interface CategoryBulkUpdateResult {
  updated: number;
  failed: number;
  errors: {
    categoryId: UUID;
    error: string;
  }[];
}

/** Category move result */
export interface CategoryMoveResult {
  success: boolean;
  movedCategory: BaseCategory;
  affectedCategories: UUID[];
  error?: string;
}

// ============================================================================
// CATEGORY UTILITIES
// ============================================================================

/** Build tree from flat list */
export function buildCategoryTree(categories: BaseCategory[]): CategoryTreeNode[] {
  const map = new Map<UUID, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // First pass: create nodes
  categories.forEach(cat => {
    map.set(cat.id, {
      id: cat.id,
      parentId: cat.parentId,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      level: cat.level,
      order: cat.order,
      isActive: cat.isActive,
      itemCount: cat.itemCount,
      children: [],
    });
  });

  // Second pass: build tree
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort children by order
  const sortChildren = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(roots);

  return roots;
}

/** Flatten tree to list */
export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  
  const traverse = (nodes: CategoryTreeNode[]) => {
    nodes.forEach(node => {
      result.push(node);
      traverse(node.children);
    });
  };
  
  traverse(tree);
  return result;
}

/** Get category path */
export function getCategoryPath(categoryId: UUID, categories: BaseCategory[]): BaseCategory[] {
  const path: BaseCategory[] = [];
  let current = categories.find(c => c.id === categoryId);
  
  while (current) {
    path.unshift(current);
    current = current.parentId 
      ? categories.find(c => c.id === current!.parentId)
      : undefined;
  }
  
  return path;
}

/** Get all descendant IDs */
export function getCategoryDescendants(categoryId: UUID, categories: BaseCategory[]): UUID[] {
  const descendants: UUID[] = [];
  
  const collect = (parentId: UUID) => {
    categories
      .filter(c => c.parentId === parentId)
      .forEach(c => {
        descendants.push(c.id);
        collect(c.id);
      });
  };
  
  collect(categoryId);
  return descendants;
}

// ============================================================================
// DEFAULT CATEGORIES
// ============================================================================

/** Default service categories */
export const DEFAULT_SERVICE_CATEGORIES: Omit<ServiceCategory, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [
  {
    domain: 'service',
    name: 'Cabelo',
    description: 'Serviços para cabelo',
    slug: 'cabelo',
    icon: 'Scissors',
    color: '#8B5CF6',
    level: 0,
    path: 'Cabelo',
    pathIds: [],
    order: 1,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInOnlineBooking: true,
  },
  {
    domain: 'service',
    name: 'Unhas',
    description: 'Serviços para unhas',
    slug: 'unhas',
    icon: 'Hand',
    color: '#EC4899',
    level: 0,
    path: 'Unhas',
    pathIds: [],
    order: 2,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInOnlineBooking: true,
  },
  {
    domain: 'service',
    name: 'Estética',
    description: 'Tratamentos estéticos',
    slug: 'estetica',
    icon: 'Sparkles',
    color: '#06B6D4',
    level: 0,
    path: 'Estética',
    pathIds: [],
    order: 3,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInOnlineBooking: true,
  },
  {
    domain: 'service',
    name: 'Maquiagem',
    description: 'Serviços de maquiagem',
    slug: 'maquiagem',
    icon: 'Palette',
    color: '#F59E0B',
    level: 0,
    path: 'Maquiagem',
    pathIds: [],
    order: 4,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInOnlineBooking: true,
  },
  {
    domain: 'service',
    name: 'Depilação',
    description: 'Serviços de depilação',
    slug: 'depilacao',
    icon: 'Zap',
    color: '#10B981',
    level: 0,
    path: 'Depilação',
    pathIds: [],
    order: 5,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInOnlineBooking: true,
  },
];

/** Default product categories */
export const DEFAULT_PRODUCT_CATEGORIES: Omit<ProductCategory, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [
  {
    domain: 'product',
    name: 'Produtos para Cabelo',
    description: 'Shampoos, condicionadores, etc.',
    slug: 'cabelo',
    icon: 'Droplet',
    color: '#8B5CF6',
    level: 0,
    path: 'Produtos para Cabelo',
    pathIds: [],
    order: 1,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInPOS: true,
    showInOnlineStore: true,
  },
  {
    domain: 'product',
    name: 'Esmaltes',
    description: 'Esmaltes e produtos para unhas',
    slug: 'esmaltes',
    icon: 'Brush',
    color: '#EC4899',
    level: 0,
    path: 'Esmaltes',
    pathIds: [],
    order: 2,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInPOS: true,
    showInOnlineStore: true,
  },
  {
    domain: 'product',
    name: 'Cosméticos',
    description: 'Maquiagem e cosméticos',
    slug: 'cosmeticos',
    icon: 'Sparkles',
    color: '#F59E0B',
    level: 0,
    path: 'Cosméticos',
    pathIds: [],
    order: 3,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInPOS: true,
    showInOnlineStore: true,
  },
  {
    domain: 'product',
    name: 'Insumos',
    description: 'Insumos e materiais consumíveis',
    slug: 'insumos',
    icon: 'Package',
    color: '#6B7280',
    level: 0,
    path: 'Insumos',
    pathIds: [],
    order: 4,
    isActive: true,
    isSystem: true,
    itemCount: 0,
    showInPOS: false,
    showInOnlineStore: false,
  },
];
