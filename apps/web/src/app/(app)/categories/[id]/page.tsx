/**
 * GLAMO - Category Detail Page
 * Enterprise-grade category view with services and subcategories
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  Folder,
  FolderOpen,
  Package,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  Eye,
  RotateCcw,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Tag,
  Loader2,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Hooks
import { useCategory, useCategoryTree } from '@/hooks/useCategories';

// Types
import type { Category, CategoryTreeNode } from '@/types/category';

// ============================================================================
// Loading Skeleton
// ============================================================================

function CategoryDetailSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Not Found Component
// ============================================================================

function CategoryNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="p-4 rounded-full bg-muted inline-block">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Categoria não encontrada</h2>
        <p className="text-muted-foreground">
          A categoria que você está procurando não existe ou foi removida.
        </p>
        <Button asChild>
          <Link href="/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Categorias
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Stats Cards Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, description, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Breadcrumb Component
// ============================================================================

interface BreadcrumbProps {
  category: Category;
}

function CategoryBreadcrumb({ category }: BreadcrumbProps) {
  // Build breadcrumb from parent chain
  const breadcrumbs: Array<{ id: string; name: string }> = [];
  
  let current = category.parent;
  while (current) {
    breadcrumbs.unshift({ id: current.id, name: current.name });
    current = current.parent;
  }
  
  breadcrumbs.push({ id: category.id, name: category.name });

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/categories" className="hover:text-foreground">
        Categorias
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{item.name}</span>
          ) : (
            <Link href={`/categories/${item.id}`} className="hover:text-foreground">
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Services Tab Content
// ============================================================================

interface ServicesTabProps {
  services: Category['services'];
  categoryId: string;
}

function ServicesTab({ services, categoryId }: ServicesTabProps) {
  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Nenhum serviço vinculado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione serviços a esta categoria
        </p>
        <Button asChild>
          <Link href={`/services/new?categoryId=${categoryId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: service.color ? `${service.color}20` : '#f3f4f6',
              }}
            >
              <Tag
                className="h-5 w-5"
                style={{ color: service.color || '#6b7280' }}
              />
            </div>
            <div>
              <h4 className="font-medium">{service.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{service.duration} min</span>
                <span>•</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(service.price)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={service.isActive ? 'default' : 'secondary'}>
              {service.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/services/${service.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Subcategories Tab Content
// ============================================================================

interface SubcategoriesTabProps {
  children: Category['children'];
  categoryId: string;
}

function SubcategoriesTab({ children, categoryId }: SubcategoriesTabProps) {
  const router = useRouter();

  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Nenhuma subcategoria</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie subcategorias para organizar melhor seus serviços
        </p>
        <Button asChild>
          <Link href={`/categories/new?parentId=${categoryId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => (
        <Card
          key={child.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/categories/${child.id}`)}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{
                  backgroundColor: child.color ? `${child.color}20` : '#f3f4f6',
                }}
              >
                <Folder
                  className="h-5 w-5"
                  style={{ color: child.color || '#6b7280' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{child.name}</h4>
                  <Badge variant={child.isActive ? 'default' : 'secondary'} className="shrink-0">
                    {child.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                {child.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {child.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {child._count?.services !== undefined && (
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {child._count.services} serviço(s)
                    </span>
                  )}
                  {child._count?.children !== undefined && child._count.children > 0 && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {child._count.children} subcategoria(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Activity Tab Content
// ============================================================================

function ActivityTab() {
  // TODO: Implement activity log
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">Histórico de Atividades</h3>
      <p className="text-sm text-muted-foreground">
        O histórico de alterações desta categoria aparecerá aqui
      </p>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    category,
    isLoading,
    isError,
    error,
    remove,
    activate,
    deactivate,
    restore,
    isDeleting,
    isActivating,
    isDeactivating,
    isRestoring,
  } = useCategory(categoryId);

  // Handle loading state
  if (isLoading) {
    return <CategoryDetailSkeleton />;
  }

  // Handle not found
  if (!category) {
    return <CategoryNotFound />;
  }

  // Stats data
  const serviceCount = category._count?.services || category.services?.length || 0;
  const childrenCount = category._count?.children || category.children?.length || 0;

  const handleDelete = async () => {
    try {
      await remove();
      router.push('/categories');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleStatus = async () => {
    if (category.isActive) {
      await deactivate();
    } else {
      await activate();
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Breadcrumb */}
      <CategoryBreadcrumb category={category} />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div
            className="p-4 rounded-xl shrink-0"
            style={{
              backgroundColor: category.color ? `${category.color}20` : '#f3f4f6',
            }}
          >
            <Folder
              className="h-8 w-8"
              style={{ color: category.color || '#6b7280' }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                {category.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
              {category.deletedAt && (
                <Badge variant="destructive">Excluída</Badge>
              )}
            </div>
            {category.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
            {category.parent && (
              <p className="text-sm text-muted-foreground mt-2">
                Subcategoria de{' '}
                <Link
                  href={`/categories/${category.parent.id}`}
                  className="font-medium hover:underline"
                >
                  {category.parent.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {category.deletedAt ? (
            <Button onClick={() => restore()} disabled={isRestoring}>
              {isRestoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restaurar
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/categories/${category.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={handleToggleStatus}
                    disabled={isActivating || isDeactivating}
                  >
                    {category.isActive ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href={`/categories/new?parentId=${category.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Subcategoria
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                    disabled={childrenCount > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Serviços"
          value={serviceCount}
          description="vinculados a esta categoria"
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Subcategorias"
          value={childrenCount}
          description="filhas diretas"
          icon={Layers}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Nível"
          value={category.parent ? 'Subcategoria' : 'Raiz'}
          description={category.parent ? `Filho de ${category.parent.name}` : 'Categoria principal'}
          icon={Folder}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Ordem"
          value={category.order}
          description="posição na listagem"
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-green-100"
        />
      </div>

      {/* Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serviços ({serviceCount})
              </TabsTrigger>
              <TabsTrigger value="subcategories" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Subcategorias ({childrenCount})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Detalhes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">ID</span>
                      <span className="font-mono text-sm">{category.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Cor</span>
                      {category.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-mono text-sm">{category.color}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Padrão</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Ordem</span>
                      <span>{category.order}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Datas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Criado em</span>
                      <span>
                        {format(new Date(category.createdAt), "dd 'de' MMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Atualizado em</span>
                      <span>
                        {format(new Date(category.updatedAt), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {category.deletedAt && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground">Excluído em</span>
                        <span className="text-destructive">
                          {format(new Date(category.deletedAt), "dd 'de' MMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services" className="mt-0">
              <ServicesTab services={category.services} categoryId={category.id} />
            </TabsContent>

            <TabsContent value="subcategories" className="mt-0">
              <SubcategoriesTab children={category.children} categoryId={category.id} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <ActivityTab />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação
              não pode ser desfeita. Categorias com subcategorias não podem ser
              excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
