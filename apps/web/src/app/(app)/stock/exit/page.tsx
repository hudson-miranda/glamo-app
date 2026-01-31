/**
 * GLAMO - Stock Exit Page
 * Dedicated page for stock exit operations
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
  TrendingDown,
  AlertTriangle,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import { useStockMutations } from '@/hooks/useStockMovements';
import { useProductSearch } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';

// ============================================================================
// Types & Schemas
// ============================================================================

const exitReasons = [
  { value: 'SALE', label: 'Venda' },
  { value: 'SERVICE_USE', label: 'Uso em Serviço' },
  { value: 'SUPPLIER_RETURN', label: 'Devolução a Fornecedor' },
  { value: 'DAMAGE', label: 'Avaria/Perda' },
  { value: 'EXPIRATION', label: 'Vencimento' },
  { value: 'THEFT', label: 'Furto/Roubo' },
  { value: 'OTHER', label: 'Outro' },
] as const;

const exitItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  currentStock: z.number(),
  quantity: z.coerce.number().min(1, 'Quantidade mínima é 1'),
});

const exitFormSchema = z.object({
  reason: z.enum([
    'SALE',
    'SERVICE_USE',
    'SUPPLIER_RETURN',
    'DAMAGE',
    'EXPIRATION',
    'THEFT',
    'OTHER',
  ]),
  customerId: z.string().uuid().optional().nullable(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(exitItemSchema).min(1, 'Adicione pelo menos um produto'),
}).refine(
  (data) => {
    // Check each item has enough stock
    return data.items.every((item) => item.quantity <= item.currentStock);
  },
  {
    message: 'Quantidade não pode exceder o estoque disponível',
    path: ['items'],
  }
);

type ExitFormData = z.infer<typeof exitFormSchema>;
type ExitItem = z.infer<typeof exitItemSchema>;

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
    () => results.filter((p) => !excludeIds.includes(p.id) && p.currentStock > 0),
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
              <CommandEmpty>Nenhum produto disponível.</CommandEmpty>
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
                        <p className={cn(
                          'text-sm font-medium',
                          product.currentStock <= (product.minimumStock || 5) && 'text-amber-600'
                        )}>
                          {product.currentStock}
                        </p>
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
// Exit Row Component
// ============================================================================

interface ExitRowProps {
  item: ExitItem;
  index: number;
  onUpdate: (index: number, value: number) => void;
  onRemove: (index: number) => void;
}

function ExitRow({ item, index, onUpdate, onRemove }: ExitRowProps) {
  const newStock = item.currentStock - item.quantity;
  const isInvalid = item.quantity > item.currentStock;
  const isLowStock = newStock > 0 && newStock <= 5;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isInvalid ? 'bg-red-50' : 'bg-orange-50'
          )}>
            <TrendingDown className={cn(
              'h-4 w-4',
              isInvalid ? 'text-red-600' : 'text-orange-600'
            )} />
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
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max={item.currentStock}
            value={item.quantity}
            onChange={(e) => onUpdate(index, Number(e.target.value) || 1)}
            className={cn('w-20', isInvalid && 'border-red-500')}
          />
          {isInvalid && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={cn(
          'font-medium',
          isInvalid ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-orange-600'
        )}>
          {isInvalid ? 'Inválido' : `${newStock} ${item.unit || 'un'}`}
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
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  items: ExitItem[];
}

function SummaryCard({ items }: SummaryCardProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const invalidItems = items.filter((item) => item.quantity > item.currentStock);
  const lowStockAfter = items.filter(
    (item) => item.currentStock - item.quantity > 0 && item.currentStock - item.quantity <= 5
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo da Saída</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Produtos</span>
          <span className="font-medium">{items.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantidade Total</span>
          <Badge variant="destructive">
            -{totalQuantity}
          </Badge>
        </div>

        {invalidItems.length > 0 && (
          <>
            <Separator />
            <div className="text-sm text-red-600">
              <span className="font-medium">{invalidItems.length}</span> produto(s) com quantidade inválida
            </div>
          </>
        )}

        {lowStockAfter.length > 0 && invalidItems.length === 0 && (
          <>
            <Separator />
            <div className="text-sm text-amber-600">
              <span className="font-medium">{lowStockAfter.length}</span> produto(s) ficarão com estoque baixo
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

export default function StockExitPage() {
  const router = useRouter();

  const { createBatch, isCreatingBatch } = useStockMutations();
  const { customers } = useCustomers({ limit: 100 });

  const form = useForm<ExitFormData>({
    resolver: zodResolver(exitFormSchema),
    defaultValues: {
      reason: 'SALE',
      customerId: null,
      reference: '',
      notes: '',
      items: [],
    },
  });

  const watchReason = form.watch('reason');
  const showCustomer = watchReason === 'SALE' || watchReason === 'SERVICE_USE';
  const isLoss = ['DAMAGE', 'EXPIRATION', 'THEFT'].includes(watchReason);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');

  const hasInvalidItems = watchItems.some((item) => item.quantity > item.currentStock);

  const handleAddProduct = useCallback((product: ExitItem) => {
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

  const handleUpdateQuantity = useCallback(
    (index: number, value: number) => {
      form.setValue(`items.${index}.quantity`, value);
    },
    [form]
  );

  const onSubmit = async (data: ExitFormData) => {
    // Double-check stock availability
    const insufficientStock = data.items.filter(
      (item) => item.quantity > item.currentStock
    );
    
    if (insufficientStock.length > 0) {
      toast.error('Quantidade excede o estoque disponível');
      return;
    }

    try {
      // Map reason to type (most are OUT, some are LOSS)
      const type = isLoss ? 'LOSS' : 'OUT';

      await createBatch({
        type,
        reason: data.reason,
        reference: data.reference,
        notes: data.notes,
        customerId: data.customerId || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success('Saída registrada com sucesso');
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
            <div className="p-2 rounded-lg bg-orange-100">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Saída de Estoque</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Registre vendas, uso em serviços ou baixas
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
                  <CardTitle>Motivo da Saída</CardTitle>
                  <CardDescription>
                    Selecione o tipo de saída de estoque
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
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                          >
                            {exitReasons.map((reason) => (
                              <div key={reason.value}>
                                <RadioGroupItem
                                  value={reason.value}
                                  id={reason.value}
                                  className="peer sr-only"
                                />
                                <label
                                  htmlFor={reason.value}
                                  className={cn(
                                    'flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm',
                                    'peer-data-[state=checked]:border-orange-600 [&:has([data-state=checked])]:border-orange-600'
                                  )}
                                >
                                  {reason.label}
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

              {/* Loss Warning */}
              {isLoss && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Esta operação registrará uma perda de estoque. Certifique-se de preencher 
                    as observações com detalhes sobre o ocorrido.
                  </AlertDescription>
                </Alert>
              )}

              {/* Customer Selection */}
              {showCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cliente (Opcional)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
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
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
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
                          <FormLabel>Referência</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: OS-12345" {...field} />
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
                    Adicione os produtos que estão saindo do estoque
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
                        Apenas produtos com estoque disponível são exibidos
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Estoque Atual</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Novo Estoque</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <ExitRow
                            key={field.id}
                            item={watchItems[index]}
                            index={index}
                            onUpdate={handleUpdateQuantity}
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
                    <CardTitle>
                      Observações {isLoss && <span className="text-red-600">*</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder={
                                isLoss
                                  ? 'Descreva o ocorrido em detalhes...'
                                  : 'Observações adicionais...'
                              }
                              rows={isLoss ? 4 : 2}
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
              <SummaryCard items={watchItems} />

              {fields.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        disabled={isCreatingBatch || fields.length === 0 || hasInvalidItems}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isCreatingBatch ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Confirmar Saída
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
                    {hasInvalidItems && (
                      <p className="text-xs text-red-600 text-center mt-2">
                        Corrija as quantidades inválidas para continuar
                      </p>
                    )}
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
