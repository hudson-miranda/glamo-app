/**
 * GLAMO - Edit Supplier Page
 * Enterprise-grade supplier editing form
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  CreditCard,
  FileText,
  Smartphone,
  AlertCircle,
  Info,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

import { useSupplier } from '@/hooks/useSuppliers';

// ============================================================================
// Form Schema
// ============================================================================

const supplierFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  tradeName: z.string().max(100).optional(),
  document: z.string().max(20).optional(),
  documentType: z.enum(['CPF', 'CNPJ']).optional().nullable(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  street: z.string().max(200).optional(),
  number: z.string().max(20).optional(),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  bankName: z.string().max(100).optional(),
  bankCode: z.string().max(10).optional(),
  agency: z.string().max(20).optional(),
  accountNumber: z.string().max(30).optional(),
  accountType: z.enum(['checking', 'savings']).optional(),
  pixKey: z.string().max(100).optional(),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
  paymentTerms: z.string().max(500).optional(),
  deliveryTime: z.coerce.number().int().min(0).optional(),
  minimumOrder: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

// ============================================================================
// Constants
// ============================================================================

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
];

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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
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
// Preview Card Component
// ============================================================================

interface PreviewCardProps {
  data: Partial<SupplierFormData>;
}

function PreviewCard({ data }: PreviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Prévia do Fornecedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {data.name || 'Nome do Fornecedor'}
            </p>
            {data.tradeName && (
              <p className="text-sm text-muted-foreground truncate">
                {data.tradeName}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          {data.document && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{data.documentType || 'DOC'}: {data.document}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{data.phone}</span>
            </div>
          )}
        </div>

        {(data.city || data.state) && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[data.city, data.state].filter(Boolean).join(' - ')}
              </span>
            </div>
          </>
        )}

        {data.tags && data.tags.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    supplier,
    isLoading,
    isError,
    update,
    delete: deleteSupplier,
    isUpdating,
    isDeleting,
  } = useSupplier(supplierId);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      tradeName: '',
      document: '',
      documentType: null,
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      bankName: '',
      bankCode: '',
      agency: '',
      accountNumber: '',
      accountType: undefined,
      pixKey: '',
      pixKeyType: undefined,
      paymentTerms: '',
      deliveryTime: undefined,
      minimumOrder: undefined,
      tags: [],
    },
  });

  // Load supplier data into form
  useEffect(() => {
    if (supplier) {
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
        accountType?: 'checking' | 'savings';
        pixKey?: string;
        pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
      } | null;

      form.reset({
        name: supplier.name,
        tradeName: supplier.tradeName || '',
        document: supplier.document || '',
        documentType: supplier.documentType || null,
        email: supplier.email || '',
        phone: supplier.phone || '',
        whatsapp: supplier.whatsapp || '',
        website: supplier.website || '',
        street: address?.street || '',
        number: address?.number || '',
        complement: address?.complement || '',
        neighborhood: address?.neighborhood || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        contactName: supplier.contactName || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        notes: supplier.notes || '',
        bankName: bankInfo?.bankName || '',
        bankCode: bankInfo?.bankCode || '',
        agency: bankInfo?.agency || '',
        accountNumber: bankInfo?.accountNumber || '',
        accountType: bankInfo?.accountType || undefined,
        pixKey: bankInfo?.pixKey || '',
        pixKeyType: bankInfo?.pixKeyType || undefined,
        paymentTerms: supplier.paymentTerms || '',
        deliveryTime: supplier.deliveryTime || undefined,
        minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : undefined,
        tags: (supplier.tags as string[]) || [],
      });
    }
  }, [supplier, form]);

  const watchedValues = form.watch();

  // Track changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      const supplierData = {
        name: data.name,
        tradeName: data.tradeName || null,
        document: data.document || null,
        documentType: data.documentType || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        address: (data.street || data.city || data.state) ? {
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: 'BR',
        } : null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
        bankInfo: (data.bankName || data.pixKey) ? {
          bankName: data.bankName,
          bankCode: data.bankCode,
          agency: data.agency,
          accountNumber: data.accountNumber,
          accountType: data.accountType,
          pixKey: data.pixKey,
          pixKeyType: data.pixKeyType,
        } : null,
        paymentTerms: data.paymentTerms || null,
        deliveryTime: data.deliveryTime || null,
        minimumOrder: data.minimumOrder || null,
        tags: data.tags,
      };

      await update(supplierData);
      setHasUnsavedChanges(false);
      router.push(`/suppliers/${supplierId}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      router.push(`/suppliers/${supplierId}`);
    }
  }, [hasUnsavedChanges, supplierId, router]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    router.push(`/suppliers/${supplierId}`);
  }, [supplierId, router]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteSupplier();
      router.push('/suppliers');
    } catch {
      // Error handled by hook
    }
  }, [deleteSupplier, router]);

  const handleReset = useCallback(() => {
    if (supplier) {
      const address = supplier.address as any;
      const bankInfo = supplier.bankInfo as any;

      form.reset({
        name: supplier.name,
        tradeName: supplier.tradeName || '',
        document: supplier.document || '',
        documentType: supplier.documentType || null,
        email: supplier.email || '',
        phone: supplier.phone || '',
        whatsapp: supplier.whatsapp || '',
        website: supplier.website || '',
        street: address?.street || '',
        number: address?.number || '',
        complement: address?.complement || '',
        neighborhood: address?.neighborhood || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        contactName: supplier.contactName || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        notes: supplier.notes || '',
        bankName: bankInfo?.bankName || '',
        bankCode: bankInfo?.bankCode || '',
        agency: bankInfo?.agency || '',
        accountNumber: bankInfo?.accountNumber || '',
        accountType: bankInfo?.accountType || undefined,
        pixKey: bankInfo?.pixKey || '',
        pixKeyType: bankInfo?.pixKeyType || undefined,
        paymentTerms: supplier.paymentTerms || '',
        deliveryTime: supplier.deliveryTime || undefined,
        minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : undefined,
        tags: (supplier.tags as string[]) || [],
      });
      setHasUnsavedChanges(false);
      toast.info('Alterações descartadas');
    }
  }, [supplier, form]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !supplier) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Fornecedor</h1>
            <p className="text-muted-foreground">{supplier.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <>
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Alterações não salvas
              </Badge>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isUpdating}>
            {isUpdating ? (
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
            <div className="lg:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">
                    <Building2 className="mr-2 h-4 w-4" />
                    Dados
                  </TabsTrigger>
                  <TabsTrigger value="address">
                    <MapPin className="mr-2 h-4 w-4" />
                    Endereço
                  </TabsTrigger>
                  <TabsTrigger value="contact">
                    <User className="mr-2 h-4 w-4" />
                    Contato
                  </TabsTrigger>
                  <TabsTrigger value="financial">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Financeiro
                  </TabsTrigger>
                </TabsList>

                {/* Basic Tab */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                      <CardDescription>
                        Dados de identificação do fornecedor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razão Social *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome oficial da empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tradeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Fantasia</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome comercial" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select
                                value={field.value || ''}
                                onValueChange={(value) => field.onChange(value || null)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CPF">CPF</SelectItem>
                                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Documento</FormLabel>
                                <FormControl>
                                  <Input placeholder="CPF ou CNPJ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input type="email" placeholder="email@empresa.com" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input placeholder="(00) 0000-0000" className="pl-8" {...field} />
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
                          name="whatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Smartphone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input placeholder="(00) 00000-0000" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Globe className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input placeholder="https://site.com" className="pl-8" {...field} />
                                </div>
                              </FormControl>
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
                              Categorize o fornecedor para facilitar a busca
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Anotações sobre o fornecedor..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address">
                  <Card>
                    <CardHeader>
                      <CardTitle>Endereço</CardTitle>
                      <CardDescription>
                        Localização do fornecedor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logradouro</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua, Avenida, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input placeholder="Sala, andar, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do bairro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da cidade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="UF" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BRAZILIAN_STATES.map((state) => (
                                    <SelectItem key={state.value} value={state.value}>
                                      {state.value} - {state.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contato Principal</CardTitle>
                      <CardDescription>
                        Pessoa de contato no fornecedor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Contato</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Nome completo" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail do Contato</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input type="email" placeholder="contato@empresa.com" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone do Contato</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input placeholder="(00) 00000-0000" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Dados Bancários</CardTitle>
                        <CardDescription>
                          Informações para pagamento
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Banco</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome do banco" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bankCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: 001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="agency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Agência</FormLabel>
                                <FormControl>
                                  <Input placeholder="0000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conta</FormLabel>
                                <FormControl>
                                  <Input placeholder="00000-0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="accountType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="checking">Corrente</SelectItem>
                                    <SelectItem value="savings">Poupança</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="pixKeyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Chave PIX</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Tipo da chave" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {PIX_KEY_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
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
                            name="pixKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chave PIX</FormLabel>
                                <FormControl>
                                  <Input placeholder="Chave PIX" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Condições Comerciais</CardTitle>
                        <CardDescription>
                          Termos de pagamento e entrega
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condições de Pagamento</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: 30/60/90 dias, boleto, cartão..."
                                  rows={2}
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
                            name="deliveryTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prazo de Entrega (dias)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="minimumOrder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pedido Mínimo (R$)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Danger Zone */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>
                    Ações irreversíveis para este fornecedor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Excluir fornecedor</p>
                      <p className="text-sm text-muted-foreground">
                        O fornecedor será removido permanentemente
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PreviewCard data={watchedValues} />

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
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
                  <p>• Mantenha os dados bancários atualizados</p>
                  <p>• Use tags para facilitar buscas</p>
                  <p>• Configure condições comerciais para referência</p>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{supplier.name}"? 
              Fornecedores com produtos vinculados não podem ser excluídos.
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
