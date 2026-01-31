/**
 * GLAMO - Stock Movements Page
 * Enterprise-grade stock movement management
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDown,
  ArrowUp,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  RotateCcw,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  BarChart3,
  Bell,
  FileSpreadsheet,
  ArrowLeftRight,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  useStockMovements,
  useStockSummary,
  useStockAlerts,
  downloadStockExport,
} from '@/hooks/useStockMovements';
import {
  getMovementTypeLabel,
  getMovementReasonLabel,
  getMovementTypeVariant,
  isIncomingMovement,
  type StockMovementType,
  type StockMovementReason,
} from '@/lib/services/stockMovementService';

// ============================================================================
// Types
// ============================================================================

const MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'IN', label: 'Entrada' },
  { value: 'OUT', label: 'Saída' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'RETURN', label: 'Devolução' },
  { value: 'LOSS', label: 'Perda' },
  { value: 'PRODUCTION', label: 'Produção' },
];

const MOVEMENT_REASONS: { value: StockMovementReason; label: string }[] = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venda' },
  { value: 'SERVICE_USE', label: 'Uso em serviço' },
  { value: 'INVENTORY_COUNT', label: 'Contagem' },
  { value: 'DAMAGE', label: 'Avaria' },
  { value: 'EXPIRATION', label: 'Vencimento' },
  { value: 'THEFT', label: 'Furto' },
  { value: 'CUSTOMER_RETURN', label: 'Devolução cliente' },
  { value: 'SUPPLIER_RETURN', label: 'Devolução fornecedor' },
  { value: 'INTERNAL_TRANSFER', label: 'Transferência' },
  { value: 'OPENING_BALANCE', label: 'Saldo inicial' },
  { value: 'OTHER', label: 'Outro' },
];

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards() {
  const { summary, isLoading } = useStockSummary();
  const { alerts } = useStockAlerts();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  const stats = [
    {
      label: 'Total de Produtos',
      value: summary?.totalProducts ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Valor em Estoque',
      value: `R$ ${(summary?.totalValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Alertas de Estoque',
      value: (summary?.lowStockCount ?? 0) + (summary?.outOfStockCount ?? 0),
      icon: AlertTriangle,
      color: criticalAlerts > 0 ? 'text-red-600' : 'text-amber-600',
      bgColor: criticalAlerts > 0 ? 'bg-red-50' : 'bg-amber-50',
      badge: criticalAlerts > 0 ? `${criticalAlerts} críticos` : undefined,
    },
    {
      label: 'Movimentações Hoje',
      value: summary?.movementsToday ?? 0,
      icon: ArrowLeftRight,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subValue: `${summary?.movementsThisWeek ?? 0} esta semana`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subValue}
                  </p>
                )}
              </div>
              <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            {stat.badge && (
              <Badge variant="destructive" className="mt-2 text-xs">
                {stat.badge}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Alerts Panel Component
// ============================================================================

function AlertsPanel() {
  const { alerts, critical, warning, isLoading } = useStockAlerts();

  if (isLoading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      'border-l-4',
      critical > 0 ? 'border-l-red-500' : 'border-l-amber-500'
    )}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={cn(
              'h-4 w-4',
              critical > 0 ? 'text-red-500' : 'text-amber-500'
            )} />
            <CardTitle className="text-sm font-medium">
              {alerts.length} {alerts.length === 1 ? 'Alerta' : 'Alertas'} de Estoque
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/stock/alerts">Ver todos</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex flex-wrap gap-2">
          {alerts.slice(0, 5).map((alert) => (
            <Badge
              key={alert.id}
              variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
              className="gap-1"
            >
              {alert.type === 'OUT_OF_STOCK' ? (
                <Package className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {alert.product.name}
            </Badge>
          ))}
          {alerts.length > 5 && (
            <Badge variant="secondary">+{alerts.length - 5} mais</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Filter Panel Component
// ============================================================================

interface FilterPanelProps {
  filters: any;
  onUpdateFilters: (filters: any) => void;
  onResetFilters: () => void;
}

function FilterPanel({ filters, onUpdateFilters, onResetFilters }: FilterPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate,
    to: filters.endDate,
  });

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    onUpdateFilters({
      startDate: range?.from,
      endDate: range?.to,
    });
  };

  const hasActiveFilters = filters.type || filters.reason || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RotateCcw className="mr-2 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo</label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onUpdateFilters({ type: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {MOVEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Motivo</label>
          <Select
            value={filters.reason || 'all'}
            onValueChange={(value) =>
              onUpdateFilters({ reason: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os motivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motivos</SelectItem>
              {MOVEMENT_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Período</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  'Selecionar período'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={handleDateChange}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Movement Row Component
// ============================================================================

interface MovementRowProps {
  movement: any;
}

function MovementRow({ movement }: MovementRowProps) {
  const isIncoming = isIncomingMovement(movement.type, movement.reason);
  const sign = isIncoming ? '+' : '-';
  const colorClass = isIncoming ? 'text-green-600' : 'text-red-600';

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isIncoming ? 'bg-green-50' : 'bg-red-50'
          )}>
            {isIncoming ? (
              <ArrowDown className={cn('h-4 w-4', 'text-green-600')} />
            ) : (
              <ArrowUp className={cn('h-4 w-4', 'text-red-600')} />
            )}
          </div>
          <div>
            <p className="font-medium">{movement.product?.name || 'Produto removido'}</p>
            {movement.product?.sku && (
              <p className="text-xs text-muted-foreground">
                SKU: {movement.product.sku}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getMovementTypeVariant(movement.type)}>
          {getMovementTypeLabel(movement.type)}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {getMovementReasonLabel(movement.reason)}
        </span>
      </TableCell>
      <TableCell>
        <span className={cn('font-medium', colorClass)}>
          {sign}{movement.quantity}
        </span>
        {movement.product?.unit && (
          <span className="text-xs text-muted-foreground ml-1">
            {movement.product.unit}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <span className="text-muted-foreground">{movement.previousQuantity}</span>
          <span className="mx-1">→</span>
          <span className="font-medium">{movement.newQuantity}</span>
        </div>
      </TableCell>
      <TableCell>
        {movement.totalCost ? (
          <span className="text-sm">
            R$ {movement.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>{format(new Date(movement.createdAt), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(movement.createdAt), 'HH:mm')}
          </p>
        </div>
      </TableCell>
      <TableCell>
        {movement.user?.name ? (
          <span className="text-sm">{movement.user.name}</span>
        ) : (
          <span className="text-muted-foreground">Sistema</span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Nenhuma movimentação</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
        Ainda não há movimentações de estoque registradas. Registre entradas, saídas ou ajustes.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/stock/entry">
            <ArrowDown className="mr-2 h-4 w-4" />
            Registrar Entrada
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/stock/adjust">
            <Settings className="mr-2 h-4 w-4" />
            Ajustar Estoque
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function StockMovementsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    movements,
    total,
    page,
    totalPages,
    isLoading,
    isFetching,
    filters,
    updateFilters,
    resetFilters,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    refetch,
  } = useStockMovements();

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    updateFilters({ search: value || undefined });
  }, [updateFilters]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await downloadStockExport(filters);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.reason) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimentações de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie entradas, saídas e ajustes de estoque
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/stock/report">
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatório
            </Link>
          </Button>
          <Button asChild>
            <Link href="/stock/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Alerts */}
      <AlertsPanel />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/stock/entry">
            <ArrowDown className="mr-2 h-4 w-4 text-green-600" />
            Entrada
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/stock/exit">
            <ArrowUp className="mr-2 h-4 w-4 text-red-600" />
            Saída
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/stock/adjust">
            <Settings className="mr-2 h-4 w-4" />
            Ajuste
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/stock/inventory">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Contagem
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtrar Movimentações</SheetTitle>
                    <SheetDescription>
                      Refine sua busca usando os filtros abaixo
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel
                      filters={filters}
                      onUpdateFilters={updateFilters}
                      onResetFilters={resetFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : movements.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <MovementRow key={movement.id} movement={movement} />
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Mostrando {movements.length} de {total} movimentações
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
