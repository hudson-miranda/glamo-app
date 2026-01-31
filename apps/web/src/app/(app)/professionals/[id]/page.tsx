/**
 * GLAMO - Professional Detail Page
 * Professional profile with services and schedule tabs
 * Production-ready SaaS implementation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Mail,
  Phone,
  CreditCard,
  Percent,
  DollarSign,
  Briefcase,
  MoreHorizontal,
  Plus,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Activity,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useProfessional, useProfessionalAvailability } from '@/hooks/useProfessionals';
import type { WorkSchedule, DaySchedule } from '@/lib/services/professionalService';

// ============================================================================
// Constants
// ============================================================================

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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
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

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <div className={cn(
            'mt-2 flex items-center text-sm',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            <span className="ml-1 text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Schedule Display Component
// ============================================================================

interface ScheduleDisplayProps {
  schedule?: WorkSchedule;
}

function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  if (!schedule) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Nenhum horário configurado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {DAYS_OF_WEEK.map((day) => {
        const daySchedule = schedule[day.key];
        
        return (
          <div
            key={day.key}
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2',
              daySchedule?.isWorking ? 'bg-background' : 'bg-muted/50'
            )}
          >
            <span className={cn(
              'font-medium',
              !daySchedule?.isWorking && 'text-muted-foreground'
            )}>
              {day.short}
            </span>
            {daySchedule?.isWorking ? (
              <div className="text-sm">
                <span>{daySchedule.startTime}</span>
                <span className="mx-1 text-muted-foreground">-</span>
                <span>{daySchedule.endTime}</span>
                {daySchedule.breakStart && daySchedule.breakEnd && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Intervalo: {daySchedule.breakStart} - {daySchedule.breakEnd})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Folga</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Services List Component
// ============================================================================

interface ServicesListProps {
  services: any[];
  onAddService: () => void;
  onRemoveService: (serviceId: string) => void;
}

function ServicesList({ services, onAddService, onRemoveService }: ServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Nenhum serviço vinculado</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Serviço
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {services.length} serviço(s) vinculado(s)
        </span>
        <Button variant="outline" size="sm" onClick={onAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service: any) => (
            <TableRow key={service.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: service.color || '#6366f1' }}
                  />
                  <span className="font-medium">{service.name}</span>
                </div>
              </TableCell>
              <TableCell>{service.duration} min</TableCell>
              <TableCell className="text-right">
                R$ {service.price?.toFixed(2) || '0.00'}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveService(service.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProfessionalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const professionalId = params.id as string;
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    professional,
    isLoading,
    isError,
    remove,
    activate,
    deactivate,
    restore,
    addServices,
    removeServices,
    isDeleting,
    isActivating,
    isDeactivating,
  } = useProfessional(professionalId);

  const handleDelete = useCallback(async () => {
    try {
      await remove();
      router.push('/professionals');
    } catch (error) {
      // Error handled by hook
    }
  }, [remove, router]);

  const handleToggleStatus = useCallback(async () => {
    try {
      if (professional?.isActive) {
        await deactivate();
      } else {
        await activate();
      }
    } catch (error) {
      // Error handled by hook
    }
  }, [professional, activate, deactivate]);

  const handleAddService = useCallback(() => {
    // TODO: Open service selection dialog
    console.log('Add service');
  }, []);

  const handleRemoveService = useCallback(async (serviceId: string) => {
    try {
      await removeServices([serviceId]);
    } catch (error) {
      // Error handled by hook
    }
  }, [removeServices]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !professional) {
    return <NotFound />;
  }

  const initials = professional.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const commissionLabel = {
    PERCENTAGE: `${professional.commissionValue}%`,
    FIXED: `R$ ${professional.commissionValue?.toFixed(2)}`,
    NONE: 'Sem comissão',
  }[professional.commissionType];

  const services = (professional as any).services || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/professionals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{professional.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={professional.isActive ? 'default' : 'secondary'}>
                {professional.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              {professional.deletedAt && (
                <Badge variant="destructive">Excluído</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/professionals/${professionalId}/schedule`}>
              <Calendar className="mr-2 h-4 w-4" />
              Agenda
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/professionals/${professionalId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStatus}>
                {professional.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              {professional.deletedAt && (
                <DropdownMenuItem onClick={() => restore()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="schedule">Horários</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                    <Avatar className="h-24 w-24">
                      {professional.avatar && (
                        <AvatarImage src={professional.avatar} alt={professional.name} />
                      )}
                      <AvatarFallback
                        style={{ backgroundColor: professional.color || '#6366f1' }}
                        className="text-white text-2xl font-semibold"
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-4 sm:ml-6 sm:mt-0 flex-1">
                      <h2 className="text-xl font-semibold">{professional.name}</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {professional.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${professional.email}`}
                              className="text-primary hover:underline"
                            >
                              {professional.email}
                            </a>
                          </div>
                        )}
                        {professional.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${professional.phone}`}
                              className="text-primary hover:underline"
                            >
                              {professional.phone}
                            </a>
                          </div>
                        )}
                        {professional.document && (
                          <div className="flex items-center text-sm">
                            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                            {professional.document}
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          {professional.commissionType === 'PERCENTAGE' ? (
                            <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {commissionLabel}
                        </div>
                      </div>
                      {professional.bio && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          {professional.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Serviços Vinculados"
                  value={services.length}
                  icon={Briefcase}
                />
                <StatCard
                  title="Atendimentos (Mês)"
                  value={0}
                  icon={Calendar}
                  description="Nenhum atendimento registrado"
                />
                <StatCard
                  title="Avaliação Média"
                  value="N/A"
                  icon={Star}
                  description="Sem avaliações"
                />
                <StatCard
                  title="Taxa de Ocupação"
                  value="0%"
                  icon={Activity}
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços Vinculados</CardTitle>
                  <CardDescription>
                    Serviços que este profissional pode realizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ServicesList
                    services={services}
                    onAddService={handleAddService}
                    onRemoveService={handleRemoveService}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Horários de Trabalho</CardTitle>
                      <CardDescription>
                        Configuração de dias e horários de atendimento
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/professionals/${professionalId}/schedule`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScheduleDisplay schedule={professional.workSchedule as WorkSchedule} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>
                    Histórico de ações e atendimentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/professionals/${professionalId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Profissional
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/professionals/${professionalId}/schedule`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerenciar Agenda
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={isActivating || isDeactivating}
              >
                {professional.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar Profissional
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar Profissional
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>
                  {format(new Date(professional.createdAt), "d 'de' MMM, yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em</span>
                <span>
                  {format(new Date(professional.updatedAt), "d 'de' MMM, yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {professional.id.slice(0, 8)}...
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{professional.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados serão permanentemente
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
