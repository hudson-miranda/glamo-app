/**
 * GLAMO - Stock Inventory Adjustment Page
 * Enterprise-grade inventory count and adjustment
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from 'use-debounce';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Info,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { useStockMutations } from '@/hooks/useStockMovements';
import { useProductSearch, useProducts } from '@/hooks/useProducts';

// ============================================================================
// Types & Schemas
// ============================================================================

const adjustmentItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  currentStock: z.number(),
  countedStock: z.coerce.number().min(0, 'Quantidade não pode ser negativa'),
  difference: z.number(),
});

const inventoryFormSchema = z.object({
  notes: z.string().max(1000).optional(),
  items: z.array(adjustmentItemSchema),
});

type InventoryFormData = z.infer<typeof inventoryFormSchema>;
type AdjustmentItem = z.infer<typeof adjustmentItemSchema>;

// ============================================================================
// Product Search Component
// ============================================================================

interface ProductSearchProps {
  onSelect: (product: any) => void;
  excludeIds?: string[];
}

function ProductSearch({ onSelect, excludeIds = [] }: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  const { results, isLoading } = useProductSearch(debouncedSearch);

  const filteredProducts = useMemo(
    () => results.filter((p) => !excludeIds.includes(p.id)),
    [results, excludeIds]
  );

  const handleSelect = useCallback((product: any) => {
    onSelect({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      currentStock: product.currentStock,
      countedStock: product.currentStock,
      difference: 0,
    });
    setSearch('');
    setOpen(false);
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start"
        >
          <Search className="mr-2 h-4 w-4" />
          Adicionar produto...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite o nome ou SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && debouncedSearch.length >= 2 && filteredProducts.length === 0 && (
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            )}
            {!isLoading && filteredProducts.length > 0 && (
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.currentStock}</p>
                        <p className="text-xs text-muted-foreground">{product.unit || 'un'}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  items: AdjustmentItem[];
}

function SummaryCard({ items }: SummaryCardProps) {
  const itemsWithDifference = items.filter((item) => item.difference !== 0);
  const positiveItems = items.filter((item) => item.difference > 0);
  const negativeItems = items.filter((item) => item.difference < 0);
  const totalPositive = positiveItems.reduce((sum, item) => sum + item.difference, 0);
  const totalNegative = negativeItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo da Contagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Itens contados</span>
            <span className="font-medium">{items.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Com divergência</span>
            <span className={cn(
              'font-medium',
              itemsWithDifference.length > 0 ? 'text-amber-600' : 'text-green-600'
            )}>
              {itemsWithDifference.length}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ajustes positivos</span>
            <span className="text-green-600 font-medium">
              +{totalPositive}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ajustes negativos</span>
            <span className="text-red-600 font-medium">
              -{totalNegative}
            </span>
          </div>
        </div>

        {itemsWithDifference.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Divergências:</p>
              {itemsWithDifference.slice(0, 5).map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{item.productName}</span>
                  <Badge
                    variant={item.difference > 0 ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {item.difference > 0 ? '+' : ''}{item.difference}
                  </Badge>
                </div>
              ))}
              {itemsWithDifference.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{itemsWithDifference.length - 5} mais...
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Adjustment Row Component
// ============================================================================

interface AdjustmentRowProps {
  item: AdjustmentItem;
  index: number;
  onUpdate: (index: number, value: number) => void;
  onRemove: (index: number) => void;
}

function AdjustmentRow({ item, index, onUpdate, onRemove }: AdjustmentRowProps) {
  const hasDifference = item.difference !== 0;
  const differenceClass = item.difference > 0 
    ? 'text-green-600' 
    : item.difference < 0 
    ? 'text-red-600' 
    : 'text-muted-foreground';

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            hasDifference ? 'bg-amber-50' : 'bg-green-50'
          )}>
            {hasDifference ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
          <div>
            <p className="font-medium">{item.productName}</p>
            {item.sku && (
              <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {item.currentStock} {item.unit || 'un'}
        </span>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          value={item.countedStock}
          onChange={(e) => onUpdate(index, Number(e.target.value) || 0)}
          className="w-24"
        />
      </TableCell>
      <TableCell>
        <span className={cn('font-medium', differenceClass)}>
          {item.difference > 0 ? '+' : ''}{item.difference}
        </span>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Load All Products Component
// ============================================================================

interface LoadAllProductsProps {
  onLoad: (products: AdjustmentItem[]) => void;
  isLoading: boolean;
}

function LoadAllProducts({ onLoad, isLoading }: LoadAllProductsProps) {
  const { products } = useProducts({ limit: 1000 });

  const handleLoadAll = useCallback(() => {
    const items = products.map((product) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku || undefined,
      unit: product.unit || undefined,
      currentStock: product.currentStock,
      countedStock: product.currentStock,
      difference: 0,
    }));
    onLoad(items);
    toast.success(`${items.length} produtos carregados`);
  }, [products, onLoad]);

  return (
    <Button
      variant="outline"
      onClick={handleLoadAll}
      disabled={isLoading || products.length === 0}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Carregar Todos os Produtos ({products.length})
    </Button>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function InventoryAdjustmentPage() {
  const router = useRouter();
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const { adjust, isAdjusting } = useStockMutations();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');

  const handleAddProduct = useCallback((product: AdjustmentItem) => {
    const exists = fields.some((f) => f.productId === product.productId);
    if (exists) {
      toast.error('Produto já adicionado');
      return;
    }
    append(product);
  }, [fields, append]);

  const handleRemoveProduct = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const handleUpdateCount = useCallback((index: number, value: number) => {
    const currentItem = form.getValues(`items.${index}`);
    const difference = value - currentItem.currentStock;
    form.setValue(`items.${index}.countedStock`, value);
    form.setValue(`items.${index}.difference`, difference);
  }, [form]);

  const handleLoadAll = useCallback((items: AdjustmentItem[]) => {
    setIsLoadingAll(true);
    replace(items);
    setIsLoadingAll(false);
  }, [replace]);

  const handleReset = useCallback(() => {
    replace([]);
    form.setValue('notes', '');
  }, [replace, form]);

  const onSubmit = async (data: InventoryFormData) => {
    const itemsWithDifference = data.items.filter((item) => item.difference !== 0);

    if (itemsWithDifference.length === 0) {
      toast.info('Nenhuma divergência encontrada. Nada a ajustar.');
      return;
    }

    try {
      // Process each adjustment
      for (const item of itemsWithDifference) {
        await adjust({
          productId: item.productId,
          newQuantity: item.countedStock,
          notes: data.notes || `Contagem de inventário: ${item.currentStock} → ${item.countedStock}`,
        });
      }

      toast.success(`${itemsWithDifference.length} ajustes realizados com sucesso`);
      router.push('/stock');
    } catch (error) {
      // Error handled by hook
    }
  };

  const excludeProductIds = fields.map((f) => f.productId);
  const hasChanges = watchItems.some((item) => item.difference !== 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contagem de Inventário</h1>
          <p className="text-muted-foreground">
            Faça a contagem física e ajuste as divergências
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Produtos</CardTitle>
                      <CardDescription>
                        Adicione os produtos para contagem
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {fields.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                        >
                          <RotateCcw className="mr-2 h-3 w-3" />
                          Limpar
                        </Button>
                      )}
                      <LoadAllProducts onLoad={handleLoadAll} isLoading={isLoadingAll} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProductSearch
                    onSelect={handleAddProduct}
                    excludeIds={excludeProductIds}
                  />

                  {fields.length === 0 ? (
                    <div className="border rounded-lg border-dashed py-8 text-center">
                      <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum produto para contagem
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Adicione produtos individuais ou carregue todos
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Estoque Sistema</TableHead>
                          <TableHead>Contagem</TableHead>
                          <TableHead>Diferença</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <AdjustmentRow
                            key={field.id}
                            item={watchItems[index]}
                            index={index}
                            onUpdate={handleUpdateCount}
                            onRemove={handleRemoveProduct}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Observações sobre a contagem..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Informações sobre a contagem (data, responsável, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SummaryCard items={watchItems} />

              {fields.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        disabled={isAdjusting || !hasChanges}
                        className="w-full"
                      >
                        {isAdjusting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Aplicar Ajustes
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/stock')}
                        disabled={isAdjusting}
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                    {!hasChanges && fields.length > 0 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Altere as quantidades contadas para habilitar
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Como funciona</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>1. Adicione os produtos ou carregue todos</p>
                  <p>2. Informe a quantidade física contada</p>
                  <p>3. O sistema calcula a diferença automaticamente</p>
                  <p>4. Aplique os ajustes para corrigir o estoque</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
