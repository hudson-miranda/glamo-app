/**
 * GLAMO - Product Stock History Page
 * View complete movement history for a specific product
 * Production-ready SaaS implementation
 */

'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProductStockHistory, downloadStockExport } from '@/hooks/useStockMovements';
import { useProduct } from '@/hooks/useProducts';
import {
  getMovementTypeLabel,
  getMovementReasonLabel,
  getMovementTypeVariant,
  formatQuantityChange,
  isIncomingMovement,
} from '@/lib/services/stockMovementService';

// ============================================================================
// Types
// ============================================================================

interface ProductHistoryPageProps {
  params: Promise<{ productId: string }>;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ============================================================================
// Date Presets
// ============================================================================

const datePresets = [
  {
    label: 'Últimos 7 dias',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: 'Este mês',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Mês passado',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'Últimos 3 meses',
    getValue: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
  },
];

// ============================================================================
// Stats Cards Component
// ============================================================================

interface StatsCardsProps {
  movements: any[];
  product: any;
}

function StatsCards({ movements, product }: StatsCardsProps) {
  const stats = useMemo(() => {
    const entries = movements.filter((m) => isIncomingMovement(m));
    const exits = movements.filter((m) => !isIncomingMovement(m));
    
    const totalIn = entries.reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = exits.reduce((sum, m) => sum + m.quantity, 0);
    const totalCost = entries.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return {
      totalMovements: movements.length,
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      totalCost,
    };
  }, [movements]);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estoque Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{product.currentStock}</span>
            <span className="text-sm text-muted-foreground">{product.unit || 'un'}</span>
          </div>
          {product.minimumStock && (
            <Badge
              variant={product.currentStock <= product.minimumStock ? 'destructive' : 'secondary'}
              className="mt-2"
            >
              Mín: {product.minimumStock}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Entradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">+{stats.totalIn}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            No período selecionado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">-{stats.totalOut}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            No período selecionado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Custo Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(stats.totalCost)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Em entradas
          </p>
        </CardContent>
      </Card>
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
  const isIncoming = isIncomingMovement(movement);
  const variant = getMovementTypeVariant(movement.type);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isIncoming ? 'bg-green-50' : 'bg-red-50'
          )}>
            {isIncoming ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-medium">{getMovementTypeLabel(movement.type)}</p>
            <p className="text-xs text-muted-foreground">
              {getMovementReasonLabel(movement.reason)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className={cn(
          'font-semibold',
          isIncoming ? 'text-green-600' : 'text-red-600'
        )}>
          {formatQuantityChange(movement.quantity, isIncoming)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {movement.previousQuantity} → {movement.newQuantity}
        </span>
      </TableCell>
      <TableCell>
        {movement.unitCost ? (
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(movement.unitCost)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm')}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/stock/${movement.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Chart Component
// ============================================================================

interface ChartProps {
  movements: any[];
}

function StockChart({ movements }: ChartProps) {
  // Group by date and calculate stock levels
  const chartData = useMemo(() => {
    const sorted = [...movements].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const byDate = new Map<string, { in: number; out: number; stock: number }>();
    let lastStock = sorted.length > 0 ? sorted[0].previousQuantity : 0;

    sorted.forEach((m) => {
      const date = format(new Date(m.createdAt), 'yyyy-MM-dd');
      const existing = byDate.get(date) || { in: 0, out: 0, stock: m.newQuantity };
      
      if (isIncomingMovement(m)) {
        existing.in += m.quantity;
      } else {
        existing.out += m.quantity;
      }
      existing.stock = m.newQuantity;
      lastStock = m.newQuantity;
      
      byDate.set(date, existing);
    });

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [movements]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.in, d.out]),
    1
  );

  return (
    <div className="space-y-2">
      {chartData.slice(-14).map((item) => (
        <div key={item.date} className="flex items-center gap-3 text-sm">
          <span className="w-20 text-muted-foreground">
            {format(new Date(item.date), 'dd/MM')}
          </span>
          <div className="flex-1 flex gap-1">
            <div
              className="h-5 bg-green-500 rounded-sm"
              style={{ width: `${(item.in / maxValue) * 50}%` }}
            />
            <div
              className="h-5 bg-red-500 rounded-sm"
              style={{ width: `${(item.out / maxValue) * 50}%` }}
            />
          </div>
          <span className="w-12 text-right font-medium">{item.stock}</span>
        </div>
      ))}
      <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span>Entrada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span>Saída</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ProductHistoryPage({ params }: ProductHistoryPageProps) {
  const { productId } = use(params);
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [movementType, setMovementType] = useState<string>('all');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { product, isLoading: isLoadingProduct } = useProduct(productId);
  const { movements, isLoading: isLoadingHistory } = useProductStockHistory(
    productId,
    {
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
      type: movementType !== 'all' ? movementType : undefined,
    }
  );

  const filteredMovements = useMemo(() => {
    if (movementType === 'all') return movements;
    return movements.filter((m) => m.type === movementType);
  }, [movements, movementType]);

  const handleExport = async () => {
    await downloadStockExport({
      productId,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
      type: movementType !== 'all' ? movementType : undefined,
    });
  };

  if (isLoadingProduct || isLoadingHistory) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Produto não encontrado</p>
        <Button variant="outline" asChild>
          <Link href="/products">Voltar aos Produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/products/${productId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">
              Histórico de movimentações
              {product.sku && <span> • SKU: {product.sku}</span>}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <StatsCards movements={filteredMovements} product={product} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            <div className="flex gap-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(preset.getValue())}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
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
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    setDateRange({ from: range?.from, to: range?.to });
                    if (range?.to) setCalendarOpen(false);
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="IN">Entrada</SelectItem>
                <SelectItem value="OUT">Saída</SelectItem>
                <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                <SelectItem value="LOSS">Perda</SelectItem>
                <SelectItem value="RETURN">Devolução</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">Nenhuma movimentação</p>
                  <p className="text-sm text-muted-foreground">
                    Não há movimentações no período selecionado
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => (
                      <MovementRow key={movement.id} movement={movement} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do Estoque</CardTitle>
              <CardDescription>
                Entradas e saídas nos últimos 14 dias do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockChart movements={filteredMovements} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/stock/entry">
            <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
            Registrar Entrada
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/stock/exit">
            <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
            Registrar Saída
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/stock/inventory">
            <RefreshCw className="mr-2 h-4 w-4" />
            Ajuste de Inventário
          </Link>
        </Button>
      </div>
    </div>
  );
}
