/**
 * GLAMO - Stock Entry Page
 * Dedicated page for stock entry operations
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
  Plus,
  TrendingUp,
  FileText,
  DollarSign,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { useStockMutations } from '@/hooks/useStockMovements';
import { useProductSearch } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';

// ============================================================================
// Types & Schemas
// ============================================================================

const entryReasons = [
  { value: 'PURCHASE', label: 'Compra de Fornecedor' },
  { value: 'CUSTOMER_RETURN', label: 'Devolução de Cliente' },
  { value: 'OPENING_BALANCE', label: 'Saldo Inicial' },
  { value: 'OTHER', label: 'Outro' },
] as const;

const entryItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  currentStock: z.number(),
  quantity: z.coerce.number().min(1, 'Quantidade mínima é 1'),
  unitCost: z.coerce.number().min(0, 'Custo não pode ser negativo').optional(),
});

const entryFormSchema = z.object({
  reason: z.enum(['PURCHASE', 'CUSTOMER_RETURN', 'OPENING_BALANCE', 'OTHER']),
  supplierId: z.string().uuid().optional().nullable(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(entryItemSchema).min(1, 'Adicione pelo menos um produto'),
});

type EntryFormData = z.infer<typeof entryFormSchema>;
type EntryItem = z.infer<typeof entryItemSchema>;

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
      quantity: 1,
      unitCost: product.cost || 0,
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
// Entry Row Component
// ============================================================================

interface EntryRowProps {
  item: EntryItem;
  index: number;
  showCost: boolean;
  onUpdate: (index: number, field: 'quantity' | 'unitCost', value: number) => void;
  onRemove: (index: number) => void;
}

function EntryRow({ item, index, showCost, onUpdate, onRemove }: EntryRowProps) {
  const newStock = item.currentStock + item.quantity;
  const totalCost = (item.unitCost || 0) * item.quantity;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
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
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value) || 1)}
          className="w-20"
        />
      </TableCell>
      {showCost && (
        <TableCell>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitCost || ''}
            onChange={(e) => onUpdate(index, 'unitCost', Number(e.target.value) || 0)}
            className="w-24"
            placeholder="0,00"
          />
        </TableCell>
      )}
      <TableCell>
        <span className="font-medium text-green-600">
          {newStock} {item.unit || 'un'}
        </span>
      </TableCell>
      {showCost && (
        <TableCell>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalCost)}
          </span>
        </TableCell>
      )}
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
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  items: EntryItem[];
  showCost: boolean;
}

function SummaryCard({ items, showCost }: SummaryCardProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce(
    (sum, item) => sum + (item.unitCost || 0) * item.quantity,
    0
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo da Entrada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Produtos</span>
          <span className="font-medium">{items.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantidade Total</span>
          <Badge variant="default" className="bg-green-600">
            +{totalQuantity}
          </Badge>
        </div>
        {showCost && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custo Total</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalCost)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function StockEntryPage() {
  const router = useRouter();

  const { createBatch, isCreatingBatch } = useStockMutations();
  const { suppliers } = useSuppliers({ limit: 100 });

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      reason: 'PURCHASE',
      supplierId: null,
      reference: '',
      notes: '',
      items: [],
    },
  });

  const watchReason = form.watch('reason');
  const showSupplier = watchReason === 'PURCHASE';
  const showCost = watchReason === 'PURCHASE';

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');

  const handleAddProduct = useCallback((product: EntryItem) => {
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

  const handleUpdateItem = useCallback(
    (index: number, field: 'quantity' | 'unitCost', value: number) => {
      form.setValue(`items.${index}.${field}`, value);
    },
    [form]
  );

  const onSubmit = async (data: EntryFormData) => {
    try {
      await createBatch({
        type: 'IN',
        reason: data.reason,
        reference: data.reference,
        notes: data.notes,
        supplierId: data.supplierId || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });

      toast.success('Entrada registrada com sucesso');
      router.push('/stock');
    } catch (error) {
      // Error handled by hook
    }
  };

  const excludeProductIds = fields.map((f) => f.productId);

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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Entrada de Estoque</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Registre produtos recebidos
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reason Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Motivo da Entrada</CardTitle>
                  <CardDescription>
                    Selecione o tipo de entrada de estoque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            {entryReasons.map((reason) => (
                              <div key={reason.value}>
                                <RadioGroupItem
                                  value={reason.value}
                                  id={reason.value}
                                  className="peer sr-only"
                                />
                                <label
                                  htmlFor={reason.value}
                                  className={cn(
                                    'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                    'peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600'
                                  )}
                                >
                                  <span className="text-sm font-medium">{reason.label}</span>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Details */}
              {showSupplier && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº Nota Fiscal</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: NF-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>
                    Adicione os produtos que estão entrando no estoque
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProductSearch
                    onSelect={handleAddProduct}
                    excludeIds={excludeProductIds}
                  />

                  {fields.length === 0 ? (
                    <div className="border rounded-lg border-dashed py-8 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum produto adicionado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pesquise e adicione produtos acima
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Estoque Atual</TableHead>
                          <TableHead>Quantidade</TableHead>
                          {showCost && <TableHead>Custo Unit.</TableHead>}
                          <TableHead>Novo Estoque</TableHead>
                          {showCost && <TableHead>Total</TableHead>}
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <EntryRow
                            key={field.id}
                            item={watchItems[index]}
                            index={index}
                            showCost={showCost}
                            onUpdate={handleUpdateItem}
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
                              placeholder="Observações adicionais..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
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
              <SummaryCard items={watchItems} showCost={showCost} />

              {fields.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        disabled={isCreatingBatch || fields.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingBatch ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Confirmar Entrada
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/stock')}
                        disabled={isCreatingBatch}
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
