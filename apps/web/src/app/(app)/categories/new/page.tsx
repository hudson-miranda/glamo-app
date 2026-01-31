/**
 * GLAMO - New Category Page
 * Enterprise-grade category creation form with parent selection
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

// Hooks
import { useCategoryMutations, useParentCategoryOptions } from '@/hooks/useCategories';

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
// Color Picker Component
// ============================================================================

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

interface ColorPickerProps {
  value?: string | null;
  onChange: (color: string | null) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || '#3b82f6');

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearColor}
              type="button"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              type="button"
            >
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
}

function PreviewCard({ name, description, color, isActive }: PreviewCardProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Pré-visualização</CardTitle>
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

export default function NewCategoryPage() {
  const router = useRouter();
  const { create, isCreating } = useCategoryMutations();

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

  const watchedValues = form.watch();

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      const category = await create({
        name: data.name,
        description: data.description || null,
        parentId: data.parentId || null,
        color: data.color || null,
        icon: data.icon || null,
        isActive: data.isActive,
      });
      
      router.push(`/categories/${category.id}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Categoria</h1>
          <p className="text-muted-foreground">
            Crie uma nova categoria para organizar seus serviços
          </p>
        </div>
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
                          />
                        </FormControl>
                        <FormDescription>
                          Selecione uma categoria pai para criar uma subcategoria
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Dica</AlertTitle>
                    <AlertDescription>
                      Categorias podem ter até 3 níveis de profundidade. Se não
                      selecionar uma categoria pai, esta será uma categoria raiz.
                    </AlertDescription>
                  </Alert>
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

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button variant="outline" asChild>
                  <Link href="/categories">Cancelar</Link>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Categoria
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
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
