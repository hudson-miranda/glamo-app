/**
 * GLAMO - Categories List Page
 * Enterprise-grade category management with tree view support
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Tag,
  Grid3X3,
  List,
  TreePine,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GripVertical,
  LayoutGrid,
  Layers,
  Package,
  Settings2,
  Copy,
  Archive,
  RotateCcw,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hooks
import {
  useCategories,
  useCategoryTree,
  useCategoryStats,
  useCategoryMutations,
} from '@/hooks/useCategories';

// Types
import type { Category, CategoryTreeNode } from '@/types/category';

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards() {
  const { stats, isLoading } = useCategoryStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statsData = [
    {
      title: 'Total de Categorias',
      value: stats.total,
      description: `${stats.active} ativas, ${stats.inactive} inativas`,
      icon: Folder,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Categorias Ativas',
      value: stats.active,
      description: `${((stats.active / stats.total) * 100 || 0).toFixed(0)}% do total`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Com Serviços',
      value: stats.withServices,
      description: 'Categorias com serviços vinculados',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Com Subcategorias',
      value: stats.withChildren,
      description: 'Categorias com filhas',
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
  filters: {
    search: string;
    status?: 'active' | 'inactive';
    rootOnly?: boolean;
  };
  onFiltersChange: (filters: Partial<typeof filters>) => void;
  onReset: () => void;
}

function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
  const hasActiveFilters = filters.search || filters.status || filters.rootOnly;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome da categoria..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                status: value === 'all' ? undefined : (value as 'active' | 'inactive'),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rootOnly"
            checked={filters.rootOnly}
            onCheckedChange={(checked) => onFiltersChange({ rootOnly: !!checked })}
          />
          <label htmlFor="rootOnly" className="text-sm cursor-pointer">
            Apenas categorias raiz
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tree View Components
// ============================================================================

interface TreeNodeProps {
  node: CategoryTreeNode;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function TreeNode({
  node,
  level,
  isExpanded,
  onToggleExpand,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onView,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedIds.includes(node.id);

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-muted/50 transition-colors
          ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}
        `}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className={`p-1 rounded hover:bg-muted ${!hasChildren ? 'invisible' : ''}`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(node.id)}
        />

        {/* Icon */}
        <div
          className="p-1.5 rounded"
          style={{ backgroundColor: node.color ? `${node.color}20` : undefined }}
        >
          {isExpanded ? (
            <FolderOpen
              className="h-4 w-4"
              style={{ color: node.color || undefined }}
            />
          ) : (
            <Folder
              className="h-4 w-4"
              style={{ color: node.color || undefined }}
            />
          )}
        </div>

        {/* Name and Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.name}</span>
            {!node.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inativa
              </Badge>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground truncate">
              {node.description}
            </p>
          )}
        </div>

        {/* Service Count */}
        {node.serviceCount !== undefined && node.serviceCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {node.serviceCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {node.serviceCount} serviço(s) vinculado(s)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(node.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(node.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(node.id)}
              className="text-destructive focus:text-destructive"
              disabled={hasChildren}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={selectedIds.includes(child.id)}
              onToggleExpand={onToggleExpand}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TreeViewProps {
  tree: CategoryTreeNode[];
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function TreeView({
  tree,
  expandedIds,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onView,
}: TreeViewProps) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Nenhuma categoria encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie sua primeira categoria para começar
        </p>
        <Button asChild>
          <Link href="/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg mb-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onExpandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expandir Tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={onCollapseAll}>
            <ChevronRight className="h-4 w-4 mr-1" />
            Recolher Tudo
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {tree.length} categoria(s) raiz
        </div>
      </div>

      {/* Tree */}
      <div className="border rounded-lg divide-y">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            isExpanded={expandedIds.includes(node.id)}
            onToggleExpand={onToggleExpand}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Grid View Component
// ============================================================================

interface GridViewProps {
  categories: Category[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function GridView({
  categories,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onView,
}: GridViewProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Nenhuma categoria encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie sua primeira categoria para começar
        </p>
        <Button asChild>
          <Link href="/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id);

        return (
          <Card
            key={category.id}
            className={`
              relative group cursor-pointer transition-all hover:shadow-md
              ${isSelected ? 'ring-2 ring-primary' : ''}
            `}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(category.id)}
              />
            </div>

            {/* Actions Menu */}
            <div className="absolute top-3 right-3 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(category.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(category.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardContent className="pt-12 pb-4" onClick={() => onView(category.id)}>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: category.color ? `${category.color}20` : '#f3f4f6',
                  }}
                >
                  <Folder
                    className="h-8 w-8"
                    style={{ color: category.color || '#6b7280' }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="text-center space-y-2">
                <h3 className="font-semibold truncate">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge variant={category.isActive ? 'default' : 'secondary'}>
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                {category._count?.services !== undefined && category._count.services > 0 && (
                  <Badge variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {category._count.services}
                  </Badge>
                )}
                {category._count?.children !== undefined && category._count.children > 0 && (
                  <Badge variant="outline">
                    <Layers className="h-3 w-3 mr-1" />
                    {category._count.children}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// List View Component
// ============================================================================

interface ListViewProps {
  categories: Category[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function ListView({
  categories,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  isAllSelected,
  onEdit,
  onDelete,
  onView,
  sortBy,
  sortOrder,
  onSort,
}: ListViewProps) {
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return (
      <ChevronDown
        className={`h-4 w-4 ml-1 transition-transform ${
          sortOrder === 'desc' ? 'rotate-180' : ''
        }`}
      />
    );
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Nenhuma categoria encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie sua primeira categoria para começar
        </p>
        <Button asChild>
          <Link href="/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th
              className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Nome
                <SortIndicator field="name" />
              </div>
            </th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
              Pai
            </th>
            <th
              className="text-center px-4 py-3 font-medium cursor-pointer hover:bg-muted hidden lg:table-cell"
              onClick={() => onSort('order')}
            >
              <div className="flex items-center justify-center">
                Ordem
                <SortIndicator field="order" />
              </div>
            </th>
            <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">
              Status
            </th>
            <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
              Serviços
            </th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories.map((category) => {
            const isSelected = selectedIds.includes(category.id);

            return (
              <tr
                key={category.id}
                className={`
                  hover:bg-muted/50 transition-colors
                  ${isSelected ? 'bg-primary/5' : ''}
                `}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(category.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onView(category.id)}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: category.color ? `${category.color}20` : '#f3f4f6',
                      }}
                    >
                      <Folder
                        className="h-4 w-4"
                        style={{ color: category.color || '#6b7280' }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {category.parent ? (
                    <Badge variant="outline">{category.parent.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Raiz</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <Badge variant="outline">{category.order}</Badge>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  {category._count?.services || 0}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(category.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(category.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(category.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

type ViewMode = 'tree' | 'grid' | 'list';

export default function CategoriesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Hooks
  const {
    categories,
    pagination,
    isLoading,
    isFetching,
    filters,
    setFilters,
    resetFilters,
    setPage,
    sortBy,
    sortOrder,
    setSort,
    refetch,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    isBulkLoading,
  } = useCategories();

  const {
    tree,
    expandedIds,
    toggleExpand,
    expandAll,
    collapseAll,
    isLoading: isTreeLoading,
  } = useCategoryTree({ enabled: viewMode === 'tree' });

  const { remove, isDeleting } = useCategoryMutations();

  // Handlers
  const handleView = useCallback((id: string) => {
    router.push(`/categories/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/categories/${id}/edit`);
  }, [router]);

  const handleDeleteClick = useCallback((id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await remove(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      // Error is handled by the hook
    }
  }, [categoryToDelete, remove]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  }, [selectedIds.length]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await bulkDelete();
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  }, [bulkDelete]);

  const hasActiveFilters = filters.search || filters.status || filters.rootOnly;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Organize seus serviços em categorias hierárquicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button asChild>
            <Link href="/categories/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine a lista de categorias
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onReset={() => {
                    resetFilters();
                    setIsFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* View Mode & Bulk Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} selecionado(s)
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={bulkActivate}
                disabled={isBulkLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Ativar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={bulkDeactivate}
                disabled={isBulkLoading}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Desativar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDeleteClick}
                disabled={isBulkLoading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Limpar
              </Button>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center border rounded-lg p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('tree')}
                  >
                    <TreePine className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualização em Árvore</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualização em Grade</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualização em Lista</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading || (viewMode === 'tree' && isTreeLoading) ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : viewMode === 'tree' ? (
          <TreeView
            tree={tree}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onView={handleView}
          />
        ) : viewMode === 'grid' ? (
          <GridView
            categories={categories}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onView={handleView}
          />
        ) : (
          <ListView
            categories={categories}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onSelectAll={isAllSelected ? clearSelection : selectAll}
            isAllSelected={isAllSelected}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onView={handleView}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={setSort}
          />
        )}
      </div>

      {/* Pagination (for grid and list views) */}
      {viewMode !== 'tree' && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} categorias
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser
              desfeita. Categorias com subcategorias não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categorias Selecionadas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.length} categoria(s)? Esta
              ação não pode ser desfeita. Categorias com subcategorias serão ignoradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkLoading}
            >
              {isBulkLoading ? 'Excluindo...' : 'Excluir Selecionados'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
