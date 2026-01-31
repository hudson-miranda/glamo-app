/**
 * GLAMO - Products List Page
 * Enterprise-grade product management with inventory, grid/table views
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageSearch,
  PackageX,
  DollarSign,
  BarChart3,
  Boxes,
  RefreshCcw,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useProducts, useProductStats, useLowStock } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductWithRelations, ProductFilters, ProductSortOptions } from '@/lib/services/productService';
import { ProductStatus } from '@prisma/client';
import { getStockStatus } from '@/lib/services/productService';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'table';

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards() {
  const { stats, isLoading } = useProductStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Produtos',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Produtos Ativos',
      value: stats?.activeProducts || 0,
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Estoque Baixo',
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Valor em Estoque',
      value: formatCurrency(stats?.totalValue || 0),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      isText: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn('rounded-full p-2', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {card.isText ? card.value : card.value.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Filter Panel Component
// ============================================================================

interface FilterPanelProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onReset: () => void;
}

function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const hasFilters = Object.values(filters).some((v) => 
    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status as string || 'all'}
          onValueChange={(value) => 
            onChange({ ...filters, status: value === 'all' ? undefined : value as ProductStatus })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Sem estoque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estoque</Label>
        <Select
          value={
            filters.hasStock === true
              ? 'has_stock'
              : filters.hasStock === false
              ? 'no_stock'
              : filters.lowStock
              ? 'low_stock'
              : 'all'
          }
          onValueChange={(value) => {
            const newFilters = { ...filters };
            delete newFilters.hasStock;
            delete newFilters.lowStock;

            if (value === 'has_stock') newFilters.hasStock = true;
            else if (value === 'no_stock') newFilters.hasStock = false;
            else if (value === 'low_stock') newFilters.lowStock = true;

            onChange(newFilters);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer estoque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer estoque</SelectItem>
            <SelectItem value="has_stock">Em estoque</SelectItem>
            <SelectItem value="no_stock">Sem estoque</SelectItem>
            <SelectItem value="low_stock">Estoque baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={
            filters.isSellable === true
              ? 'sellable'
              : filters.isConsumable === true
              ? 'consumable'
              : 'all'
          }
          onValueChange={(value) => {
            const newFilters = { ...filters };
            delete newFilters.isSellable;
            delete newFilters.isConsumable;

            if (value === 'sellable') newFilters.isSellable = true;
            else if (value === 'consumable') newFilters.isConsumable = true;

            onChange(newFilters);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer tipo</SelectItem>
            <SelectItem value="sellable">Para venda</SelectItem>
            <SelectItem value="consumable">Consumível</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Preço mínimo</Label>
          <Input
            type="number"
            placeholder="R$ 0,00"
            value={filters.minPrice || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Preço máximo</Label>
          <Input
            type="number"
            placeholder="R$ 999,99"
            value={filters.maxPrice || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {hasFilters && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Product Card Component (Grid View)
// ============================================================================

interface ProductCardProps {
  product: ProductWithRelations;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

function ProductCard({
  product,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: ProductCardProps) {
  const stockStatus = getStockStatus({
    currentStock: product.currentStock,
    minStock: product.minStock,
    maxStock: product.maxStock,
  });

  const isActive = product.status === 'ACTIVE';
  const costPrice = product.costPrice ? Number(product.costPrice) : 0;
  const salePrice = Number(product.salePrice);
  const margin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  return (
    <Card className={cn(
      'relative transition-all hover:shadow-md',
      isSelected && 'ring-2 ring-primary',
      !isActive && 'opacity-70'
    )}>
      {/* Selection checkbox */}
      <div className="absolute left-3 top-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Selecionar ${product.name}`}
        />
      </div>

      {/* Image */}
      <div className="relative h-32 bg-muted rounded-t-lg flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover rounded-t-lg"
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground/40" />
        )}
        
        {/* Status badge */}
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="absolute right-2 top-2 text-xs"
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-1">
              {product.name}
            </CardTitle>
            {product.sku && (
              <p className="text-xs text-muted-foreground mt-0.5">
                SKU: {product.sku}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem onClick={onDeactivate}>
                  <X className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onActivate}>
                  <Check className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {product.category && (
          <Badge variant="outline" className="text-xs">
            {product.category.name}
          </Badge>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Preço</p>
            <p className="font-semibold">{formatCurrency(salePrice)}</p>
          </div>
          {margin > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className="text-sm text-green-600">{margin.toFixed(1)}%</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{product.currentStock} {product.unit}</span>
          </div>
          <Badge variant={stockStatus.variant} className="text-xs">
            {stockStatus.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Product Row Component (Table View)
// ============================================================================

interface ProductRowProps {
  product: ProductWithRelations;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

function ProductRow({
  product,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: ProductRowProps) {
  const stockStatus = getStockStatus({
    currentStock: product.currentStock,
    minStock: product.minStock,
    maxStock: product.maxStock,
  });

  const isActive = product.status === 'ACTIVE';
  const costPrice = product.costPrice ? Number(product.costPrice) : 0;
  const salePrice = Number(product.salePrice);

  return (
    <TableRow className={cn(!isActive && 'opacity-70')}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Selecionar ${product.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            {product.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {product.category ? (
          <Badge variant="outline" className="text-xs">
            {product.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <span className="font-medium">{formatCurrency(salePrice)}</span>
        {costPrice > 0 && (
          <p className="text-xs text-muted-foreground">
            Custo: {formatCurrency(costPrice)}
          </p>
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{product.currentStock}</span>
          <Badge variant={stockStatus.variant} className="text-xs">
            {stockStatus.label}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isActive ? (
              <DropdownMenuItem onClick={onDeactivate}>
                <X className="mr-2 h-4 w-4" />
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onActivate}>
                <Check className="mr-2 h-4 w-4" />
                Ativar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Loading Skeletons
// ============================================================================

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i}>
          <Skeleton className="h-32 w-full rounded-t-lg rounded-b-none" />
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-14" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><Skeleton className="h-10 w-48" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ hasFilters, onResetFilters }: { hasFilters: boolean; onResetFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageSearch className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
      <p className="mt-1 text-muted-foreground max-w-sm">
        {hasFilters
          ? 'Tente ajustar os filtros para ver mais resultados.'
          : 'Comece adicionando o primeiro produto ao seu catálogo.'}
      </p>
      <div className="mt-4 flex gap-2">
        {hasFilters && (
          <Button variant="outline" onClick={onResetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        )}
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {start} a {end} de {total} produto(s)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | 'bulk' | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<ProductSortOptions>({
    field: 'name',
    direction: 'asc',
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Merge search into filters
  const activeFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
    }),
    [filters, debouncedSearch]
  );

  // Query
  const {
    products,
    total,
    totalPages,
    hasMore,
    isLoading,
    isFetching,
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
    isBulkActing,
    refetch,
  } = useProducts({
    filters: activeFilters,
    sort,
    page,
    limit: viewMode === 'grid' ? 12 : 20,
  });

  // Handlers
  const hasFilters = useMemo(
    () =>
      Object.entries(activeFilters).some(
        ([key, value]) =>
          key !== 'search' && value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
      ),
    [activeFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(products.map((p) => p.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [products]
  );

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleBulkActivate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkActivate(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, bulkActivate]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkDeactivate(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, bulkDeactivate]);

  const handleDelete = useCallback(async () => {
    if (deleteTarget === 'bulk') {
      await bulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (deleteTarget) {
      await bulkDelete([deleteTarget]);
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }, [deleteTarget, selectedIds, bulkDelete]);

  const confirmBulkDelete = useCallback(() => {
    setDeleteTarget('bulk');
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback((id: string) => {
    setDeleteTarget(id);
    setShowDeleteDialog(true);
  }, []);

  const navigateToProduct = useCallback((id: string) => {
    router.push(`/products/${id}`);
  }, [router]);

  const navigateToEdit = useCallback((id: string) => {
    router.push(`/products/${id}/edit`);
  }, [router]);

  const isAllSelected = products.length > 0 && selectedIds.size === products.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < products.length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos e estoque
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {hasFilters && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine a lista de produtos
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel
                  filters={filters}
                  onChange={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                  }}
                  onReset={resetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [
                ProductSortOptions['field'],
                ProductSortOptions['direction']
              ];
              setSort({ field, direction });
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="salePrice-asc">Preço (menor)</SelectItem>
              <SelectItem value="salePrice-desc">Preço (maior)</SelectItem>
              <SelectItem value="currentStock-asc">Estoque (menor)</SelectItem>
              <SelectItem value="currentStock-desc">Estoque (maior)</SelectItem>
              <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
              <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selecionado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={isBulkActing}
              >
                <Check className="mr-2 h-4 w-4" />
                Ativar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={isBulkActing}
              >
                <X className="mr-2 h-4 w-4" />
                Desativar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={confirmBulkDelete}
                disabled={isBulkActing}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'grid' ? <GridSkeleton /> : <TableSkeleton />
      ) : products.length === 0 ? (
        <EmptyState hasFilters={hasFilters || !!debouncedSearch} onResetFilters={resetFilters} />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedIds.has(product.id)}
              onSelect={(checked) => handleSelectOne(product.id, checked)}
              onView={() => navigateToProduct(product.id)}
              onEdit={() => navigateToEdit(product.id)}
              onDelete={() => confirmDelete(product.id)}
              onActivate={async () => {
                await bulkActivate([product.id]);
              }}
              onDeactivate={async () => {
                await bulkDeactivate([product.id]);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(ref) => {
                      if (ref) {
                        (ref as any).indeterminate = isPartiallySelected;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.has(product.id)}
                  onSelect={(checked) => handleSelectOne(product.id, checked)}
                  onView={() => navigateToProduct(product.id)}
                  onEdit={() => navigateToEdit(product.id)}
                  onDelete={() => confirmDelete(product.id)}
                  onActivate={async () => {
                    await bulkActivate([product.id]);
                  }}
                  onDeactivate={async () => {
                    await bulkDeactivate([product.id]);
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={viewMode === 'grid' ? 12 : 20}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'bulk'
                ? `Tem certeza que deseja excluir ${selectedIds.size} produto(s)? Esta ação pode ser revertida.`
                : 'Tem certeza que deseja excluir este produto? Esta ação pode ser revertida.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
