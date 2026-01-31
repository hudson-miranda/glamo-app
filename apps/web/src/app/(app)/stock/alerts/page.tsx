/**
 * GLAMO - Stock Alerts Page
 * Enterprise-grade stock alerts management
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Package,
  ArrowLeft,
  Bell,
  RefreshCw,
  ArrowDown,
  Settings,
  Eye,
  TrendingUp,
  CheckCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useStockAlerts, useStockSummary } from '@/hooks/useStockMovements';

// ============================================================================
// Stats Card Component
// ============================================================================

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
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
// Alert Row Component
// ============================================================================

interface AlertRowProps {
  alert: any;
}

function AlertRow({ alert }: AlertRowProps) {
  const getAlertTypeInfo = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return {
          label: 'Sem estoque',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: Package,
        };
      case 'LOW_STOCK':
        return {
          label: 'Estoque baixo',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          icon: AlertTriangle,
        };
      case 'OVERSTOCK':
        return {
          label: 'Excesso',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: TrendingUp,
        };
      default:
        return {
          label: type,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: Bell,
        };
    }
  };

  const typeInfo = getAlertTypeInfo(alert.type);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', typeInfo.bgColor)}>
            <typeInfo.icon className={cn('h-4 w-4', typeInfo.color)} />
          </div>
          <div>
            <p className="font-medium">{alert.product.name}</p>
            {alert.product.sku && (
              <p className="text-xs text-muted-foreground">
                SKU: {alert.product.sku}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
        >
          {typeInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <span className={cn(
            'font-medium',
            alert.product.currentStock <= 0 ? 'text-red-600' : ''
          )}>
            {alert.product.currentStock}
          </span>
          <span className="text-muted-foreground"> {alert.product.unit || 'un'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {alert.product.minimumStock !== null && (
            <span>Min: {alert.product.minimumStock}</span>
          )}
          {alert.product.maximumStock !== null && (
            <span className="ml-2">Max: {alert.product.maximumStock}</span>
          )}
          {alert.product.minimumStock === null && alert.product.maximumStock === null && (
            <span className="text-muted-foreground">Não definido</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${alert.productId}`}>
              <Eye className="mr-2 h-3 w-3" />
              Ver
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/stock/new?type=IN&productId=${alert.productId}`}>
              <ArrowDown className="mr-2 h-3 w-3" />
              Entrada
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
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
      <Card>
        <CardContent className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-green-50 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
        Não há alertas de estoque no momento. Continue monitorando seus produtos.
      </p>
      <Button variant="outline" asChild>
        <Link href="/products">
          <Package className="mr-2 h-4 w-4" />
          Ver Produtos
        </Link>
      </Button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function StockAlertsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { alerts, critical, warning, total, isLoading, refetch } = useStockAlerts();
  const { summary } = useStockSummary();

  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case 'critical':
        return alerts.filter((a) => a.severity === 'critical');
      case 'warning':
        return alerts.filter((a) => a.severity === 'warning');
      case 'out':
        return alerts.filter((a) => a.type === 'OUT_OF_STOCK');
      case 'low':
        return alerts.filter((a) => a.type === 'LOW_STOCK');
      case 'over':
        return alerts.filter((a) => a.type === 'OVERSTOCK');
      default:
        return alerts;
    }
  }, [alerts, activeTab]);

  const outOfStock = alerts.filter((a) => a.type === 'OUT_OF_STOCK').length;
  const lowStock = alerts.filter((a) => a.type === 'LOW_STOCK').length;
  const overstock = alerts.filter((a) => a.type === 'OVERSTOCK').length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stock">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alertas de Estoque</h1>
            <p className="text-muted-foreground">
              Monitore produtos com níveis críticos de estoque
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          label="Total de Alertas"
          value={total}
          icon={Bell}
          color={critical > 0 ? 'text-red-600' : 'text-amber-600'}
          bgColor={critical > 0 ? 'bg-red-50' : 'bg-amber-50'}
        />
        <StatsCard
          label="Sem Estoque"
          value={outOfStock}
          icon={Package}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatsCard
          label="Estoque Baixo"
          value={lowStock}
          icon={AlertTriangle}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatsCard
          label="Excesso"
          value={overstock}
          icon={TrendingUp}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({total})
              </TabsTrigger>
              <TabsTrigger value="critical" className="text-red-600">
                Críticos ({critical})
              </TabsTrigger>
              <TabsTrigger value="warning" className="text-amber-600">
                Avisos ({warning})
              </TabsTrigger>
              <TabsTrigger value="out">
                Sem Estoque ({outOfStock})
              </TabsTrigger>
              <TabsTrigger value="low">
                Baixo ({lowStock})
              </TabsTrigger>
              {overstock > 0 && (
                <TabsTrigger value="over">
                  Excesso ({overstock})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">💡 Dicas para Gestão de Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Estoque mínimo:</strong> Configure o limite para receber alertas de reposição</p>
          <p>• <strong>Estoque máximo:</strong> Evite excesso que pode gerar custos de armazenagem</p>
          <p>• <strong>Produtos críticos:</strong> Priorize a reposição de itens sem estoque</p>
          <p>• <strong>Análise:</strong> Use o relatório para identificar padrões de consumo</p>
        </CardContent>
      </Card>
    </div>
  );
}
