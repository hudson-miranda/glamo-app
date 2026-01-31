/**
 * GLAMO - New Product Page
 * Enterprise-grade product creation form with pricing, stock, images
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  DollarSign,
  Boxes,
  Tag,
  Truck,
  Image as ImageIcon,
  Plus,
  X,
  Info,
  Percent,
  Calculator,
  AlertCircle,
  Barcode,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
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

import { useProductMutations } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
// import { useSuppliers } from '@/hooks/useSuppliers'; // Will be created later

// ============================================================================
// Form Schema
// ============================================================================

const productFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  sku: z.string().max(50, 'SKU deve ter no máximo 50 caracteres').optional(),
  barcode: z.string().max(50, 'Código de barras deve ter no máximo 50 caracteres').optional(),
  brand: z.string().max(100, 'Marca deve ter no máximo 100 caracteres').optional(),
  categoryId: z.string().uuid('Selecione uma categoria').optional().nullable(),
  supplierId: z.string().uuid('Selecione um fornecedor').optional().nullable(),
  costPrice: z.coerce.number().min(0, 'Preço de custo deve ser maior ou igual a zero').default(0),
  salePrice: z.coerce.number().min(0.01, 'Preço de venda é obrigatório'),
  minStock: z.coerce.number().int().min(0, 'Estoque mínimo deve ser maior ou igual a zero').default(0),
  maxStock: z.coerce.number().int().min(0, 'Estoque máximo deve ser maior ou igual a zero').optional().nullable(),
  unit: z.string().max(20).default('un'),
  isSellable: z.boolean().default(true),
  isConsumable: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

// ============================================================================
// Units Options
// ============================================================================

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'pç', label: 'Peça (pç)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'mt', label: 'Metro (mt)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'par', label: 'Par' },
  { value: 'kit', label: 'Kit' },
];

// ============================================================================
// Preview Card Component
// ============================================================================

interface PreviewCardProps {
  data: Partial<ProductFormData>;
  categoryName?: string;
}

function PreviewCard({ data, categoryName }: PreviewCardProps) {
  const costPrice = data.costPrice || 0;
  const salePrice = data.salePrice || 0;
  const margin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;
  const profit = salePrice - costPrice;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Prévia do Produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Preview */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {data.name || 'Nome do Produto'}
            </p>
            {data.sku && (
              <p className="text-xs text-muted-foreground">SKU: {data.sku}</p>
            )}
            {categoryName && (
              <Badge variant="outline" className="text-xs mt-1">
                {categoryName}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Pricing Summary */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Precificação</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/50">
              <p className="text-xs text-muted-foreground">Custo</p>
              <p className="font-medium">{formatCurrency(costPrice)}</p>
            </div>
            <div className="p-2 rounded bg-primary/10">
              <p className="text-xs text-muted-foreground">Venda</p>
              <p className="font-medium">{formatCurrency(salePrice)}</p>
            </div>
          </div>
          {costPrice > 0 && salePrice > 0 && (
            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
              <div className="flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Margem:</span>
              </div>
              <span className={cn(
                'font-medium',
                margin > 0 ? 'text-green-600' : margin < 0 ? 'text-red-600' : ''
              )}>
                {margin.toFixed(1)}%
              </span>
            </div>
          )}
          {profit !== 0 && (
            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Lucro:</span>
              </div>
              <span className={cn(
                'font-medium',
                profit > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(profit)}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Stock Info */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Estoque</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/50">
              <p className="text-xs text-muted-foreground">Mínimo</p>
              <p className="font-medium">{data.minStock || 0} {data.unit || 'un'}</p>
            </div>
            {data.maxStock && (
              <div className="p-2 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">Máximo</p>
                <p className="font-medium">{data.maxStock} {data.unit || 'un'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Type Badges */}
        <div className="flex flex-wrap gap-1.5">
          {data.isSellable && (
            <Badge variant="secondary" className="text-xs">
              <DollarSign className="mr-1 h-3 w-3" />
              Para venda
            </Badge>
          )}
          {data.isConsumable && (
            <Badge variant="secondary" className="text-xs">
              <Package className="mr-1 h-3 w-3" />
              Consumível
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Margin Calculator Component
// ============================================================================

interface MarginCalculatorProps {
  costPrice: number;
  salePrice: number;
  onSalePriceChange: (price: number) => void;
}

function MarginCalculator({ costPrice, salePrice, onSalePriceChange }: MarginCalculatorProps) {
  const [marginPercent, setMarginPercent] = useState(30);

  const calculateFromMargin = useCallback(() => {
    if (costPrice > 0) {
      const newPrice = costPrice * (1 + marginPercent / 100);
      onSalePriceChange(Number(newPrice.toFixed(2)));
    }
  }, [costPrice, marginPercent, onSalePriceChange]);

  const currentMargin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Calculadora de Margem</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value))}
            className="w-20 h-8 text-sm"
            min={0}
            max={1000}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={calculateFromMargin}
            disabled={costPrice <= 0}
          >
            Aplicar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Margem atual: <span className={cn(
            'font-medium',
            currentMargin > 0 ? 'text-green-600' : currentMargin < 0 ? 'text-red-600' : ''
          )}>{currentMargin.toFixed(1)}%</span>
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tags Input Component
// ============================================================================

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

function TagsInput({ value, onChange }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback(() => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue('');
  }, [inputValue, value, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }, [addTag, inputValue, value, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[40px] border rounded-md bg-background">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? 'Digite uma tag e pressione Enter' : ''}
          className="flex-1 min-w-[120px] h-6 border-0 p-0 focus-visible:ring-0 text-sm"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { create, isCreating } = useProductMutations();
  const { categories } = useCategories({ limit: 100 });
  // const { suppliers } = useSuppliers({ limit: 100 }); // Will be added later

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      brand: '',
      categoryId: null,
      supplierId: null,
      costPrice: 0,
      salePrice: 0,
      minStock: 0,
      maxStock: null,
      unit: 'un',
      isSellable: true,
      isConsumable: false,
      tags: [],
    },
  });

  const watchedValues = form.watch();

  // Track changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const product = await create({
        ...data,
        categoryId: data.categoryId || undefined,
        supplierId: data.supplierId || undefined,
        maxStock: data.maxStock || undefined,
      });
      router.push(`/products/${product.id}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      router.push('/products');
    }
  }, [hasUnsavedChanges, router]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    router.push('/products');
  }, [router]);

  const selectedCategory = categories?.find((c) => c.id === watchedValues.categoryId);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Novo Produto</h1>
            <p className="text-muted-foreground">
              Adicione um novo produto ao catálogo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Alterações não salvas
            </Badge>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">
                    <Package className="mr-2 h-4 w-4" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="pricing">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Preços
                  </TabsTrigger>
                  <TabsTrigger value="stock">
                    <Boxes className="mr-2 h-4 w-4" />
                    Estoque
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Produto</CardTitle>
                      <CardDescription>
                        Dados básicos de identificação
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Shampoo Profissional 500ml" {...field} />
                            </FormControl>
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
                                placeholder="Descreva o produto..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: SHAMP-001" {...field} />
                              </FormControl>
                              <FormDescription>
                                Deixe vazio para gerar automaticamente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="barcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de Barras</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Barcode className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input placeholder="EAN/UPC" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marca</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: L'Oréal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select
                                value={field.value || ''}
                                onValueChange={(value) => field.onChange(value || null)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Nenhuma</SelectItem>
                                  {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <TagsInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormDescription>
                              Adicione palavras-chave para facilitar a busca
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isSellable"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Para Venda</FormLabel>
                                <FormDescription className="text-xs">
                                  Produto disponível para venda aos clientes
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

                        <FormField
                          control={form.control}
                          name="isConsumable"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Consumível</FormLabel>
                                <FormDescription className="text-xs">
                                  Usado internamente durante serviços
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Precificação</CardTitle>
                      <CardDescription>
                        Configure preços de custo e venda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="costPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço de Custo</FormLabel>
                              <FormControl>
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
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Valor pago ao fornecedor
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço de Venda *</FormLabel>
                              <FormControl>
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
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Valor cobrado do cliente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <MarginCalculator
                        costPrice={watchedValues.costPrice}
                        salePrice={watchedValues.salePrice}
                        onSalePriceChange={(price) => form.setValue('salePrice', price, { shouldDirty: true })}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Stock Tab */}
                <TabsContent value="stock">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Estoque</CardTitle>
                      <CardDescription>
                        Defina os limites de estoque e unidade de medida
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade de Medida</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a unidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {UNIT_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="minStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estoque Mínimo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Alerta quando atingir este valor
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estoque Máximo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Sem limite"
                                  value={field.value || ''}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : null)
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Limite máximo de armazenamento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-medium">Estoque Inicial</p>
                            <p className="mt-1 text-amber-700 dark:text-amber-300">
                              O produto será criado com estoque zerado. Após criá-lo, você poderá 
                              adicionar uma entrada de estoque através da página de detalhes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PreviewCard
                data={watchedValues}
                categoryName={selectedCategory?.name}
              />

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="w-full"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Produto
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isCreating}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Dicas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>• Preencha o código de barras para agilizar vendas</p>
                  <p>• Use tags para facilitar buscas futuras</p>
                  <p>• Configure estoque mínimo para receber alertas</p>
                  <p>• Marque como consumível se usado em serviços</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair? 
              Todas as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
