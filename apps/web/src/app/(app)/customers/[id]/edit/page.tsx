/**
 * GLAMO - Edit Customer Page
 * Enterprise customer editing form
 * 
 * @version 2.0.0
 * @description Full-featured customer edit with EntityForm integration
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';
import { useUnsavedChangesConfirm } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DynamicFieldRenderer, getAnamnesisDefaults } from '@/components/ui/DynamicFieldRenderer';
import { 
  Button,
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';
import { 
  Users, 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Tag,
  Calendar,
  Heart,
  Loader2,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import type { BusinessSegment, CustomerGender, Customer } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEGMENTS: { value: BusinessSegment; label: string }[] = [
  { value: 'BELEZA', label: 'Beleza' },
  { value: 'ESTETICA', label: 'Estética' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'BEM_ESTAR', label: 'Bem-estar' },
  { value: 'TATUAGEM_PIERCING', label: 'Tatuagem & Piercing' },
  { value: 'PET', label: 'Pet' },
  { value: 'SERVICOS_GERAIS', label: 'Serviços Gerais' },
];

const GENDER_OPTIONS: { value: CustomerGender; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FormField({
  label,
  name,
  required,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-pink-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function TagsInput({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onAdd(input.trim());
      }
      setInput('');
    }
  };

  const suggestedTags = ['VIP', 'Fidelidade', 'Premium', 'Novo', 'Corporativo', 'Indicação'];
  const availableSuggestions = suggestedTags.filter(t => !tags.includes(t));

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 rounded-lg text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-pink-700 dark:hover:text-pink-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma tag e pressione Enter..."
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border text-sm',
          'bg-white dark:bg-gray-800',
          'border-gray-200 dark:border-gray-700',
          'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
          'focus:outline-none transition-all duration-300'
        )}
      />

      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Sugestões:</span>
          {availableSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onAdd(tag)}
              className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentSelector({
  value,
  onChange,
}: {
  value: BusinessSegment | null;
  onChange: (segment: BusinessSegment | null) => void;
}) {
  return (
    <AnimatedCard>
      <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="w-4 h-4 text-pink-500" />
            Segmento do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Selecione o segmento para exibir campos de anamnese específicos
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEGMENTS.map((segment) => (
              <button
                key={segment.value}
                type="button"
                onClick={() => onChange(value === segment.value ? null : segment.value)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                  value === segment.value
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-[0_2px_8px_rgba(236,72,153,0.25)]'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {segment.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

function StatusToggle({
  status,
  onChange,
}: {
  status: 'ACTIVE' | 'INACTIVE';
  onChange: (status: 'ACTIVE' | 'INACTIVE') => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className={cn(
        'w-12 h-6 rounded-full relative cursor-pointer transition-colors',
        status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
      )}
        onClick={() => onChange(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
      >
        <div className={cn(
          'w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform',
          status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-0.5'
        )} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {status === 'ACTIVE' ? 'Cliente Ativo' : 'Cliente Inativo'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {status === 'ACTIVE' 
            ? 'O cliente pode fazer agendamentos' 
            : 'O cliente está desativado'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function EditCustomerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-48" />
      <SkeletonCard className="h-32" />
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toast } = useToast();

  // Fetch customer data
  const { customer, isLoading, error, updateCustomer, isUpdating } = useCustomer(customerId);

  // Unsaved changes dialog
  const { dialog, closeDialog, confirmDiscard } = useUnsavedChangesConfirm();

  // Track if form has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    gender: '' as CustomerGender | '',
    birthDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    address: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
    notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [segment, setSegment] = useState<BusinessSegment | null>(null);
  const [anamnesisData, setAnamnesisData] = useState<Record<string, unknown>>({});
  const [showAddress, setShowAddress] = useState(false);

  // Initialize form data when customer loads
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        gender: customer.gender || '',
        birthDate: customer.birthDate 
          ? new Date(customer.birthDate).toISOString().split('T')[0] 
          : '',
        status: customer.status || 'ACTIVE',
        address: customer.address || {
          zipCode: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
        notes: customer.notes || '',
      });
      setTags(customer.tags || []);
      
      if (customer.anamnesis) {
        setSegment(customer.anamnesis.segment as BusinessSegment || null);
        setAnamnesisData(customer.anamnesis.data || {});
      }

      // Show address section if customer has address
      if (customer.address && Object.values(customer.address).some(v => v)) {
        setShowAddress(true);
      }
    }
  }, [customer]);

  // Handle input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setIsDirty(true);
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  // Handle tag management
  const handleTagAdd = useCallback((tag: string) => {
    setTags(prev => [...prev, tag]);
    setIsDirty(true);
  }, []);

  const handleTagRemove = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
    setIsDirty(true);
  }, []);

  // Handle segment change
  const handleSegmentChange = useCallback((newSegment: BusinessSegment | null) => {
    setSegment(newSegment);
    setIsDirty(true);
    if (newSegment && !anamnesisData) {
      setAnamnesisData(getAnamnesisDefaults(newSegment));
    }
  }, [anamnesisData]);

  // Handle anamnesis change
  const handleAnamnesisChange = useCallback((data: Record<string, unknown>) => {
    setAnamnesisData(data);
    setIsDirty(true);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((status: 'ACTIVE' | 'INACTIVE') => {
    setFormData(prev => ({ ...prev, status }));
    setIsDirty(true);
  }, []);

  // Handle back navigation with unsaved changes check
  const handleBack = useCallback(async () => {
    if (isDirty) {
      const confirmed = await confirmDiscard();
      if (!confirmed) return;
    }
    router.push(`/customers/${customerId}`);
  }, [isDirty, confirmDiscard, router, customerId]);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do cliente.',
        variant: 'error',
      });
      return;
    }

    try {
      await updateCustomer({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        document: formData.document.trim() || undefined,
        gender: formData.gender || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        status: formData.status,
        address: Object.values(formData.address).some(v => v) ? formData.address : undefined,
        tags,
        notes: formData.notes.trim() || undefined,
        anamnesis: segment ? { segment, data: anamnesisData } : undefined,
      });
      
      setIsDirty(false);
      
      toast({
        title: 'Cliente atualizado!',
        description: `${formData.name} foi atualizado com sucesso.`,
        variant: 'success',
      });

      router.push(`/customers/${customerId}`);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'error',
      });
    }
  }, [formData, tags, segment, anamnesisData, updateCustomer, toast, router, customerId]);

  const inputClassName = cn(
    'w-full px-4 py-3 rounded-xl border text-sm',
    'bg-white dark:bg-gray-800',
    'border-gray-200 dark:border-gray-700',
    'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
    'focus:outline-none transition-all duration-300'
  );

  const inputWithIconClassName = cn(inputClassName, 'pl-10');

  // Loading state
  if (isLoading) {
    return <EditCustomerSkeleton />;
  }

  // Error state
  if (error || !customer) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <AlertCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Cliente não encontrado
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          O cliente que você está tentando editar não existe ou foi removido.
        </p>
        <Link href="/customers">
          <Button className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button onClick={handleBack}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3" style={{ letterSpacing: '-0.02em' }}>
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/30">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
              Editar Cliente
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {customer.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-amber-500 flex items-center gap-1 mr-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Alterações não salvas
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || isUpdating}
            className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <StatusToggle status={formData.status} onChange={handleStatusChange} />
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-pink-500" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Nome Completo" name="name" required icon={User}>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: Maria Silva Santos"
                        className={inputWithIconClassName}
                        required
                      />
                    </FormField>
                  </div>

                  <FormField label="Email" name="email" icon={Mail}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@exemplo.com"
                      className={inputWithIconClassName}
                    />
                  </FormField>

                  <FormField label="Telefone" name="phone" icon={Phone}>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      className={inputWithIconClassName}
                    />
                  </FormField>

                  <FormField label="CPF/CNPJ" name="document">
                    <input
                      id="document"
                      name="document"
                      type="text"
                      value={formData.document}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField label="Data de Nascimento" name="birthDate" icon={Calendar}>
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={inputWithIconClassName}
                    />
                  </FormField>

                  <FormField label="Gênero" name="gender">
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputClassName}
                    >
                      <option value="">Selecione...</option>
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <button
                  type="button"
                  onClick={() => setShowAddress(!showAddress)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    Endereço
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {showAddress ? '−' : '+'}
                  </span>
                </button>
              </CardHeader>
              {showAddress && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="CEP" name="address.zipCode">
                      <input
                        id="address.zipCode"
                        name="address.zipCode"
                        type="text"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        placeholder="00000-000"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Rua" name="address.street">
                      <input
                        id="address.street"
                        name="address.street"
                        type="text"
                        value={formData.address.street}
                        onChange={handleChange}
                        placeholder="Nome da rua"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Número" name="address.number">
                      <input
                        id="address.number"
                        name="address.number"
                        type="text"
                        value={formData.address.number}
                        onChange={handleChange}
                        placeholder="123"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Complemento" name="address.complement">
                      <input
                        id="address.complement"
                        name="address.complement"
                        type="text"
                        value={formData.address.complement}
                        onChange={handleChange}
                        placeholder="Apto, Bloco, etc."
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Bairro" name="address.neighborhood">
                      <input
                        id="address.neighborhood"
                        name="address.neighborhood"
                        type="text"
                        value={formData.address.neighborhood}
                        onChange={handleChange}
                        placeholder="Nome do bairro"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Cidade" name="address.city">
                      <input
                        id="address.city"
                        name="address.city"
                        type="text"
                        value={formData.address.city}
                        onChange={handleChange}
                        placeholder="Nome da cidade"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField label="Estado" name="address.state">
                      <input
                        id="address.state"
                        name="address.state"
                        type="text"
                        value={formData.address.state}
                        onChange={handleChange}
                        placeholder="UF"
                        className={inputClassName}
                      />
                    </FormField>
                  </div>
                </CardContent>
              )}
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="w-4 h-4 text-pink-500" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagsInput 
                  tags={tags} 
                  onAdd={handleTagAdd} 
                  onRemove={handleTagRemove} 
                />
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-pink-500" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Preferências, alergias, observações importantes..."
                  className={cn(inputClassName, 'resize-none')}
                />
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Segment Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <SegmentSelector value={segment} onChange={handleSegmentChange} />
        </motion.div>

        {/* Anamnesis Fields */}
        {segment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <AnimatedCard>
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Ficha de Anamnese - {SEGMENTS.find(s => s.value === segment)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicFieldRenderer
                    segment={segment}
                    values={anamnesisData}
                    onChange={handleAnamnesisChange}
                  />
                </CardContent>
              </Card>
            </AnimatedCard>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex gap-3 justify-end pt-4"
        >
          <button type="button" onClick={handleBack}>
            <Button 
              variant="outline" 
              className="rounded-xl"
              type="button"
            >
              Cancelar
            </Button>
          </button>
          <Button 
            type="submit" 
            disabled={!formData.name || isUpdating}
            className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Unsaved Changes Dialog */}
      {dialog && (
        <ConfirmDialog
          isOpen={dialog.isOpen}
          onClose={closeDialog}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          message={dialog.message}
          variant={dialog.variant}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
        />
      )}
    </motion.div>
  );
}
