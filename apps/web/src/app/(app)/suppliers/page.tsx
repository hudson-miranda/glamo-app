/**
 * GLAMO - Suppliers List Page
 * Enterprise-grade supplier management interface
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Star,
  StarHalf,
  Package,
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  RefreshCcw,
  Trash2,
  ExternalLink,
  MapPin,
} from 'lucide-react';

import { cn, formatPhone, formatDocument } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import {
  useSuppliers,
  useSupplierStats,
  usePrefetchSupplier,
  type SupplierWithRelations,
  type SupplierFilters,
} from '@/hooks/useSuppliers';
import { SupplierStatus } from '@prisma/client';

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusVariant(status: SupplierStatus): 'default' | 'secondary' | 'destructive' {
  const variants: Record<SupplierStatus, 'default' | 'secondary' | 'destructive'> = {
    ACTIVE: 'default',
    INACTIVE: 'secondary',
    BLOCKED: 'destructive',
  };
  return variants[status];
}

function getStatusLabel(status: SupplierStatus): string {
  const labels: Record<SupplierStatus, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    BLOCKED: 'Bloqueado',
  };
  return labels[status];
}

function getRatingStars(rating: number | null): JSX.Element {
  if (rating === null) {
    return <span className="text-xs text-muted-foreground">Não avaliado</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }, (_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalf && <StarHalf className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
      {Array.from({ length: emptyStars }, (_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">({rating.toFixed(1)})</span>
    </div>
  );
}

// ============================================================================
// Stats Cards Component
// ============================================================================

interface StatsCardsProps {
  isLoading: boolean;
}

function StatsCards({ isLoading }: StatsCardsProps) {
  const { data: stats } = useSupplierStats();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-12 ml-auto" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total',
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Ativos',
      value: stats.active,
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Com produtos',
      value: stats.withProducts,
      icon: Package,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Avaliação média',
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={cn('p-2.5 rounded-lg', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
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
  filters: SupplierFilters;
  onFilterChange: (filters: Partial<SupplierFilters>) => void;
  onReset: () => void;
}

function FilterPanel({ filters, onFilterChange, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange({ status: value === 'all' ? undefined : (value as SupplierStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativos</SelectItem>
            <SelectItem value="INACTIVE">Inativos</SelectItem>
            <SelectItem value="BLOCKED">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avaliação mínima</label>
        <Select
          value={filters.minRating?.toString() || 'all'}
          onValueChange={(value) =>
            onFilterChange({ minRating: value === 'all' ? undefined : Number(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer avaliação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer</SelectItem>
            <SelectItem value="4">4+ estrelas</SelectItem>
            <SelectItem value="3">3+ estrelas</SelectItem>
            <SelectItem value="2">2+ estrelas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Contato</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasEmail"
              checked={filters.hasEmail === true}
              onCheckedChange={(checked) =>
                onFilterChange({ hasEmail: checked ? true : undefined })
              }
            />
            <label htmlFor="hasEmail" className="text-sm">
              Com e-mail
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasPhone"
              checked={filters.hasPhone === true}
              onCheckedChange={(checked) =>
                onFilterChange({ hasPhone: checked ? true : undefined })
              }
            />
            <label htmlFor="hasPhone" className="text-sm">
              Com telefone
            </label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="text-sm font-medium">Ordenar por</label>
        <Select
          value={filters.sortBy || 'name'}
          onValueChange={(value) =>
            onFilterChange({ sortBy: value as SupplierFilters['sortBy'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="rating">Avaliação</SelectItem>
            <SelectItem value="createdAt">Data de criação</SelectItem>
            <SelectItem value="updatedAt">Última atualização</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ordem</label>
        <Select
          value={filters.sortOrder || 'asc'}
          onValueChange={(value) =>
            onFilterChange({ sortOrder: value as 'asc' | 'desc' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Crescente</SelectItem>
            <SelectItem value="desc">Decrescente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Button variant="outline" className="w-full" onClick={onReset}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Limpar filtros
      </Button>
    </div>
  );
}

// ============================================================================
// Supplier Card Component (Grid View)
// ============================================================================

interface SupplierCardProps {
  supplier: SupplierWithRelations;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPrefetch: () => void;
}

function SupplierCard({ supplier, isSelected, onToggleSelect, onPrefetch }: SupplierCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        'group transition-all hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-primary'
      )}
      onMouseEnter={onPrefetch}
      onClick={() => router.push(`/suppliers/${supplier.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
            >
              <Checkbox checked={isSelected} />
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <Badge variant={getStatusVariant(supplier.status)}>
            {getStatusLabel(supplier.status)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="font-semibold line-clamp-1">{supplier.name}</h3>
            {supplier.tradeName && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {supplier.tradeName}
              </p>
            )}
          </div>

          {getRatingStars(supplier.rating)}

          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {supplier.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{formatPhone(supplier.phone)}</span>
              </div>
            )}
          </div>

          {supplier._count?.products !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{supplier._count.products} produto(s)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Supplier Row Component (Table View)
// ============================================================================

interface SupplierRowProps {
  supplier: SupplierWithRelations;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPrefetch: () => void;
}

function SupplierRow({ supplier, isSelected, onToggleSelect, onPrefetch }: SupplierRowProps) {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer"
      onMouseEnter={onPrefetch}
      onClick={() => router.push(`/suppliers/${supplier.id}`)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{supplier.name}</p>
            {supplier.tradeName && (
              <p className="text-sm text-muted-foreground">{supplier.tradeName}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {supplier.document ? formatDocument(supplier.document, supplier.documentType) : '—'}
      </TableCell>
      <TableCell>
        <div className="space-y-0.5">
          {supplier.email && (
            <p className="text-sm">{supplier.email}</p>
          )}
          {supplier.phone && (
            <p className="text-sm text-muted-foreground">{formatPhone(supplier.phone)}</p>
          )}
          {!supplier.email && !supplier.phone && (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>{getRatingStars(supplier.rating)}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(supplier.status)}>
          {getStatusLabel(supplier.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/suppliers/${supplier.id}`)}>
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                // Handle delete
              }}
            >
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
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-28" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {hasFilters ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
        </h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {hasFilters
            ? 'Tente ajustar os filtros ou realizar uma nova busca.'
            : 'Comece cadastrando seu primeiro fornecedor para gerenciar suas compras.'}
        </p>
        {!hasFilters && (
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

function Pagination({ page, totalPages, onPageChange, disabled }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Próxima
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SuppliersPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const prefetchSupplier = usePrefetchSupplier();

  const {
    suppliers,
    pagination,
    isLoading,
    isError,
    filters,
    updateFilters,
    resetFilters,
    setPage,
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
    isBulkOperating,
    refetch,
  } = useSuppliers();

  const hasFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.status ||
      filters.hasEmail ||
      filters.hasPhone ||
      filters.minRating
    );
  }, [filters]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilters({ search: searchQuery });
    },
    [searchQuery, updateFilters]
  );

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/suppliers/export');
      if (!response.ok) throw new Error('Erro ao exportar');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  }, []);

  const handleBulkDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    bulkDelete();
    setShowDeleteDialog(false);
  }, [bulkDelete]);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie seus fornecedores e parceiros comerciais
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button asChild>
              <Link href="/suppliers/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards isLoading={isLoading} />

        {/* Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, documento, e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Buscar
                </Button>
              </form>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filtros
                      {hasFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center">
                          !
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                      <SheetDescription>
                        Refine sua busca de fornecedores
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        filters={filters}
                        onFilterChange={updateFilters}
                        onReset={resetFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="ghost" size="icon" onClick={() => refetch()}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === suppliers.length}
                    onCheckedChange={(checked) => {
                      if (checked) selectAll();
                      else clearSelection();
                    }}
                  />
                  <span className="text-sm font-medium">
                    {selectedCount} selecionado(s)
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Limpar
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkActivate}
                    disabled={isBulkOperating}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Ativar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkDeactivate}
                    disabled={isBulkOperating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Desativar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={handleBulkDelete}
                    disabled={isBulkOperating}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          viewMode === 'grid' ? <GridSkeleton /> : <TableSkeleton />
        ) : suppliers.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                isSelected={isSelected(supplier.id)}
                onToggleSelect={() => toggleSelection(supplier.id)}
                onPrefetch={() => prefetchSupplier(supplier.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCount === suppliers.length && suppliers.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) selectAll();
                        else clearSelection();
                      }}
                    />
                  </TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    isSelected={isSelected(supplier.id)}
                    onToggleSelect={() => toggleSelection(supplier.id)}
                    onPrefetch={() => prefetchSupplier(supplier.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            disabled={isLoading}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir fornecedores?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedCount} fornecedor(es)? 
                Fornecedores com produtos vinculados não serão excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
