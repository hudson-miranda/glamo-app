/**
 * GLAMO - Supplier Detail Page
 * Enterprise-grade supplier view with products
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  StarHalf,
  Package,
  CheckCircle2,
  XCircle,
  Ban,
  MoreVertical,
  User,
  CreditCard,
  FileText,
  Smartphone,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn, formatCurrency, formatPhone, formatDocument } from '@/lib/utils';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useSupplier, useSupplierProducts } from '@/hooks/useSuppliers';
import type { SupplierStatus } from '@prisma/client';

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

function getStatusIcon(status: SupplierStatus) {
  const icons: Record<SupplierStatus, typeof CheckCircle2> = {
    ACTIVE: CheckCircle2,
    INACTIVE: XCircle,
    BLOCKED: Ban,
  };
  return icons[status];
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
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
      <h2 className="text-xl font-semibold">Fornecedor não encontrado</h2>
      <p className="mt-2 text-muted-foreground">
        O fornecedor que você está procurando não existe ou foi removido.
      </p>
      <Button asChild className="mt-6">
        <Link href="/suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Fornecedores
        </Link>
      </Button>
    </div>
  );
}

// ============================================================================
// Rating Component
// ============================================================================

interface RatingDisplayProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

function RatingDisplay({ rating, size = 'md' }: RatingDisplayProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (rating === null) {
    return <span className="text-sm text-muted-foreground">Não avaliado</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: fullStars }, (_, i) => (
        <Star key={`full-${i}`} className={cn(starSize, 'fill-yellow-400 text-yellow-400')} />
      ))}
      {hasHalf && <StarHalf className={cn(starSize, 'fill-yellow-400 text-yellow-400')} />}
      {Array.from({ length: emptyStars }, (_, i) => (
        <Star key={`empty-${i}`} className={cn(starSize, 'text-muted-foreground/30')} />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
    </div>
  );
}

// ============================================================================
// Rating Dialog Component
// ============================================================================

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRating: number | null;
  onSubmit: (rating: number) => void;
  isLoading?: boolean;
}

function RatingDialog({ open, onOpenChange, currentRating, onSubmit, isLoading }: RatingDialogProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    onSubmit(rating);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar Fornecedor</DialogTitle>
          <DialogDescription>
            Selecione uma nota de 1 a 5 estrelas
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 5 }, (_, i) => {
              const value = i + 1;
              const isFilled = (hoverRating || rating) >= value;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-all',
                      isFilled
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30 hover:text-yellow-400/50'
                    )}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {rating > 0 ? `${rating} de 5 estrelas` : 'Clique para avaliar'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Info Card Component
// ============================================================================

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function InfoCard({ title, icon, children }: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ============================================================================
// Copy Button Component
// ============================================================================

function CopyButton({ value, label }: { value: string; label: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

// ============================================================================
// Products Tab Component
// ============================================================================

interface ProductsTabProps {
  supplierId: string;
}

function ProductsTab({ supplierId }: ProductsTabProps) {
  const router = useRouter();
  const { data, isLoading } = useSupplierProducts(supplierId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const products = data?.data || [];

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Nenhum produto vinculado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Este fornecedor não possui produtos cadastrados
          </p>
          <Button asChild className="mt-4">
            <Link href="/products/new">
              Cadastrar Produto
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: any) => (
            <TableRow
              key={product.id}
              className="cursor-pointer"
              onClick={() => router.push(`/products/${product.id}`)}
            >
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku || '—'}</TableCell>
              <TableCell>{formatCurrency(Number(product.salePrice))}</TableCell>
              <TableCell>{product.currentStock}</TableCell>
              <TableCell>
                <Badge
                  variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
                >
                  {product.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const {
    supplier,
    isLoading,
    isError,
    activate,
    deactivate,
    block,
    delete: deleteSupplier,
    updateRating,
    isActivating,
    isDeactivating,
    isBlocking,
    isDeleting,
    isUpdatingRating,
  } = useSupplier(supplierId);

  const handleDelete = useCallback(async () => {
    try {
      await deleteSupplier();
      router.push('/suppliers');
    } catch {
      // Error handled by hook
    }
  }, [deleteSupplier, router]);

  const handleStatusChange = useCallback(async (action: 'activate' | 'deactivate' | 'block') => {
    try {
      if (action === 'activate') await activate();
      else if (action === 'deactivate') await deactivate();
      else await block();
    } catch {
      // Error handled by hook
    }
  }, [activate, deactivate, block]);

  const handleRatingSubmit = useCallback(async (rating: number) => {
    try {
      await updateRating(rating);
      setShowRatingDialog(false);
    } catch {
      // Error handled by hook
    }
  }, [updateRating]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !supplier) {
    return <NotFound />;
  }

  const StatusIcon = getStatusIcon(supplier.status);
  const address = supplier.address as {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | null;
  const bankInfo = supplier.bankInfo as {
    bankName?: string;
    bankCode?: string;
    agency?: string;
    accountNumber?: string;
    accountType?: string;
    pixKey?: string;
    pixKeyType?: string;
  } | null;

  const fullAddress = address
    ? [
        address.street,
        address.number,
        address.complement,
        address.neighborhood,
        [address.city, address.state].filter(Boolean).join(' - '),
        address.zipCode,
      ].filter(Boolean).join(', ')
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/suppliers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge variant={getStatusVariant(supplier.status)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {getStatusLabel(supplier.status)}
              </Badge>
            </div>
            {supplier.tradeName && (
              <p className="text-muted-foreground">{supplier.tradeName}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <RatingDisplay rating={supplier.rating} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRatingDialog(true)}
              >
                <Star className="mr-1 h-4 w-4" />
                Avaliar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${supplierId}/edit`}>
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
              {supplier.status !== 'ACTIVE' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('activate')}
                  disabled={isActivating}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              {supplier.status === 'ACTIVE' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('deactivate')}
                  disabled={isDeactivating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              )}
              {supplier.status !== 'BLOCKED' && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange('block')}
                  disabled={isBlocking}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Bloquear
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produtos
            {supplier._count?.products !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {supplier._count.products}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <InfoCard title="Contato" icon={<Mail className="h-4 w-4 text-muted-foreground" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {supplier.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">E-mail</p>
                          <p className="text-sm">{supplier.email}</p>
                        </div>
                      </div>
                      <CopyButton value={supplier.email} label="E-mail" />
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm">{formatPhone(supplier.phone)}</p>
                        </div>
                      </div>
                      <CopyButton value={supplier.phone} label="Telefone" />
                    </div>
                  )}
                  {supplier.whatsapp && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">WhatsApp</p>
                          <p className="text-sm">{formatPhone(supplier.whatsapp)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                      >
                        <a
                          href={`https://wa.me/55${supplier.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {supplier.website}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {!supplier.email && !supplier.phone && !supplier.whatsapp && !supplier.website && (
                  <p className="text-sm text-muted-foreground">Nenhuma informação de contato cadastrada</p>
                )}
              </InfoCard>

              {/* Address */}
              {fullAddress && (
                <InfoCard title="Endereço" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm">{fullAddress}</p>
                    <CopyButton value={fullAddress} label="Endereço" />
                  </div>
                </InfoCard>
              )}

              {/* Contact Person */}
              {(supplier.contactName || supplier.contactEmail || supplier.contactPhone) && (
                <InfoCard title="Pessoa de Contato" icon={<User className="h-4 w-4 text-muted-foreground" />}>
                  <div className="space-y-2">
                    {supplier.contactName && (
                      <p className="font-medium">{supplier.contactName}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {supplier.contactEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {supplier.contactEmail}
                        </div>
                      )}
                      {supplier.contactPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhone(supplier.contactPhone)}
                        </div>
                      )}
                    </div>
                  </div>
                </InfoCard>
              )}

              {/* Bank Info */}
              {bankInfo && (bankInfo.bankName || bankInfo.pixKey) && (
                <InfoCard title="Dados Bancários" icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}>
                  <div className="space-y-3">
                    {bankInfo.bankName && (
                      <div className="grid gap-2 sm:grid-cols-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Banco</p>
                          <p>{bankInfo.bankName} {bankInfo.bankCode && `(${bankInfo.bankCode})`}</p>
                        </div>
                        {bankInfo.agency && (
                          <div>
                            <p className="text-muted-foreground text-xs">Agência</p>
                            <p>{bankInfo.agency}</p>
                          </div>
                        )}
                        {bankInfo.accountNumber && (
                          <div>
                            <p className="text-muted-foreground text-xs">Conta</p>
                            <p>{bankInfo.accountNumber}</p>
                          </div>
                        )}
                        {bankInfo.accountType && (
                          <div>
                            <p className="text-muted-foreground text-xs">Tipo</p>
                            <p>{bankInfo.accountType === 'checking' ? 'Corrente' : 'Poupança'}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {bankInfo.pixKey && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Chave PIX ({bankInfo.pixKeyType?.toUpperCase() || 'Chave'})
                          </p>
                          <p className="text-sm font-mono">{bankInfo.pixKey}</p>
                        </div>
                        <CopyButton value={bankInfo.pixKey} label="Chave PIX" />
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}

              {/* Notes */}
              {supplier.notes && (
                <InfoCard title="Observações" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
                  <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
                </InfoCard>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Document */}
              {supplier.document && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Documento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {supplier.documentType || 'Documento'}
                        </p>
                        <p className="font-mono">
                          {formatDocument(supplier.document, supplier.documentType)}
                        </p>
                      </div>
                      <CopyButton value={supplier.document} label="Documento" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commercial Terms */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Condições Comerciais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.paymentTerms && (
                    <div>
                      <p className="text-xs text-muted-foreground">Pagamento</p>
                      <p className="text-sm">{supplier.paymentTerms}</p>
                    </div>
                  )}
                  {supplier.deliveryTime !== null && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Prazo de entrega</p>
                        <p className="text-sm">{supplier.deliveryTime} dias</p>
                      </div>
                    </div>
                  )}
                  {supplier.minimumOrder !== null && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pedido mínimo</p>
                        <p className="text-sm">{formatCurrency(Number(supplier.minimumOrder))}</p>
                      </div>
                    </div>
                  )}
                  {!supplier.paymentTerms && supplier.deliveryTime === null && supplier.minimumOrder === null && (
                    <p className="text-sm text-muted-foreground">Nenhuma condição cadastrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {supplier.tags && (supplier.tags as string[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {(supplier.tags as string[]).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/suppliers/${supplierId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Fornecedor
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/products/new">
                      <Package className="mr-2 h-4 w-4" />
                      Cadastrar Produto
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowRatingDialog(true)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Avaliar Fornecedor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab supplierId={supplierId} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{supplier.name}"? 
              Esta ação não pode ser desfeita se o fornecedor possuir produtos vinculados.
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

      {/* Rating Dialog */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        currentRating={supplier.rating}
        onSubmit={handleRatingSubmit}
        isLoading={isUpdatingRating}
      />
    </div>
  );
}
