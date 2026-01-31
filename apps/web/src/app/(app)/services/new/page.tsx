/**
 * GLAMO - New Service Page
 * Enterprise service creation form
 * 
 * @version 1.0.0
 * @description Full-featured service creation with category selection, professional assignment
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Scissors,
  Clock,
  DollarSign,
  Folder,
  Users,
  Globe,
  Tag,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlertCircle,
  Info,
  Percent,
  Palette,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Switch,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Skeleton,
} from '@/components/ui';
import { InlineCreateModal } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useServices } from '@/hooks/useServices';
import { cn, formatCurrency } from '@/lib/utils';
import type { BusinessSegment, ServiceFormData } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEGMENT_OPTIONS: { value: BusinessSegment; label: string; icon: string }[] = [
  { value: 'BELEZA', label: 'Beleza', icon: '💇‍♀️' },
  { value: 'ESTETICA', label: 'Estética', icon: '✨' },
  { value: 'SAUDE', label: 'Saúde', icon: '🏥' },
  { value: 'BEM_ESTAR', label: 'Bem-Estar', icon: '🧘' },
  { value: 'TATUAGEM_PIERCING', label: 'Tatuagem & Piercing', icon: '🎨' },
  { value: 'PET', label: 'Pet', icon: '🐾' },
  { value: 'SERVICOS_GERAIS', label: 'Serviços Gerais', icon: '🔧' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#78716C', '#64748B', '#6B7280',
];

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Professional {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

function DurationPicker({ value, onChange, error }: DurationPickerProps) {
  const [isCustom, setIsCustom] = useState(!DURATION_PRESETS.includes(value));
  const [customHours, setCustomHours] = useState(Math.floor(value / 60));
  const [customMinutes, setCustomMinutes] = useState(value % 60);

  const handleCustomChange = (hours: number, minutes: number) => {
    setCustomHours(hours);
    setCustomMinutes(minutes);
    onChange(hours * 60 + minutes);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={value === preset && !isCustom ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsCustom(false);
              onChange(preset);
            }}
            className="min-w-[60px]"
          >
            {preset >= 60 ? `${Math.floor(preset / 60)}h${preset % 60 > 0 ? ` ${preset % 60}m` : ''}` : `${preset}m`}
          </Button>
        ))}
        <Button
          type="button"
          variant={isCustom ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsCustom(true)}
        >
          Personalizado
        </Button>
      </div>

      <AnimatePresence>
        {isCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={customHours}
                  onChange={(e) => handleCustomChange(parseInt(e.target.value) || 0, customMinutes)}
                  className="w-20 text-center"
                />
                <span className="text-gray-500">horas</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={customMinutes}
                  onChange={(e) => handleCustomChange(customHours, parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <span className="text-gray-500">minutos</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  promoPrice?: number;
  onPromoPriceChange: (value: number | undefined) => void;
  error?: string;
}

function PriceInput({ value, onChange, promoPrice, onPromoPriceChange, error }: PriceInputProps) {
  const [showPromo, setShowPromo] = useState(promoPrice !== undefined);

  const formatInputValue = (val: number) => {
    return (val / 100).toFixed(2).replace('.', ',');
  };

  const parseInputValue = (str: string) => {
    const cleaned = str.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  };

  const handlePromoToggle = (enabled: boolean) => {
    setShowPromo(enabled);
    if (!enabled) {
      onPromoPriceChange(undefined);
    }
  };

  const discount = useMemo(() => {
    if (!promoPrice || promoPrice >= value) return 0;
    return Math.round(((value - promoPrice) / value) * 100);
  }, [value, promoPrice]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Regular Price */}
        <div>
          <Label htmlFor="price">Preço Regular *</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
            <Input
              id="price"
              type="text"
              inputMode="decimal"
              value={formatInputValue(value)}
              onChange={(e) => onChange(parseInputValue(e.target.value))}
              className="pl-10"
              placeholder="0,00"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>

        {/* Promo Price */}
        {showPromo && (
          <div>
            <Label htmlFor="promoPrice">Preço Promocional</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <Input
                id="promoPrice"
                type="text"
                inputMode="decimal"
                value={promoPrice ? formatInputValue(promoPrice) : ''}
                onChange={(e) => onPromoPriceChange(parseInputValue(e.target.value) || undefined)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
            {discount > 0 && (
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" />
                {discount}% de desconto
              </p>
            )}
          </div>
        )}
      </div>

      {/* Promo Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="enablePromo"
          checked={showPromo}
          onCheckedChange={handlePromoToggle}
        />
        <Label htmlFor="enablePromo" className="text-sm text-gray-600 cursor-pointer">
          Habilitar preço promocional
        </Label>
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-8 h-8 rounded-lg transition-all duration-200',
            value === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110' : 'hover:scale-105'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selected: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

function ProfessionalSelector({ professionals, selected, onChange, isLoading }: ProfessionalSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum profissional cadastrado</p>
        <Link href="/professionals/new" className="text-ruby-600 text-sm hover:underline mt-1 block">
          Cadastrar profissional
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
      {professionals.map((prof) => (
        <motion.button
          key={prof.id}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggle(prof.id)}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
            selected.includes(prof.id)
              ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium',
            selected.includes(prof.id) ? 'bg-ruby-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          )}>
            {prof.avatar ? (
              <img src={prof.avatar} alt={prof.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              prof.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium truncate',
              selected.includes(prof.id) ? 'text-ruby-900 dark:text-ruby-100' : 'text-gray-900 dark:text-white'
            )}>
              {prof.name}
            </p>
            {prof.email && (
              <p className="text-xs text-gray-500 truncate">{prof.email}</p>
            )}
          </div>
          {selected.includes(prof.id) && (
            <CheckCircle className="h-5 w-5 text-ruby-500 flex-shrink-0" />
          )}
        </motion.button>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createService, isCreating } = useServices({ autoFetch: false });

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceFormData>>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    promoPrice: undefined,
    categoryId: undefined,
    segment: 'BELEZA',
    onlineBooking: true,
    status: 'ACTIVE',
    color: COLORS[0],
  });
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);

  // Sections State
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    professionals: false,
    settings: false,
  });

  // Load categories and professionals
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [categoriesRes, professionalsRes] = await Promise.all([
          fetch('/api/categories?limit=100'),
          fetch('/api/professionals?limit=100&status=ACTIVE'),
        ]);

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }

        if (professionalsRes.ok) {
          const data = await professionalsRes.json();
          setProfessionals(data.professionals || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Toggle section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Update form data
  const updateField = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.duration || formData.duration < 5) {
      newErrors.duration = 'Duração mínima é 5 minutos';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Preço é obrigatório';
    }

    if (formData.promoPrice && formData.promoPrice >= formData.price!) {
      newErrors.promoPrice = 'Preço promocional deve ser menor que o preço regular';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const service = await createService({
        ...formData as ServiceFormData,
        professionalIds: selectedProfessionals,
      });

      toast({
        title: 'Serviço criado',
        description: `O serviço "${service.name}" foi criado com sucesso.`,
      });

      router.push('/services');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao criar serviço',
        variant: 'destructive',
      });
    }
  };

  // Handle category creation
  const handleCreateCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Falha ao criar categoria');

      const category = await response.json();
      setCategories((prev) => [...prev, category]);
      updateField('categoryId', category.id);
      setShowCategoryCreate(false);

      toast({
        title: 'Categoria criada',
        description: `A categoria "${name}" foi criada.`,
      });
    } catch (error) {
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-950/30">
              <Scissors className="w-5 h-5 text-ruby-500" />
            </div>
            Novo Serviço
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre um novo serviço oferecido pelo seu negócio
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('basic')}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-ruby-500" />
                Informações Básicas
              </span>
              {expandedSections.basic ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.basic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="space-y-4 pt-0">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Nome do Serviço *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: Corte Feminino"
                      className={cn('mt-1.5', errors.name && 'border-red-500')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descreva o serviço para seus clientes..."
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Category & Segment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <Label>Categoria</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Select
                          value={formData.categoryId || 'none'}
                          onValueChange={(val) => updateField('categoryId', val === 'none' ? undefined : val)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  {cat.color && (
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                  )}
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowCategoryCreate(true)}
                          title="Criar categoria"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Segment */}
                    <div>
                      <Label>Segmento</Label>
                      <Select
                        value={formData.segment}
                        onValueChange={(val) => updateField('segment', val as BusinessSegment)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENT_OPTIONS.map((seg) => (
                            <SelectItem key={seg.value} value={seg.value}>
                              <span className="flex items-center gap-2">
                                <span>{seg.icon}</span>
                                {seg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      Duração do Serviço *
                    </Label>
                    <DurationPicker
                      value={formData.duration || 60}
                      onChange={(val) => updateField('duration', val)}
                      error={errors.duration}
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Palette className="h-4 w-4 text-gray-500" />
                      Cor do Serviço
                    </Label>
                    <ColorPicker
                      value={formData.color}
                      onChange={(val) => updateField('color', val)}
                    />
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('pricing')}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-ruby-500" />
                Preços
              </span>
              {expandedSections.pricing ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.pricing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <PriceInput
                    value={formData.price || 0}
                    onChange={(val) => updateField('price', val)}
                    promoPrice={formData.promoPrice}
                    onPromoPriceChange={(val) => updateField('promoPrice', val)}
                    error={errors.price || errors.promoPrice}
                  />
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Professionals */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('professionals')}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-ruby-500" />
                Profissionais
                {selectedProfessionals.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedProfessionals.length}
                  </Badge>
                )}
              </span>
              {expandedSections.professionals ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.professionals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-500 mb-4">
                    Selecione os profissionais que podem executar este serviço
                  </p>
                  <ProfessionalSelector
                    professionals={professionals}
                    selected={selectedProfessionals}
                    onChange={setSelectedProfessionals}
                    isLoading={isLoadingData}
                  />
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('settings')}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-ruby-500" />
                Configurações
              </span>
              {expandedSections.settings ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.settings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 space-y-4">
                  {/* Online Booking */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          Agendamento Online
                        </p>
                        <p className="text-xs text-gray-500">
                          Permitir que clientes agendem este serviço online
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.onlineBooking}
                      onCheckedChange={(val) => updateField('onlineBooking', val)}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        formData.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      )}>
                        {formData.status === 'ACTIVE' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          Serviço Ativo
                        </p>
                        <p className="text-xs text-gray-500">
                          Serviços inativos não aparecem para clientes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.status === 'ACTIVE'}
                      onCheckedChange={(val) => updateField('status', val ? 'ACTIVE' : 'INACTIVE')}
                    />
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            className="gap-2 bg-gradient-to-r from-ruby-500 to-ruby-600"
          >
            {isCreating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Save className="h-4 w-4" />
                </motion.div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Criar Serviço
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Category Create Modal */}
      <InlineCreateModal
        open={showCategoryCreate}
        onClose={() => setShowCategoryCreate(false)}
        onSubmit={handleCreateCategory}
        title="Nova Categoria"
        placeholder="Nome da categoria"
        icon={Folder}
      />
    </motion.div>
  );
}
