/**
 * GLAMO - Product Detail Page
 * Enterprise-grade product view with stock movements, history
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  DollarSign,
  Boxes,
  Tag,
  Truck,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Barcode,
  Copy,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';

import { useProduct, useStockMovements } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/services/productService';
import { StockMovementType } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

interface StockMovementFormData {
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  notes?: string;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Not Found Component
// ============================================================================

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Produto não encontrado</h2>
      <p className="mt-2 text-muted-foreground">
        O produto que você está procurando não existe ou foi removido.
      </p>
      <Button asChild className="mt-6">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Produtos
        </Link>
      </Button>
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatCard({ title, value, icon: Icon, description, trend, trendValue }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend && trendValue && (
              <>
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={cn(
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600'
                )}>
                  {trendValue}
                </span>
              </>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Stock Movement Dialog
// ============================================================================

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockMovementFormData) => Promise<void>;
  isSubmitting: boolean;
  productName: string;
  currentStock: number;
  unit: string;
}

const MOVEMENT_TYPES: { value: StockMovementType; label: string; isEntry: boolean }[] = [
  { value: 'ENTRY', label: 'Entrada', isEntry: true },
  { value: 'PURCHASE', label: 'Compra', isEntry: true },
  { value: 'RETURN', label: 'Devolução de cliente', isEntry: true },
  { value: 'ADJUSTMENT_IN', label: 'Ajuste de inventário (+)', isEntry: true },
  { value: 'TRANSFER_IN', label: 'Transferência recebida', isEntry: true },
  { value: 'EXIT', label: 'Saída', isEntry: false },
  { value: 'SALE', label: 'Venda', isEntry: false },
  { value: 'LOSS', label: 'Perda/Avaria', isEntry: false },
  { value: 'CONSUMPTION', label: 'Consumo interno', isEntry: false },
  { value: 'ADJUSTMENT_OUT', label: 'Ajuste de inventário (-)', isEntry: false },
  { value: 'TRANSFER_OUT', label: 'Transferência enviada', isEntry: false },
];

function StockMovementDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  productName,
  currentStock,
  unit,
}: StockMovementDialogProps) {
  const [formData, setFormData] = useState<StockMovementFormData>({
    type: 'ENTRY',
    quantity: 1,
    unitCost: undefined,
    reason: '',
    notes: '',
  });

  const selectedType = MOVEMENT_TYPES.find((t) => t.value === formData.type);
  const isEntry = selectedType?.isEntry ?? true;
  const newStock = isEntry
    ? currentStock + formData.quantity
    : currentStock - formData.quantity;

  const handleSubmit = async () => {
    await onSubmit(formData);
    setFormData({
      type: 'ENTRY',
      quantity: 1,
      unitCost: undefined,
      reason: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentação de Estoque</DialogTitle>
          <DialogDescription>
            {productName} - Estoque atual: {currentStock} {unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value as StockMovementType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Entradas
                </div>
                {MOVEMENT_TYPES.filter((t) => t.isEntry).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Saídas
                </div>
                {MOVEMENT_TYPES.filter((t) => !t.isEntry).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
            </div>

            {(formData.type === 'PURCHASE' || formData.type === 'ENTRY') && (
              <div className="space-y-2">
                <Label>Custo Unitário</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.unitCost || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unitCost: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input
              placeholder="Ex: Reposição semanal"
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          {/* Preview */}
          <div className={cn(
            'rounded-lg p-3 text-sm',
            isEntry ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estoque após movimento:</span>
              <span className={cn(
                'font-semibold',
                newStock < 0 ? 'text-red-600' : ''
              )}>
                {newStock} {unit}
              </span>
            </div>
            {!isEntry && newStock < 0 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Estoque insuficiente para esta operação
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!isEntry && newStock < 0)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Stock Movements List Component
// ============================================================================

interface StockMovementsListProps {
  productId: string;
}

function StockMovementsList({ productId }: StockMovementsListProps) {
  const { movements, isLoading } = useStockMovements({ productId, limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>Nenhuma movimentação registrada</p>
      </div>
    );
  }

  const typeLabels: Record<StockMovementType, string> = {
    ENTRY: 'Entrada',
    EXIT: 'Saída',
    PURCHASE: 'Compra',
    SALE: 'Venda',
    RETURN: 'Devolução',
    LOSS: 'Perda',
    ADJUSTMENT_IN: 'Ajuste (+)',
    ADJUSTMENT_OUT: 'Ajuste (-)',
    TRANSFER_IN: 'Transf. recebida',
    TRANSFER_OUT: 'Transf. enviada',
    CONSUMPTION: 'Consumo',
  };

  const isEntryType = (type: StockMovementType): boolean => {
    return ['ENTRY', 'PURCHASE', 'RETURN', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(type);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-center">Quantidade</TableHead>
          <TableHead className="text-center">Estoque</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="text-sm">
              {format(new Date(movement.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
            </TableCell>
            <TableCell>
              <Badge variant={isEntryType(movement.type) ? 'default' : 'secondary'} className="text-xs">
                {isEntryType(movement.type) ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {typeLabels[movement.type]}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <span className={cn(
                'font-medium',
                isEntryType(movement.type) ? 'text-green-600' : 'text-red-600'
              )}>
                {isEntryType(movement.type) ? '+' : '-'}{movement.quantity}
              </span>
            </TableCell>
            <TableCell className="text-center text-muted-foreground">
              {movement.previousStock} → {movement.newStock}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
              {movement.reason || '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);

  const {
    product,
    isLoading,
    isError,
    activate,
    deactivate,
    delete: deleteProduct,
    isActivating,
    isDeactivating,
    isDeleting,
  } = useProduct(productId);

  const {
    addMovement,
    isAddingMovement,
  } = useStockMovements({ productId, enabled: !!product });

  const handleDelete = useCallback(async () => {
    try {
      await deleteProduct();
      router.push('/products');
    } catch {
      // Error handled by hook
    }
  }, [deleteProduct, router]);

  const handleAddMovement = useCallback(async (data: StockMovementFormData) => {
    await addMovement(data);
    setShowMovementDialog(false);
  }, [addMovement]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !product) {
    return <NotFound />;
  }

  const isActive = product.status === 'ACTIVE';
  const costPrice = product.costPrice ? Number(product.costPrice) : 0;
  const salePrice = Number(product.salePrice);
  const margin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;
  const profit = salePrice - costPrice;
  const stockStatus = getStockStatus({
    currentStock: product.currentStock,
    minStock: product.minStock,
    maxStock: product.maxStock,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0] as string}
                alt={product.name}
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {product.sku && `SKU: ${product.sku}`}
              {product.sku && product.brand && ' • '}
              {product.brand}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowMovementDialog(true)}>
            <Boxes className="mr-2 h-4 w-4" />
            Movimentar Estoque
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/products/${productId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isActive ? (
                <DropdownMenuItem
                  onClick={() => deactivate()}
                  disabled={isDeactivating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => activate()}
                  disabled={isActivating}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Preço de Venda"
          value={formatCurrency(salePrice)}
          icon={DollarSign}
          description={costPrice > 0 ? `Custo: ${formatCurrency(costPrice)}` : undefined}
        />
        <StatCard
          title="Margem de Lucro"
          value={costPrice > 0 ? `${margin.toFixed(1)}%` : '—'}
          icon={TrendingUp}
          description={costPrice > 0 ? `${formatCurrency(profit)}/unidade` : 'Custo não informado'}
          trend={margin > 0 ? 'up' : margin < 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Estoque Atual"
          value={`${product.currentStock} ${product.unit}`}
          icon={Boxes}
          description={`Mín: ${product.minStock} ${product.unit}`}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={stockStatus.variant} className="text-base px-3 py-1">
              {stockStatus.label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="stock">Movimentações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.description && (
                    <div>
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="mt-1">{product.description}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">SKU</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono">{product.sku || '—'}</p>
                        {product.sku && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(product.sku!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Código de Barras</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono">{product.barcode || '—'}</p>
                        {product.barcode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(product.barcode!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Marca</Label>
                      <p className="mt-1">{product.brand || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Categoria</Label>
                      <p className="mt-1">
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Unidade</Label>
                      <p className="mt-1">{product.unit}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fornecedor</Label>
                      <p className="mt-1">
                        {product.supplier ? (
                          <span>{product.supplier.name}</span>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    {product.isSellable && (
                      <Badge variant="secondary">
                        <DollarSign className="mr-1 h-3 w-3" />
                        Para venda
                      </Badge>
                    )}
                    {product.isConsumable && (
                      <Badge variant="secondary">
                        <Package className="mr-1 h-3 w-3" />
                        Consumível
                      </Badge>
                    )}
                    {product.tags && (product.tags as string[]).map((tag) => (
                      <Badge key={tag} variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                    <CardDescription>
                      Últimas 50 movimentações de estoque
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowMovementDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Movimentação
                  </Button>
                </CardHeader>
                <CardContent>
                  <StockMovementsList productId={productId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowMovementDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Estoque
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/products/${productId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Produto
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => isActive ? deactivate() : activate()}
                disabled={isActivating || isDeactivating}
              >
                {isActive ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>
                  {format(new Date(product.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em</span>
                <span>
                  {format(new Date(product.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {product.id.slice(0, 8)}...
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Movement Dialog */}
      <StockMovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        onSubmit={handleAddMovement}
        isSubmitting={isAddingMovement}
        productName={product.name}
        currentStock={product.currentStock}
        unit={product.unit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{product.name}"? Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
