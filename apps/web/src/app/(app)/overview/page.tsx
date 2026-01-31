/**
 * GLAMO - Integrated Overview Page
 * Complete cross-module integration dashboard
 * Production-ready SaaS implementation
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  Package,
  Scissors,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UserPlus,
  ShoppingCart,
  Warehouse,
  Building2,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import all module hooks
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useStockAlerts, useStockSummary, useStockMovements, useStockReport } from '@/hooks/useStockMovements';
import { useCategories } from '@/hooks/useCategories';
import { isIncomingMovement } from '@/lib/services/stockMovementService';

// ============================================================================
// Types
// ============================================================================

interface QuickStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href: string;
  color: string;
}

// ============================================================================
// Quick Stat Card
// ============================================================================

function QuickStatCard({ title, value, icon, trend, href, color }: QuickStatProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link href={href}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className={cn('p-3 rounded-xl', color)}>
              {icon}
            </div>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-sm',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {trend.value}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

// ============================================================================
// Stock Overview Widget
// ============================================================================

function StockOverviewWidget() {
  const { alerts, isLoading: isLoadingAlerts } = useStockAlerts();
  const { summary, isLoading: isLoadingSummary } = useStockSummary();
  const { movements } = useStockMovements({ limit: 50 });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const movementStats = useMemo(() => {
    const entries = movements.filter((m) => isIncomingMovement(m));
    const exits = movements.filter((m) => !isIncomingMovement(m));
    
    return {
      entries: entries.reduce((sum, m) => sum + m.quantity, 0),
      exits: exits.reduce((sum, m) => sum + m.quantity, 0),
    };
  }, [movements]);

  if (isLoadingAlerts || isLoadingSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Estoque</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-emerald-500" />
            Resumo de Estoque
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/stock">Ver detalhes</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value */}
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(summary?.totalValue || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Valor total em estoque</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{summary?.totalProducts || 0}</p>
            <p className="text-xs text-muted-foreground">Produtos</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{summary?.lowStockCount || 0}</p>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-green-50">
            <p className="text-xl font-bold text-green-600">+{movementStats.entries}</p>
            <p className="text-xs text-muted-foreground">Entradas</p>
          </div>
          <div className="text-center p-3 border rounded-lg bg-red-50">
            <p className="text-xl font-bold text-red-600">-{movementStats.exits}</p>
            <p className="text-xs text-muted-foreground">Saídas</p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="destructive">{criticalCount}</Badge>
                    <span className="text-xs text-muted-foreground">críticos</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      {warningCount}
                    </Badge>
                    <span className="text-xs text-muted-foreground">alertas</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/stock/alerts">
                  <AlertTriangle className="mr-2 h-3 w-3" />
                  Ver Alertas
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Categories Widget
// ============================================================================

function CategoriesWidget() {
  const { categories } = useCategories({ limit: 100, type: 'PRODUCT' });
  const { products } = useProducts({ limit: 500 });

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; value: number }>();
    
    products.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      const existing = stats.get(catId) || { count: 0, value: 0 };
      stats.set(catId, {
        count: existing.count + 1,
        value: existing.value + (product.currentStock * (product.cost || 0)),
      });
    });

    return categories
      .map((cat) => ({
        ...cat,
        productCount: stats.get(cat.id)?.count || 0,
        totalValue: stats.get(cat.id)?.value || 0,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 6);
  }, [categories, products]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Categorias</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">Ver todas</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categoryStats.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma categoria encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || '#6b7280' }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{cat.productCount} produtos</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Suppliers Widget
// ============================================================================

function SuppliersWidget() {
  const { suppliers, total } = useSuppliers({ limit: 5 });

  const activeSuppliers = suppliers.filter((s) => s.isActive);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-500" />
            Fornecedores
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/suppliers">Ver todos</Link>
          </Button>
        </div>
        <CardDescription>
          {total} fornecedores cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeSuppliers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado
            </p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/suppliers/new">Adicionar fornecedor</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSuppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/suppliers/${supplier.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-600">
                    {supplier.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {supplier.email || supplier.phone || 'Sem contato'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Services by Category Widget
// ============================================================================

function ServicesByCategoryWidget() {
  const { services } = useServices({ limit: 100 });
  const { categories } = useCategories({ limit: 100, type: 'SERVICE' });

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalRevenue: number }>();
    
    services.forEach((service) => {
      const catId = service.categoryId || 'uncategorized';
      const existing = stats.get(catId) || { count: 0, totalRevenue: 0 };
      stats.set(catId, {
        count: existing.count + 1,
        totalRevenue: existing.totalRevenue + service.price,
      });
    });

    return categories
      .map((cat) => ({
        ...cat,
        serviceCount: stats.get(cat.id)?.count || 0,
        totalRevenue: stats.get(cat.id)?.totalRevenue || 0,
      }))
      .filter((cat) => cat.serviceCount > 0)
      .sort((a, b) => b.serviceCount - a.serviceCount);
  }, [categories, services]);

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-pink-500" />
            Serviços por Categoria
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">Ver todos</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{services.length}</p>
          <p className="text-sm text-muted-foreground">serviços ativos</p>
        </div>

        {categoryStats.length > 0 && (
          <div className="space-y-3">
            {categoryStats.slice(0, 5).map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color || '#ec4899' }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-muted-foreground">{cat.serviceCount}</span>
                </div>
                <Progress
                  value={(cat.serviceCount / services.length) * 100}
                  className="h-1"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Quick Actions Widget
// ============================================================================

function QuickActionsWidget() {
  const actions = [
    { href: '/customers/new', icon: <UserPlus className="h-4 w-4" />, label: 'Novo Cliente', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { href: '/stock/entry', icon: <TrendingUp className="h-4 w-4" />, label: 'Entrada Estoque', color: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { href: '/stock/exit', icon: <TrendingDown className="h-4 w-4" />, label: 'Saída Estoque', color: 'bg-red-100 text-red-600 hover:bg-red-200' },
    { href: '/products/new', icon: <Package className="h-4 w-4" />, label: 'Novo Produto', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
    { href: '/services/new', icon: <Scissors className="h-4 w-4" />, label: 'Novo Serviço', color: 'bg-pink-100 text-pink-600 hover:bg-pink-200' },
    { href: '/suppliers/new', icon: <Building2 className="h-4 w-4" />, label: 'Novo Fornecedor', color: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' },
    { href: '/stock/inventory', icon: <Warehouse className="h-4 w-4" />, label: 'Inventário', color: 'bg-amber-100 text-amber-600 hover:bg-amber-200' },
    { href: '/stock/report', icon: <FileText className="h-4 w-4" />, label: 'Relatório Estoque', color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.href}
              variant="ghost"
              className={cn('h-auto py-3 flex-col gap-2', action.color)}
              asChild
            >
              <Link href={action.href}>
                {action.icon}
                <span className="text-xs">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Recent Activity Widget
// ============================================================================

function RecentActivityWidget() {
  const { movements } = useStockMovements({ limit: 10 });
  const { customers } = useCustomers({ limit: 5 });

  const activities = useMemo(() => {
    const all: Array<{
      id: string;
      type: 'movement' | 'customer';
      title: string;
      description: string;
      date: Date;
      icon: React.ReactNode;
      color: string;
    }> = [];

    movements.forEach((m) => {
      const isIn = isIncomingMovement(m);
      all.push({
        id: `movement-${m.id}`,
        type: 'movement',
        title: isIn ? 'Entrada de Estoque' : 'Saída de Estoque',
        description: `${m.product?.name || 'Produto'}: ${isIn ? '+' : '-'}${m.quantity}`,
        date: new Date(m.createdAt),
        icon: isIn ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
        color: isIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
      });
    });

    customers.forEach((c) => {
      all.push({
        id: `customer-${c.id}`,
        type: 'customer',
        title: 'Novo Cliente',
        description: c.name,
        date: new Date(c.createdAt),
        icon: <UserPlus className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-600',
      });
    });

    return all
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [movements, customers]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-gray-500" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn('p-2 rounded-lg', activity.color)}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(activity.date, 'dd/MM HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Overview Component
// ============================================================================

export default function OverviewPage() {
  const { total: totalCustomers } = useCustomers({ limit: 1 });
  const { total: totalProducts } = useProducts({ limit: 1 });
  const { total: totalServices } = useServices({ limit: 1 });
  const { total: totalProfessionals } = useProfessionals({ limit: 1 });
  const { total: totalSuppliers } = useSuppliers({ limit: 1 });
  const { alerts } = useStockAlerts();
  const { summary } = useStockSummary();

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <QuickStatCard
          title="Clientes"
          value={totalCustomers}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          href="/customers"
          color="bg-blue-100"
        />
        <QuickStatCard
          title="Produtos"
          value={totalProducts}
          icon={<Package className="h-5 w-5 text-purple-600" />}
          href="/products"
          color="bg-purple-100"
        />
        <QuickStatCard
          title="Serviços"
          value={totalServices}
          icon={<Scissors className="h-5 w-5 text-pink-600" />}
          href="/services"
          color="bg-pink-100"
        />
        <QuickStatCard
          title="Profissionais"
          value={totalProfessionals}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          href="/professionals"
          color="bg-indigo-100"
        />
        <QuickStatCard
          title="Fornecedores"
          value={totalSuppliers}
          icon={<Building2 className="h-5 w-5 text-emerald-600" />}
          href="/suppliers"
          color="bg-emerald-100"
        />
        <QuickStatCard
          title="Alertas"
          value={alerts.length}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          href="/stock/alerts"
          color="bg-amber-100"
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsWidget />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StockOverviewWidget />
        <ServicesByCategoryWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SuppliersWidget />
        <CategoriesWidget />
        <RecentActivityWidget />
      </div>
    </div>
  );
}
