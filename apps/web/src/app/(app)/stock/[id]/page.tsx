/**
 * GLAMO - Stock Movement Detail Page
 * View detailed information about a specific stock movement
 * Production-ready SaaS implementation
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Undo,
  AlertTriangle,
  Factory,
  User,
  Building2,
  Calendar,
  Hash,
  FileText,
  ArrowUpRight,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { useStockMovement } from '@/hooks/useStockMovements';
import {
  getMovementTypeLabel,
  getMovementReasonLabel,
  getMovementTypeVariant,
  formatQuantityChange,
} from '@/lib/services/stockMovementService';

// ============================================================================
// Types
// ============================================================================

interface MovementDetailPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Movement Type Icon
// ============================================================================

function MovementTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    IN: <TrendingUp className="h-5 w-5" />,
    OUT: <TrendingDown className="h-5 w-5" />,
    ADJUSTMENT: <RefreshCw className="h-5 w-5" />,
    TRANSFER: <ArrowUpRight className="h-5 w-5" />,
    RETURN: <Undo className="h-5 w-5" />,
    LOSS: <AlertTriangle className="h-5 w-5" />,
    PRODUCTION: <Factory className="h-5 w-5" />,
  };

  const bgColors: Record<string, string> = {
    IN: 'bg-green-100 text-green-600',
    OUT: 'bg-red-100 text-red-600',
    ADJUSTMENT: 'bg-blue-100 text-blue-600',
    TRANSFER: 'bg-purple-100 text-purple-600',
    RETURN: 'bg-amber-100 text-amber-600',
    LOSS: 'bg-red-100 text-red-600',
    PRODUCTION: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className={cn('p-3 rounded-xl', bgColors[type] || 'bg-gray-100 text-gray-600')}>
      {icons[type] || <Package className="h-5 w-5" />}
    </div>
  );
}

// ============================================================================
// Info Row Component
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
}

function InfoRow({ icon, label, value, href }: InfoRowProps) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn('font-medium', href && 'text-primary hover:underline')}>
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function MovementDetailPage({ params }: MovementDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const { movement, isLoading, error } = useStockMovement(id);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !movement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Movimentação não encontrada</p>
        <Button variant="outline" asChild>
          <Link href="/stock">Voltar ao Estoque</Link>
        </Button>
      </div>
    );
  }

  const typeVariant = getMovementTypeVariant(movement.type);
  const isIncoming = ['IN', 'PRODUCTION'].includes(movement.type) || 
    (movement.type === 'RETURN' && movement.reason !== 'SUPPLIER_RETURN');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <MovementTypeIcon type={movement.type} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {getMovementTypeLabel(movement.type)}
            </h1>
            <Badge variant={typeVariant}>
              {formatQuantityChange(movement.quantity, isIncoming)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {format(new Date(movement.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Card */}
          <Card>
            <CardHeader>
              <CardTitle>Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${movement.product.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {movement.product.name}
                  </Link>
                  {movement.product.sku && (
                    <p className="text-sm text-muted-foreground">
                      SKU: {movement.product.sku}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: {movement.product.currentStock} {movement.product.unit || 'un'}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/products/${movement.product.id}`}>
                    Ver Produto
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Movement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Movimentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant={typeVariant} className="mt-1">
                    {getMovementTypeLabel(movement.type)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <p className="font-medium mt-1">
                    {getMovementReasonLabel(movement.reason)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className={cn(
                    'text-xl font-bold mt-1',
                    isIncoming ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatQuantityChange(movement.quantity, isIncoming)} {movement.product.unit || 'un'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Anterior</p>
                  <p className="font-medium mt-1">
                    {movement.previousQuantity} → {movement.newQuantity} {movement.product.unit || 'un'}
                  </p>
                </div>
              </div>

              {movement.unitCost && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Unitário</p>
                      <p className="font-medium mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(movement.unitCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Total</p>
                      <p className="font-medium mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(movement.totalCost || movement.unitCost * movement.quantity)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {movement.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{movement.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Data/Hora"
                value={format(new Date(movement.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              />

              {movement.reference && (
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Referência"
                  value={movement.reference}
                />
              )}

              {movement.supplier && (
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Fornecedor"
                  value={movement.supplier.name}
                  href={`/suppliers/${movement.supplier.id}`}
                />
              )}

              {movement.customer && (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Cliente"
                  value={movement.customer.name}
                  href={`/customers/${movement.customer.id}`}
                />
              )}

              {movement.createdBy && (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Registrado por"
                  value={movement.createdBy.name || movement.createdBy.email}
                />
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/products/${movement.product.id}`}>
                  <Package className="mr-2 h-4 w-4" />
                  Ver Produto
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/stock?productId=${movement.product.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Histórico do Produto
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/stock/new">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Nova Movimentação
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-4">
                  <div className="relative flex items-start gap-3 pl-6">
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                    <div>
                      <p className="text-sm font-medium">Movimento registrado</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(movement.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-3 pl-6">
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-muted bg-background" />
                    <div>
                      <p className="text-sm font-medium">Estoque atualizado</p>
                      <p className="text-xs text-muted-foreground">
                        {movement.previousQuantity} → {movement.newQuantity} {movement.product.unit || 'un'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
