/**
 * GLAMO - Professional Schedule Management Page
 * Dedicated schedule configuration with visual editor
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Clock,
  Calendar,
  Info,
  Copy,
  RotateCcw,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useProfessional, useProfessionalAvailability } from '@/hooks/useProfessionals';
import type { WorkSchedule, DaySchedule, AvailabilitySlot } from '@/lib/services/professionalService';

// ============================================================================
// Constants
// ============================================================================

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg', icon: '📅' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter', icon: '📅' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua', icon: '📅' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui', icon: '📅' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex', icon: '📅' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb', icon: '🌅' },
  { key: 'sunday', label: 'Domingo', short: 'Dom', icon: '☀️' },
] as const;

type DayKey = typeof DAYS_OF_WEEK[number]['key'];

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  isWorking: false,
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
};

const SCHEDULE_PRESETS = [
  {
    id: 'commercial',
    label: 'Horário Comercial',
    description: 'Seg a Sex, 08:00 - 18:00',
    schedule: {
      monday: { isWorking: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      tuesday: { isWorking: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      wednesday: { isWorking: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      thursday: { isWorking: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      friday: { isWorking: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false },
    },
  },
  {
    id: 'extended',
    label: 'Horário Estendido',
    description: 'Seg a Sáb, 09:00 - 20:00',
    schedule: {
      monday: { isWorking: true, startTime: '09:00', endTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
      saturday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
      sunday: { isWorking: false },
    },
  },
  {
    id: 'retail',
    label: 'Shopping/Varejo',
    description: 'Seg a Dom, 10:00 - 22:00',
    schedule: {
      monday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      tuesday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      wednesday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      thursday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      friday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      saturday: { isWorking: true, startTime: '10:00', endTime: '22:00', breakStart: '14:00', breakEnd: '15:00' },
      sunday: { isWorking: true, startTime: '14:00', endTime: '20:00' },
    },
  },
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
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Time Input Component
// ============================================================================

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
}

function TimeInput({ label, value, onChange, icon: Icon }: TimeInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('h-9 text-sm', Icon && 'pl-8')}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Day Schedule Card Component
// ============================================================================

interface DayScheduleCardProps {
  day: typeof DAYS_OF_WEEK[number];
  schedule: DaySchedule;
  onChange: (schedule: Partial<DaySchedule>) => void;
  onCopyTo: (targetDays: DayKey[]) => void;
}

function DayScheduleCard({ day, schedule, onChange, onCopyTo }: DayScheduleCardProps) {
  const calculateWorkHours = () => {
    if (!schedule.isWorking || !schedule.startTime || !schedule.endTime) return 0;
    
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    if (schedule.breakStart && schedule.breakEnd) {
      const [breakStartH, breakStartM] = schedule.breakStart.split(':').map(Number);
      const [breakEndH, breakEndM] = schedule.breakEnd.split(':').map(Number);
      const breakMinutes = (breakEndH * 60 + breakEndM) - (breakStartH * 60 + breakStartM);
      totalMinutes -= breakMinutes;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const workHours = calculateWorkHours();

  return (
    <Card className={cn(
      'transition-all',
      schedule.isWorking 
        ? 'border-primary/20 bg-background' 
        : 'border-dashed bg-muted/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={schedule.isWorking}
              onCheckedChange={(checked) => onChange({ isWorking: checked })}
            />
            <div>
              <span className={cn(
                'font-medium',
                !schedule.isWorking && 'text-muted-foreground'
              )}>
                {day.label}
              </span>
              {schedule.isWorking && workHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  {workHours.toFixed(1)}h de trabalho
                </p>
              )}
            </div>
          </div>
          
          {schedule.isWorking && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copiar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCopyTo(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])}>
                  Dias úteis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyTo(['saturday', 'sunday'])}>
                  Fim de semana
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCopyTo(DAYS_OF_WEEK.map(d => d.key).filter(k => k !== day.key))}>
                  Todos os outros dias
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {schedule.isWorking && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Sun className="h-3.5 w-3.5" />
                Expediente
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TimeInput
                  label="Início"
                  value={schedule.startTime || '09:00'}
                  onChange={(value) => onChange({ startTime: value })}
                />
                <TimeInput
                  label="Término"
                  value={schedule.endTime || '18:00'}
                  onChange={(value) => onChange({ endTime: value })}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Coffee className="h-3.5 w-3.5" />
                Intervalo
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TimeInput
                  label="Início"
                  value={schedule.breakStart || '12:00'}
                  onChange={(value) => onChange({ breakStart: value })}
                />
                <TimeInput
                  label="Término"
                  value={schedule.breakEnd || '13:00'}
                  onChange={(value) => onChange({ breakEnd: value })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Schedule Summary Component
// ============================================================================

interface ScheduleSummaryProps {
  schedule: WorkSchedule;
}

function ScheduleSummary({ schedule }: ScheduleSummaryProps) {
  const stats = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      const daySchedule = schedule[day.key];
      if (daySchedule?.isWorking) {
        acc.workingDays++;
        
        if (daySchedule.startTime && daySchedule.endTime) {
          const [startH, startM] = daySchedule.startTime.split(':').map(Number);
          const [endH, endM] = daySchedule.endTime.split(':').map(Number);
          let dayMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          
          if (daySchedule.breakStart && daySchedule.breakEnd) {
            const [breakStartH, breakStartM] = daySchedule.breakStart.split(':').map(Number);
            const [breakEndH, breakEndM] = daySchedule.breakEnd.split(':').map(Number);
            dayMinutes -= (breakEndH * 60 + breakEndM) - (breakStartH * 60 + breakStartM);
          }
          
          acc.totalMinutes += Math.max(0, dayMinutes);
        }
      }
      return acc;
    },
    { workingDays: 0, totalMinutes: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo da Semana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats.workingDays}</p>
            <p className="text-xs text-muted-foreground">Dias de trabalho</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{(stats.totalMinutes / 60).toFixed(0)}h</p>
            <p className="text-xs text-muted-foreground">Horas semanais</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dias ativos</p>
          <div className="flex flex-wrap gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <Badge
                key={day.key}
                variant={schedule[day.key]?.isWorking ? 'default' : 'outline'}
                className={cn(
                  'text-xs',
                  !schedule[day.key]?.isWorking && 'text-muted-foreground'
                )}
              >
                {day.short}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProfessionalSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const professionalId = params.id as string;
  
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({});
  const [originalSchedule, setOriginalSchedule] = useState<WorkSchedule>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    professional,
    isLoading,
    isError,
    updateSchedule,
  } = useProfessional(professionalId);

  const [isUpdating, setIsUpdating] = useState(false);

  // Load schedule when professional loads
  useEffect(() => {
    if (professional?.workSchedule) {
      const schedule = professional.workSchedule as WorkSchedule;
      setWorkSchedule(schedule);
      setOriginalSchedule(schedule);
    }
  }, [professional]);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(workSchedule) !== JSON.stringify(originalSchedule);
    setHasUnsavedChanges(hasChanges);
  }, [workSchedule, originalSchedule]);

  const handleDayChange = useCallback((dayKey: DayKey, daySchedule: Partial<DaySchedule>) => {
    setWorkSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        ...daySchedule,
      },
    }));
  }, []);

  const handleCopyTo = useCallback((sourceDay: DayKey, targetDays: DayKey[]) => {
    const sourceSchedule = workSchedule[sourceDay];
    if (!sourceSchedule) return;

    setWorkSchedule((prev) => {
      const newSchedule = { ...prev };
      targetDays.forEach((day) => {
        newSchedule[day] = { ...sourceSchedule };
      });
      return newSchedule;
    });
  }, [workSchedule]);

  const handleApplyPreset = useCallback((preset: typeof SCHEDULE_PRESETS[number]) => {
    setWorkSchedule(preset.schedule as WorkSchedule);
    toast.success(`Modelo "${preset.label}" aplicado`);
  }, []);

  const handleReset = useCallback(() => {
    setWorkSchedule(originalSchedule);
    toast.info('Alterações descartadas');
  }, [originalSchedule]);

  const handleSave = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateSchedule(workSchedule);
      setOriginalSchedule(workSchedule);
      setHasUnsavedChanges(false);
      toast.success('Horários salvos com sucesso');
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsUpdating(false);
    }
  }, [workSchedule, updateSchedule]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      router.push(`/professionals/${professionalId}`);
    }
  }, [hasUnsavedChanges, professionalId, router]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    router.push(`/professionals/${professionalId}`);
  }, [professionalId, router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !professional) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Profissional não encontrado</h2>
        <p className="mt-2 text-muted-foreground">
          O profissional que você está procurando não existe ou foi removido.
        </p>
        <Button asChild className="mt-6">
          <Link href="/professionals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Profissionais
          </Link>
        </Button>
      </div>
    );
  }

  const initials = professional.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-12 w-12">
            {professional.avatar && (
              <AvatarImage src={professional.avatar} alt={professional.name} />
            )}
            <AvatarFallback
              style={{ backgroundColor: professional.color || '#6366f1' }}
              className="text-white font-semibold"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda de Trabalho</h1>
            <p className="text-muted-foreground">{professional.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Alterações não salvas
            </Badge>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Descartar alterações</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={handleSave} disabled={isUpdating || !hasUnsavedChanges}>
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Schedule Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Modelos Pré-definidos</CardTitle>
              <CardDescription className="text-xs">
                Aplique um modelo e personalize conforme necessário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SCHEDULE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day Cards */}
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <DayScheduleCard
                key={day.key}
                day={day}
                schedule={workSchedule[day.key] || DEFAULT_DAY_SCHEDULE}
                onChange={(daySchedule) => handleDayChange(day.key, daySchedule)}
                onCopyTo={(targetDays) => handleCopyTo(day.key, targetDays)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ScheduleSummary schedule={workSchedule} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Configure os horários de trabalho para cada dia da semana.</p>
              </div>
              <div className="flex gap-2">
                <Copy className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Use &quot;Copiar&quot; para aplicar o mesmo horário em outros dias.</p>
              </div>
              <div className="flex gap-2">
                <Coffee className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>O intervalo é descontado automaticamente da disponibilidade.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating || !hasUnsavedChanges}
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
                      Salvar Horários
                    </>
                  )}
                </Button>
                <Button
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
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas nos horários. Tem certeza que deseja 
              sair? Todas as alterações serão perdidas.
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
