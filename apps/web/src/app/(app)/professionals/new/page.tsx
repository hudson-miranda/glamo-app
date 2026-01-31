/**
 * GLAMO - New Professional Page
 * Professional creation form with schedule editor
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  CreditCard,
  Palette,
  Image,
  Percent,
  DollarSign,
  Clock,
  Calendar,
  Info,
  X,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

import { useProfessionalMutations } from '@/hooks/useProfessionals';
import type { WorkSchedule, DaySchedule } from '@/lib/services/professionalService';

// ============================================================================
// Constants
// ============================================================================

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6b7280', // Gray
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
] as const;

type DayKey = typeof DAYS_OF_WEEK[number]['key'];

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  isWorking: false,
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
};

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  monday: { ...DEFAULT_DAY_SCHEDULE, isWorking: true },
  tuesday: { ...DEFAULT_DAY_SCHEDULE, isWorking: true },
  wednesday: { ...DEFAULT_DAY_SCHEDULE, isWorking: true },
  thursday: { ...DEFAULT_DAY_SCHEDULE, isWorking: true },
  friday: { ...DEFAULT_DAY_SCHEDULE, isWorking: true },
  saturday: { ...DEFAULT_DAY_SCHEDULE, isWorking: false },
  sunday: { ...DEFAULT_DAY_SCHEDULE, isWorking: false },
};

// ============================================================================
// Validation Schema
// ============================================================================

const professionalSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  document: z
    .string()
    .optional()
    .or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  avatar: z.string().url('URL inválida').optional().or(z.literal('')),
  bio: z.string().max(500, 'Biografia muito longa').optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED', 'NONE']),
  commissionValue: z
    .number()
    .min(0, 'Valor deve ser positivo')
    .optional(),
  isActive: z.boolean(),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

// ============================================================================
// Color Picker Component
// ============================================================================

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-9 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
              value === color
                ? 'border-foreground ring-2 ring-offset-2'
                : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="#000000"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
              onChange(customColor);
            }
          }}
          disabled={!/^#[0-9A-Fa-f]{6}$/.test(customColor)}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Schedule Editor Component
// ============================================================================

interface ScheduleEditorProps {
  value: WorkSchedule;
  onChange: (schedule: WorkSchedule) => void;
}

function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const handleDayChange = useCallback(
    (dayKey: DayKey, daySchedule: Partial<DaySchedule>) => {
      onChange({
        ...value,
        [dayKey]: {
          ...value[dayKey],
          ...daySchedule,
        },
      });
    },
    [value, onChange]
  );

  const handleApplyToAll = useCallback(
    (dayKey: DayKey) => {
      const sourceSchedule = value[dayKey];
      const newSchedule: WorkSchedule = { ...value };
      
      DAYS_OF_WEEK.forEach((day) => {
        if (day.key !== dayKey) {
          newSchedule[day.key] = { ...sourceSchedule };
        }
      });
      
      onChange(newSchedule);
    },
    [value, onChange]
  );

  const handleApplyToWeekdays = useCallback(
    (dayKey: DayKey) => {
      const sourceSchedule = value[dayKey];
      const newSchedule: WorkSchedule = { ...value };
      
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
        newSchedule[day as DayKey] = { ...sourceSchedule };
      });
      
      onChange(newSchedule);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Horários de Trabalho</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Configure os horários de trabalho do profissional para cada dia da semana
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = value[day.key] || DEFAULT_DAY_SCHEDULE;
          
          return (
            <div
              key={day.key}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                daySchedule.isWorking ? 'bg-background' : 'bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={daySchedule.isWorking}
                    onCheckedChange={(checked) =>
                      handleDayChange(day.key, { isWorking: checked })
                    }
                  />
                  <span className={cn(
                    'font-medium',
                    !daySchedule.isWorking && 'text-muted-foreground'
                  )}>
                    {day.label}
                  </span>
                </div>
                
                {daySchedule.isWorking && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyToWeekdays(day.key)}
                      className="text-xs"
                    >
                      Dias úteis
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyToAll(day.key)}
                      className="text-xs"
                    >
                      Todos
                    </Button>
                  </div>
                )}
              </div>

              {daySchedule.isWorking && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Início</Label>
                    <Input
                      type="time"
                      value={daySchedule.startTime || '09:00'}
                      onChange={(e) =>
                        handleDayChange(day.key, { startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Término</Label>
                    <Input
                      type="time"
                      value={daySchedule.endTime || '18:00'}
                      onChange={(e) =>
                        handleDayChange(day.key, { endTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Início Intervalo</Label>
                    <Input
                      type="time"
                      value={daySchedule.breakStart || '12:00'}
                      onChange={(e) =>
                        handleDayChange(day.key, { breakStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Fim Intervalo</Label>
                    <Input
                      type="time"
                      value={daySchedule.breakEnd || '13:00'}
                      onChange={(e) =>
                        handleDayChange(day.key, { breakEnd: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Preview Card Component
// ============================================================================

interface PreviewCardProps {
  name: string;
  email?: string;
  phone?: string;
  color: string;
  avatar?: string;
  commissionType: string;
  commissionValue?: number;
  isActive: boolean;
}

function PreviewCard({
  name,
  email,
  phone,
  color,
  avatar,
  commissionType,
  commissionValue,
  isActive,
}: PreviewCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const commissionLabel = {
    PERCENTAGE: `${commissionValue || 0}%`,
    FIXED: `R$ ${(commissionValue || 0).toFixed(2)}`,
    NONE: 'Sem comissão',
  }[commissionType];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Pré-visualização
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback
              style={{ backgroundColor: color }}
              className="text-white text-lg font-semibold"
            >
              {initials || '??'}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-4 text-lg font-semibold">
            {name || 'Nome do Profissional'}
          </h3>
          <Badge variant={isActive ? 'default' : 'secondary'} className="mt-2">
            {isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {phone}
              </div>
            )}
            <div className="flex items-center gap-2">
              {commissionType === 'PERCENTAGE' ? (
                <Percent className="h-4 w-4" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              {commissionLabel}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function NewProfessionalPage() {
  const router = useRouter();
  const { create, isCreating } = useProfessionalMutations();
  
  const [activeTab, setActiveTab] = useState('info');
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(DEFAULT_WORK_SCHEDULE);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      document: '',
      color: PRESET_COLORS[0],
      avatar: '',
      bio: '',
      commissionType: 'PERCENTAGE',
      commissionValue: 0,
      isActive: true,
    },
  });

  const watchedValues = watch();

  const onSubmit = useCallback(
    async (data: ProfessionalFormValues) => {
      try {
        const professional = await create({
          ...data,
          email: data.email || undefined,
          phone: data.phone || undefined,
          document: data.document || undefined,
          avatar: data.avatar || undefined,
          bio: data.bio || undefined,
          workSchedule,
        });

        router.push(`/professionals/${professional.id}`);
      } catch (error) {
        // Error handled by hook
      }
    },
    [create, workSchedule, router]
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push('/professionals');
    }
  }, [isDirty, router]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    router.push('/professionals');
  }, [router]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Profissional</h1>
          <p className="text-muted-foreground">
            Adicione um novo profissional à sua equipe
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="commission">Comissão</TabsTrigger>
                <TabsTrigger value="schedule">Horários</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Dados pessoais e de contato do profissional
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nome <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Nome completo"
                          className="pl-10"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="email@exemplo.com"
                          className="pl-10"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          {...register('phone')}
                          placeholder="(11) 99999-9999"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Document */}
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF/CNPJ</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="document"
                          {...register('document')}
                          placeholder="000.000.000-00"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Avatar */}
                    <div className="space-y-2">
                      <Label htmlFor="avatar">URL da Foto</Label>
                      <div className="relative">
                        <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="avatar"
                          {...register('avatar')}
                          placeholder="https://..."
                          className="pl-10"
                        />
                      </div>
                      {errors.avatar && (
                        <p className="text-sm text-destructive">{errors.avatar.message}</p>
                      )}
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label>Cor de Identificação</Label>
                      <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                          <ColorPicker value={field.value} onChange={field.onChange} />
                        )}
                      />
                      {errors.color && (
                        <p className="text-sm text-destructive">{errors.color.message}</p>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        {...register('bio')}
                        placeholder="Breve descrição sobre o profissional..."
                        rows={4}
                      />
                      {errors.bio && (
                        <p className="text-sm text-destructive">{errors.bio.message}</p>
                      )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Status Ativo</Label>
                        <p className="text-sm text-muted-foreground">
                          Profissionais ativos podem receber agendamentos
                        </p>
                      </div>
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commission" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração de Comissão</CardTitle>
                    <CardDescription>
                      Defina como o profissional será remunerado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Commission Type */}
                    <div className="space-y-2">
                      <Label>Tipo de Comissão</Label>
                      <Controller
                        name="commissionType"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERCENTAGE">
                                <div className="flex items-center gap-2">
                                  <Percent className="h-4 w-4" />
                                  Percentual
                                </div>
                              </SelectItem>
                              <SelectItem value="FIXED">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Valor Fixo
                                </div>
                              </SelectItem>
                              <SelectItem value="NONE">
                                <div className="flex items-center gap-2">
                                  <X className="h-4 w-4" />
                                  Sem Comissão
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Commission Value */}
                    {watchedValues.commissionType !== 'NONE' && (
                      <div className="space-y-2">
                        <Label htmlFor="commissionValue">
                          {watchedValues.commissionType === 'PERCENTAGE'
                            ? 'Percentual (%)'
                            : 'Valor Fixo (R$)'}
                        </Label>
                        <div className="relative">
                          {watchedValues.commissionType === 'PERCENTAGE' ? (
                            <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          ) : (
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          )}
                          <Controller
                            name="commissionValue"
                            control={control}
                            render={({ field }) => (
                              <Input
                                type="number"
                                step={watchedValues.commissionType === 'PERCENTAGE' ? '1' : '0.01'}
                                min="0"
                                max={watchedValues.commissionType === 'PERCENTAGE' ? '100' : undefined}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="pl-10"
                              />
                            )}
                          />
                        </div>
                        {errors.commissionValue && (
                          <p className="text-sm text-destructive">
                            {errors.commissionValue.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 mt-0.5" />
                        <div>
                          <p className="font-medium">Como funciona a comissão?</p>
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>
                              <strong>Percentual:</strong> O profissional recebe uma porcentagem do valor de cada serviço realizado.
                            </li>
                            <li>
                              <strong>Valor Fixo:</strong> O profissional recebe um valor fixo por cada atendimento.
                            </li>
                            <li>
                              <strong>Sem Comissão:</strong> O profissional trabalha sem comissão por serviço (ex: funcionário CLT).
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Horários de Trabalho</CardTitle>
                    <CardDescription>
                      Configure os dias e horários de trabalho do profissional
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScheduleEditor
                      value={workSchedule}
                      onChange={setWorkSchedule}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PreviewCard
              name={watchedValues.name}
              email={watchedValues.email}
              phone={watchedValues.phone}
              color={watchedValues.color}
              avatar={watchedValues.avatar}
              commissionType={watchedValues.commissionType}
              commissionValue={watchedValues.commissionValue}
              isActive={watchedValues.isActive}
            />

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Criar Profissional
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair? Todas
              as informações inseridas serão perdidas.
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
