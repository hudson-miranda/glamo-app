/**
 * GLAMO - Edit Category Page
 * Enterprise-grade category editing with unsaved changes detection
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  Folder,
  Palette,
  FileText,
  Layers,
  AlertCircle,
  Info,
  Check,
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Hooks
import { useCategory, useCategoryMutations, useParentCategoryOptions } from '@/hooks/useCategories';

// ============================================================================
// Form Schema
// ============================================================================

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  parentId: z.string().uuid().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// ============================================================================
// Loading Skeleton
// ============================================================================

function EditCategorySkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
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
          A categoria que você está tentando editar não existe ou foi removida.
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
// Color Picker Component
// ============================================================================

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

interface ColorPickerProps {
  value?: string | null;
  onChange: (color: string | null) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || '#3b82f6');

  useEffect(() => {
    if (value) {
      setCustomColor(value);
    }
  }, [value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    onChange(e.target.value);
  };

  const handleClearColor = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-10"
          type="button"
        >
          {value ? (
            <>
              <div
                className="w-5 h-5 rounded mr-2 border"
                style={{ backgroundColor: value }}
              />
              <span>{value}</span>
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Selecionar cor...</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cores Predefinidas</Label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`
                    w-8 h-8 rounded-lg border-2 transition-all
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${value === color ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cor Personalizada</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0"
              />
              <Input
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleClearColor} type="button">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)} type="button">
              <Check className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Parent Category Selector Component
// ============================================================================

interface ParentSelectorProps {
  value?: string | null;
  onChange: (parentId: string | null) => void;
  excludeId?: string;
}

function ParentSelector({ value, onChange, excludeId }: ParentSelectorProps) {
  const { options, isLoading } = useParentCategoryOptions(excludeId);

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecionar categoria pai..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center">
            <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Nenhuma (Categoria Raiz)</span>
          </div>
        </SelectItem>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Carregando...</span>
            </div>
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Preview Card Component
// ============================================================================

interface PreviewCardProps {
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  hasChanges: boolean;
}

function PreviewCard({ name, description, color, isActive, hasChanges }: PreviewCardProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Pré-visualização</CardTitle>
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Alterações pendentes
            </Badge>
          )}
        </div>
        <CardDescription>Assim a categoria aparecerá</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div
            className="p-3 rounded-xl shrink-0"
            style={{
              backgroundColor: color ? `${color}20` : '#f3f4f6',
            }}
          >
            <Folder
              className="h-6 w-6"
              style={{ color: color || '#6b7280' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">
                {name || 'Nome da Categoria'}
              </h3>
              <Badge variant={isActive ? 'default' : 'secondary'} className="shrink-0">
                {isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cor:</span>
            {color ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-xs">{color}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Padrão</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const {
    category,
    isLoading,
    update,
    remove,
    isUpdating,
    isDeleting,
  } = useCategory(categoryId);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: null,
      color: null,
      icon: null,
      isActive: true,
    },
  });

  // Populate form when category loads
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || null,
        color: category.color || null,
        icon: category.icon || null,
        isActive: category.isActive,
      });
    }
  }, [category, form]);

  const watchedValues = form.watch();
  const isDirty = form.formState.isDirty;

  // Handle unsaved changes warning
  const handleNavigate = useCallback((path: string) => {
    if (isDirty) {
      setPendingNavigation(path);
      setUnsavedDialogOpen(true);
    } else {
      router.push(path);
    }
  }, [isDirty, router]);

  const handleConfirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await update({
        name: data.name,
        description: data.description || null,
        parentId: data.parentId || null,
        color: data.color || null,
        icon: data.icon || null,
        isActive: data.isActive,
      });
      
      router.push(`/categories/${categoryId}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async () => {
    try {
      await remove();
      router.push('/categories');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Handle loading state
  if (isLoading) {
    return <EditCategorySkeleton />;
  }

  // Handle not found
  if (!category) {
    return <CategoryNotFound />;
  }

  const hasChildren = (category._count?.children || 0) > 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('/categories')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Categoria</h1>
            <p className="text-muted-foreground">
              Atualize as informações de "{category.name}"
            </p>
          </div>
        </div>

        {isDirty && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Alterações não salvas
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Defina o nome e descrição da categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Categoria *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Corte de Cabelo, Massagem, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nome que será exibido para os clientes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva brevemente esta categoria..."
                            className="min-h-[100px] resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Descrição opcional para ajudar a identificar a categoria
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Hierarchy Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Hierarquia
                  </CardTitle>
                  <CardDescription>
                    Defina a posição desta categoria na estrutura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Pai</FormLabel>
                        <FormControl>
                          <ParentSelector
                            value={field.value}
                            onChange={field.onChange}
                            excludeId={categoryId}
                          />
                        </FormControl>
                        <FormDescription>
                          Selecione uma categoria pai para transformar em subcategoria
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasChildren && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        Esta categoria possui {category._count?.children} subcategoria(s).
                        Mover para outra categoria pai também moverá suas subcategorias.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Appearance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência visual da categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <ColorPicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Cor para identificar visualmente a categoria
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Opções adicionais da categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Categoria Ativa</FormLabel>
                          <FormDescription>
                            Categorias inativas não aparecem nas listagens
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                  <CardDescription>
                    Ações irreversíveis para esta categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Excluir Categoria</h4>
                      <p className="text-sm text-muted-foreground">
                        {hasChildren
                          ? 'Não é possível excluir uma categoria com subcategorias.'
                          : 'Esta ação não pode ser desfeita. Os serviços vinculados ficarão sem categoria.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={hasChildren}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleNavigate(`/categories/${categoryId}`)}
                >
                  Cancelar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.reset()}
                    disabled={!isDirty}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Desfazer
                  </Button>

                  <Button
                    type="submit"
                    disabled={isUpdating || !isDirty}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="hidden lg:block">
              <PreviewCard
                name={watchedValues.name}
                description={watchedValues.description}
                color={watchedValues.color}
                isActive={watchedValues.isActive}
                hasChanges={isDirty}
              />
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação
              não pode ser desfeita. Os serviços vinculados ficarão sem categoria.
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

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você possui alterações não salvas. Deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Continuar Editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Sair sem Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
