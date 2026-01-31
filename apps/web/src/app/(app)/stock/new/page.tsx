/**
 * GLAMO - New Stock Movement Page
 * Enterprise-grade stock movement creation form
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowDown,
  ArrowUp,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  X,
  Check,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { useStockMutations } from '@/hooks/useStockMovements';
import { useProductSearch } from '@/hooks/useProducts';
import {
  getMovementTypeLabel,
  getMovementReasonLabel,
  type StockMovementType,
  type StockMovementReason,
} from '@/lib/services/stockMovementService';

// ============================================================================
// Types & Schemas
// ============================================================================

const movementItemSchema = z.object({
  productId: z.string().uuid('Selecione um produto'),
  productName: z.string(),
  currentStock: z.number(),
  unit: z.string().optional(),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unitCost: z.coerce.number().min(0).optional(),
});

const movementFormSchema = z.object({
  movementMode: z.enum(['single', 'batch']),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'LOSS', 'PRODUCTION']),
  reason: z.enum([
    'PURCHASE', 'SALE', 'SERVICE_USE', 'INVENTORY_COUNT',
    'DAMAGE', 'EXPIRATION', 'THEFT', 'CUSTOMER_RETURN',
    'SUPPLIER_RETURN', 'INTERNAL_TRANSFER', 'OPENING_BALANCE', 'OTHER'
  ]),
  notes: z.string().max(1000).optional(),
  items: z.array(movementItemSchema).min(1, 'Adicione pelo menos um produto'),
});

type MovementFormData = z.infer<typeof movementFormSchema>;

// ============================================================================
// Constants
// ============================================================================

const MOVEMENT_TYPES: { value: StockMovementType; label: string; icon: any; color: string }[] = [
  { value: 'IN', label: 'Entrada', icon: ArrowDown, color: 'text-green-600' },
  { value: 'OUT', label: 'Saída', icon: ArrowUp, color: 'text-red-600' },
  { value: 'ADJUSTMENT', label: 'Ajuste', icon: Settings, color: 'text-blue-600' },
  { value: 'LOSS', label: 'Perda', icon: AlertTriangle, color: 'text-amber-600' },
];

const REASON_OPTIONS: Record<StockMovementType, { value: StockMovementReason; label: string }[]> = {
  IN: [
    { value: 'PURCHASE', label: 'Compra de fornecedor' },
    { value: 'CUSTOMER_RETURN', label: 'Devolução de cliente' },
    { value: 'OPENING_BALANCE', label: 'Saldo inicial' },
    { value: 'OTHER', label: 'Outro' },
  ],
  OUT: [
    { value: 'SALE', label: 'Venda' },
    { value: 'SERVICE_USE', label: 'Uso em serviço' },
    { value: 'SUPPLIER_RETURN', label: 'Devolução ao fornecedor' },
    { value: 'OTHER', label: 'Outro' },
  ],
  ADJUSTMENT: [
    { value: 'INVENTORY_COUNT', label: 'Contagem de inventário' },
    { value: 'OTHER', label: 'Outro' },
  ],
  LOSS: [
    { value: 'DAMAGE', label: 'Avaria' },
    { value: 'EXPIRATION', label: 'Vencimento' },
    { value: 'THEFT', label: 'Furto' },
    { value: 'OTHER', label: 'Outro' },
  ],
  TRANSFER: [
    { value: 'INTERNAL_TRANSFER', label: 'Transferência interna' },
  ],
  RETURN: [
    { value: 'CUSTOMER_RETURN', label: 'Devolução de cliente' },
    { value: 'SUPPLIER_RETURN', label: 'Devolução ao fornecedor' },
  ],
  PRODUCTION: [
    { value: 'OTHER', label: 'Produção' },
  ],
};

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
      currentStock: product.currentStock,
      unit: product.unit,
      quantity: 1,
      unitCost: product.costPrice ? Number(product.costPrice) : undefined,
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
          Buscar produto...
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
  type: StockMovementType;
  items: { productName: string; quantity: number; unitCost?: number }[];
}

function SummaryCard({ type, items }: SummaryCardProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unitCost || 0));
  }, 0);

  const isIncoming = ['IN', 'PRODUCTION'].includes(type);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <Badge variant={isIncoming ? 'default' : 'destructive'}>
            {getMovementTypeLabel(type)}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Itens</span>
            <span className="font-medium">{items.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quantidade Total</span>
            <span className={cn('font-medium', isIncoming ? 'text-green-600' : 'text-red-600')}>
              {isIncoming ? '+' : '-'}{totalQuantity}
            </span>
          </div>
          {totalValue > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="font-medium">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Produtos:</p>
              {items.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{item.productName}</span>
                  <Badge variant="outline" className="ml-2">
                    {item.quantity}
                  </Badge>
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{items.length - 5} mais...
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
// Main Page Component
// ============================================================================

export default function NewStockMovementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as StockMovementType) || 'IN';

  const { create, createBatch, isLoading } = useStockMutations();

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movementMode: 'single',
      type: initialType,
      reason: REASON_OPTIONS[initialType]?.[0]?.value || 'OTHER',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchType = form.watch('type');
  const watchItems = form.watch('items');
  const watchMode = form.watch('movementMode');

  // Update reason options when type changes
  useEffect(() => {
    const reasons = REASON_OPTIONS[watchType];
    if (reasons && reasons.length > 0) {
      form.setValue('reason', reasons[0].value);
    }
  }, [watchType, form]);

  const handleAddProduct = useCallback((product: any) => {
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

  const onSubmit = async (data: MovementFormData) => {
    try {
      if (data.items.length === 1) {
        await create({
          productId: data.items[0].productId,
          type: data.type,
          reason: data.reason,
          quantity: data.items[0].quantity,
          unitCost: data.items[0].unitCost,
          notes: data.notes,
        });
      } else {
        await createBatch({
          type: data.type,
          reason: data.reason,
          notes: data.notes,
          items: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        });
      }
      router.push('/stock');
    } catch (error) {
      // Error handled by hook
    }
  };

  const currentReasons = REASON_OPTIONS[watchType] || [];
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
          <h1 className="text-2xl font-bold tracking-tight">Nova Movimentação</h1>
          <p className="text-muted-foreground">
            Registre entradas, saídas ou ajustes de estoque
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Movement Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Movimentação</CardTitle>
                  <CardDescription>
                    Selecione o tipo e motivo da movimentação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                          >
                            {MOVEMENT_TYPES.map((type) => (
                              <div key={type.value}>
                                <RadioGroupItem
                                  value={type.value}
                                  id={type.value}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={type.value}
                                  className={cn(
                                    'flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                    'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                                  )}
                                >
                                  <type.icon className={cn('mb-2 h-6 w-6', type.color)} />
                                  <span className="text-sm font-medium">{type.label}</span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currentReasons.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Produtos</CardTitle>
                      <CardDescription>
                        Adicione os produtos da movimentação
                      </CardDescription>
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
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum produto adicionado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Use a busca acima para adicionar produtos
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Estoque Atual</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Custo Unit.</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{field.productName}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {field.currentStock} {field.unit || 'un'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field: qtyField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        className="w-24"
                                        {...qtyField}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitCost`}
                                render={({ field: costField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        className="w-28"
                                        {...costField}
                                        value={costField.value || ''}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProduct(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {form.formState.errors.items && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.items.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
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
                            placeholder="Observações sobre a movimentação..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais como número de nota, lote, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SummaryCard type={watchType} items={watchItems} />

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading || fields.length === 0}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Registrar Movimentação
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/stock')}
                      disabled={isLoading}
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
                  <p>• Entradas aumentam o estoque</p>
                  <p>• Saídas diminuem o estoque</p>
                  <p>• Ajustes corrigem divergências</p>
                  <p>• Informe o custo para controle financeiro</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
