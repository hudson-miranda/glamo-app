/**
 * GLAMO - New Customer Page
 * Enterprise customer creation form
 * 
 * @version 2.0.0
 * @description Full-featured customer creation with EntityForm integration
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';
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
} from 'lucide-react';
import type { BusinessSegment, Gender } from '@/types';

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

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Selecione' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'NOT_INFORMED', label: 'Não Informado' },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FormField({
  label,
  name,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
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
  onChange: (segment: BusinessSegment) => void;
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
                onClick={() => onChange(segment.value)}
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

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function NewCustomerPage() {
  const router = useRouter();
  const { createCustomer, isCreating } = useCustomers();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    gender: '' as string,
    birthDate: '',
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
    acceptsMarketing: true,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [segment, setSegment] = useState<BusinessSegment | null>(null);
  const [showAddress, setShowAddress] = useState(false);

  // Handle input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  }, []);

  // Handle tag management
  const handleTagAdd = useCallback((tag: string) => {
    setTags(prev => [...prev, tag]);
  }, []);

  const handleTagRemove = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome obrigatório', {
        description: 'Por favor, informe o nome do cliente.',
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Telefone obrigatório', {
        description: 'Por favor, informe o telefone do cliente.',
      });
      return;
    }

    try {
      await createCustomer({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim() || undefined,
        gender: formData.gender || undefined,
        birthDate: formData.birthDate || undefined,
        street: formData.address.street || undefined,
        number: formData.address.number || undefined,
        complement: formData.address.complement || undefined,
        neighborhood: formData.address.neighborhood || undefined,
        city: formData.address.city || undefined,
        state: formData.address.state || undefined,
        zipCode: formData.address.zipCode || undefined,
        tags,
        notes: formData.notes.trim() || undefined,
      });
      
      toast.success('Cliente criado!', {
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      router.push('/customers');
    } catch (error) {
      toast.error('Erro ao criar cliente', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
      });
    }
  }, [formData, tags, createCustomer, toast, router]);

  const inputClassName = cn(
    'w-full px-4 py-3 rounded-xl border text-sm',
    'bg-white dark:bg-gray-800',
    'border-gray-200 dark:border-gray-700',
    'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
    'focus:outline-none transition-all duration-300'
  );

  const inputWithIconClassName = cn(inputClassName, 'pl-10');

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
          <Link href="/customers">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3" style={{ letterSpacing: '-0.02em' }}>
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/30">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
              Novo Cliente
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Preencha os dados para cadastrar um novo cliente
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.phone || isCreating}
          className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all duration-300 disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Cliente
            </>
          )}
        </Button>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

                  <FormField label="Telefone" name="phone" required icon={Phone}>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      className={inputWithIconClassName}
                      required
                    />
                  </FormField>

                  <FormField label="CPF" name="cpf">
                    <input
                      id="cpf"
                      name="cpf"
                      type="text"
                      value={formData.cpf}
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
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
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
              <CardContent className="space-y-4">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Preferências, alergias, observações importantes..."
                  className={cn(inputClassName, 'resize-none')}
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="acceptsMarketing"
                    name="acceptsMarketing"
                    checked={formData.acceptsMarketing}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      acceptsMarketing: e.target.checked 
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="acceptsMarketing" className="text-sm text-gray-700 dark:text-gray-300">
                    Cliente aceita receber comunicações de marketing
                  </label>
                </div>
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
          <SegmentSelector value={segment} onChange={setSegment} />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex gap-3 justify-end pt-4"
        >
          <Link href="/customers">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-xl"
            >
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={!formData.name || isCreating}
            className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Cadastrar Cliente
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
