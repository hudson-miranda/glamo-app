/**
 * GLAMO - Stock Report Page
 * Enterprise-grade stock movement reporting
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useStockReport, downloadStockExport } from '@/hooks/useStockMovements';
import { getMovementTypeLabel } from '@/lib/services/stockMovementService';

// ============================================================================
// Date Presets
// ============================================================================

const DATE_PRESETS = [
  { label: 'Últimos 7 dias', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 dias', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mês', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Mês passado', getValue: () => {
    const lastMonth = subMonths(new Date(), 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  }},
  { label: 'Últimos 3 meses', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
];

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: any;
  color: string;
  bgColor: string;
}

function SummaryCard({ label, value, subValue, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Timeline Chart Component (Simple)
// ============================================================================

interface TimelineChartProps {
  data: { date: string; in: number; out: number }[];
}

function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados para o período selecionado
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.in, d.out]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Entradas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Saídas</span>
        </div>
      </div>

      <div className="space-y-2">
        {data.slice(-14).map((item) => {
          const inWidth = maxValue > 0 ? (item.in / maxValue) * 100 : 0;
          const outWidth = maxValue > 0 ? (item.out / maxValue) * 100 : 0;

          return (
            <div key={item.date} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">
                {format(new Date(item.date), 'dd/MM')}
              </span>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-4 flex gap-1">
                  <div
                    className="h-full bg-green-500 rounded-l"
                    style={{ width: `${inWidth}%` }}
                  />
                  <div
                    className="h-full bg-red-500 rounded-r"
                    style={{ width: `${outWidth}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2 text-xs w-24 shrink-0 justify-end">
                <span className="text-green-600">+{item.in}</span>
                <span className="text-red-600">-{item.out}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Type Distribution Component
// ============================================================================

interface TypeDistributionProps {
  data: { type: string; count: number; quantity: number; value: number }[];
}

function TypeDistribution({ data }: TypeDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Sem dados
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        const isIncoming = ['IN', 'PRODUCTION'].includes(item.type);

        return (
          <div key={item.type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{getMovementTypeLabel(item.type as any)}</span>
              <span className="text-muted-foreground">
                {item.count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  isIncoming ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Qtd: {item.quantity}</span>
              {item.value > 0 && (
                <span>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Top Products Table Component
// ============================================================================

interface TopProductsProps {
  data: { productId: string; productName: string; movements: number; netChange: number }[];
}

function TopProducts({ data }: TopProductsProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Sem dados
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.movements - a.movements).slice(0, 10);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead className="text-right">Movimentações</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item, index) => (
          <TableRow key={item.productId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                  {index + 1}
                </Badge>
                <Link
                  href={`/products/${item.productId}`}
                  className="font-medium hover:underline"
                >
                  {item.productName}
                </Link>
              </div>
            </TableCell>
            <TableCell className="text-right">{item.movements}</TableCell>
            <TableCell className="text-right">
              <span className={cn(
                'font-medium',
                item.netChange > 0 ? 'text-green-600' : item.netChange < 0 ? 'text-red-600' : ''
              )}>
                {item.netChange > 0 ? '+' : ''}{item.netChange}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function StockReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const { report, isLoading, isError, refetch } = useStockReport(
    dateRange.from!,
    dateRange.to!
  );

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getValue();
    setDateRange(range);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadStockExport({
        startDate: dateRange.from,
        endDate: dateRange.to,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stock">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatório de Estoque</h1>
            <p className="text-muted-foreground">
              Análise detalhada das movimentações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[260px] justify-start text-left">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      'Selecionar período'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => range && setDateRange(range)}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Erro ao carregar relatório</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Total de Entradas"
              value={report.summary.totalIn}
              icon={ArrowDown}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <SummaryCard
              label="Total de Saídas"
              value={report.summary.totalOut}
              icon={ArrowUp}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <SummaryCard
              label="Saldo do Período"
              value={report.summary.netChange >= 0 ? `+${report.summary.netChange}` : report.summary.netChange}
              icon={report.summary.netChange >= 0 ? TrendingUp : TrendingDown}
              color={report.summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}
              bgColor={report.summary.netChange >= 0 ? 'bg-green-50' : 'bg-red-50'}
            />
            <SummaryCard
              label="Valor Movimentado"
              value={`R$ ${report.summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={BarChart3}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações por Dia</CardTitle>
                <CardDescription>
                  Histórico de entradas e saídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineChart data={report.timeline} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>
                  Tipos de movimentação no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TypeDistribution data={report.byType} />
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Movimentados</CardTitle>
              <CardDescription>
                Top 10 produtos por número de movimentações
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TopProducts data={report.byProduct} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
