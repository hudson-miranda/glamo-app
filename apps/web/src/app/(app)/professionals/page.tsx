/**
 * GLAMO - Professionals List Page
 * Enterprise-grade professional management with grid/table views
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
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  X,
  Check,
  RefreshCw,
  Download,
  Mail,
  Phone,
  Briefcase,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Separator } from '@/components/ui/separator';

import { useProfessionals, useProfessionalStats } from '@/hooks/useProfessionals';
import type { Professional } from '@/lib/services/professionalService';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'table';

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards() {
  const { stats, isLoading } = useProfessionalStats();

  const statsConfig = [
    {
      title: 'Total de Profissionais',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Ativos',
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Inativos',
      value: stats?.inactive ?? 0,
      icon: UserX,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      title: 'Com Serviços',
      value: stats?.withServices ?? 0,
      icon: Briefcase,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn('rounded-md p-2', stat.bg)}>
                <Icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
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
    hasServices?: boolean;
  };
  onFilterChange: (filters: Partial<FilterPanelProps['filters']>) => void;
  onReset: () => void;
}

function FilterPanel({ filters, onFilterChange, onReset }: FilterPanelProps) {
  const hasActiveFilters = filters.status !== undefined || filters.hasServices !== undefined;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => {
              onFilterChange({
                status: value === 'all' ? undefined : value as 'active' | 'inactive',
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Serviços Vinculados</label>
          <Select
            value={
              filters.hasServices === undefined
                ? 'all'
                : filters.hasServices
                ? 'yes'
                : 'no'
            }
            onValueChange={(value) => {
              onFilterChange({
                hasServices: value === 'all' ? undefined : value === 'yes',
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Com serviços</SelectItem>
              <SelectItem value="no">Sem serviços</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Professional Card Component (Grid View)
// ============================================================================

interface ProfessionalCardProps {
  professional: Professional;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onViewSchedule: () => void;
}

function ProfessionalCard({
  professional,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewSchedule,
}: ProfessionalCardProps) {
  const initials = professional.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const commissionLabel = {
    PERCENTAGE: `${professional.commissionValue}%`,
    FIXED: `R$ ${professional.commissionValue?.toFixed(2)}`,
    NONE: 'Sem comissão',
  }[professional.commissionType];

  const CommissionIcon = professional.commissionType === 'PERCENTAGE' ? Percent : DollarSign;

  return (
    <Card className={cn('group transition-all hover:shadow-md', isSelected && 'ring-2 ring-primary')}>
      <CardHeader className="relative pb-2">
        <div className="absolute left-4 top-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=checked]:opacity-100"
          />
        </div>
        <div className="absolute right-4 top-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewSchedule}>
                <Calendar className="mr-2 h-4 w-4" />
                Agenda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleStatus}>
                {professional.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center pt-4">
          <Avatar className="h-20 w-20">
            {professional.avatar && <AvatarImage src={professional.avatar} alt={professional.name} />}
            <AvatarFallback
              style={{ backgroundColor: professional.color || '#6366f1' }}
              className="text-white text-lg font-semibold"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-lg">{professional.name}</CardTitle>
          <Badge
            variant={professional.isActive ? 'default' : 'secondary'}
            className="mt-2"
          >
            {professional.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-3 text-sm">
          {professional.email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4" />
              <span className="truncate">{professional.email}</span>
            </div>
          )}
          {professional.phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4" />
              {professional.phone}
            </div>
          )}
          <div className="flex items-center text-muted-foreground">
            <CommissionIcon className="mr-2 h-4 w-4" />
            {commissionLabel}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            {(professional as any).services?.length || 0} serviço(s)
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Table Row Component
// ============================================================================

interface ProfessionalRowProps {
  professional: Professional;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onViewSchedule: () => void;
}

function ProfessionalRow({
  professional,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewSchedule,
}: ProfessionalRowProps) {
  const initials = professional.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const commissionLabel = {
    PERCENTAGE: `${professional.commissionValue}%`,
    FIXED: `R$ ${professional.commissionValue?.toFixed(2)}`,
    NONE: 'Sem comissão',
  }[professional.commissionType];

  return (
    <TableRow className={cn(isSelected && 'bg-muted/50')}>
      <TableCell className="w-12">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {professional.avatar && <AvatarImage src={professional.avatar} alt={professional.name} />}
            <AvatarFallback
              style={{ backgroundColor: professional.color || '#6366f1' }}
              className="text-white text-sm font-semibold"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{professional.name}</p>
            {professional.email && (
              <p className="text-sm text-muted-foreground">{professional.email}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{professional.phone || '-'}</TableCell>
      <TableCell>{commissionLabel}</TableCell>
      <TableCell className="text-center">
        {(professional as any).services?.length || 0}
      </TableCell>
      <TableCell>
        <Badge variant={professional.isActive ? 'default' : 'secondary'}>
          {professional.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onView}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalhes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onViewSchedule}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agenda</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleStatus}>
                {professional.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Skeleton Components
// ============================================================================

function GridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-col items-center pt-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-4 h-6 w-32" />
            <Skeleton className="mt-2 h-5 w-16" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12" />
          <TableHead>Profissional</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Comissão</TableHead>
          <TableHead className="text-center">Serviços</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-1 h-4 w-40" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">Nenhum profissional encontrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente ajustar os filtros ou buscar por outros termos
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="text-lg font-medium">Nenhum profissional cadastrado</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Comece adicionando profissionais à sua equipe
      </p>
      <Button className="mt-4" asChild>
        <Link href="/professionals/new">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Profissional
        </Link>
      </Button>
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
  onLimitChange: (limit: number) => void;
}

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Mostrando {start} a {end} de {total} profissionais
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProfessionalsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const {
    professionals,
    pagination,
    isLoading,
    isFetching,
    filters,
    setFilters,
    resetFilters,
    setPage,
    setLimit,
    sortBy,
    sortOrder,
    setSort,
    refetch,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    isBulkLoading,
  } = useProfessionals({
    initialParams: { limit: 20 },
  });

  const hasFilters = Boolean(
    filters.search || filters.status || filters.hasServices !== undefined
  );

  // Handlers
  const handleView = useCallback(
    (professional: Professional) => {
      router.push(`/professionals/${professional.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (professional: Professional) => {
      router.push(`/professionals/${professional.id}/edit`);
    },
    [router]
  );

  const handleViewSchedule = useCallback(
    (professional: Professional) => {
      router.push(`/professionals/${professional.id}/schedule`);
    },
    [router]
  );

  const handleDeleteClick = useCallback((professional: Professional) => {
    setProfessionalToDelete(professional);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!professionalToDelete) return;

    try {
      await bulkDelete([professionalToDelete.id]);
      setDeleteDialogOpen(false);
      setProfessionalToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  }, [professionalToDelete, bulkDelete]);

  const handleToggleStatus = useCallback(
    async (professional: Professional) => {
      try {
        if (professional.isActive) {
          await bulkDeactivate([professional.id]);
        } else {
          await bulkActivate([professional.id]);
        }
      } catch (error) {
        // Error handled by hook
      }
    },
    [bulkActivate, bulkDeactivate]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDelete();
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  }, [bulkDelete]);

  const handleSort = useCallback(
    (field: string) => {
      setSort(field);
    },
    [setSort]
  );

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe de profissionais
          </p>
        </div>
        <Button asChild>
          <Link href="/professionals/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar profissionais..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setFilters({ search: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 border-r pr-4 mr-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selecionado(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkActivate()}
                    disabled={isBulkLoading}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkDeactivate()}
                    disabled={isBulkLoading}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    disabled={isBulkLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Limpar seleção
                  </Button>
                </div>
              )}

              {/* Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    {hasFilters && (
                      <Badge variant="secondary" className="ml-2">
                        {[
                          filters.status,
                          filters.hasServices !== undefined,
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtrar Profissionais</SheetTitle>
                    <SheetDescription>
                      Aplique filtros para encontrar profissionais específicos
                    </SheetDescription>
                  </SheetHeader>
                  <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    onReset={resetFilters}
                  />
                </SheetContent>
              </Sheet>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <GridSkeleton />
        ) : (
          <Card>
            <TableSkeleton />
          </Card>
        )
      ) : professionals.length === 0 ? (
        <Card>
          <EmptyState hasFilters={hasFilters} />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              isSelected={selectedIds.includes(professional.id)}
              onToggleSelect={() => toggleSelection(professional.id)}
              onView={() => handleView(professional)}
              onEdit={() => handleEdit(professional)}
              onDelete={() => handleDeleteClick(professional)}
              onToggleStatus={() => handleToggleStatus(professional)}
              onViewSchedule={() => handleViewSchedule(professional)}
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
                    checked={isAllSelected}
                    onCheckedChange={isAllSelected ? clearSelection : selectAll}
                  />
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    Profissional
                    <SortIndicator field="name" />
                  </button>
                </TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium hover:text-foreground"
                    onClick={() => handleSort('commissionType')}
                  >
                    Comissão
                    <SortIndicator field="commissionType" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Serviços</TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium hover:text-foreground"
                    onClick={() => handleSort('isActive')}
                  >
                    Status
                    <SortIndicator field="isActive" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <ProfessionalRow
                  key={professional.id}
                  professional={professional}
                  isSelected={selectedIds.includes(professional.id)}
                  onToggleSelect={() => toggleSelection(professional.id)}
                  onView={() => handleView(professional)}
                  onEdit={() => handleEdit(professional)}
                  onDelete={() => handleDeleteClick(professional)}
                  onToggleStatus={() => handleToggleStatus(professional)}
                  onViewSchedule={() => handleViewSchedule(professional)}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional{' '}
              <strong>{professionalToDelete?.name}</strong>? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissionais</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.length} profissional(is)
              selecionado(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkLoading}
            >
              {isBulkLoading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
