/**
 * GLAMO - Service Detail Page
 * Enterprise service view with full details
 * 
 * @version 1.0.0
 * @description Service profile with stats, professionals, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Scissors,
  Clock,
  DollarSign,
  Users,
  Globe,
  Eye,
  EyeOff,
  Calendar,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  XCircle,
  Star,
  BarChart3,
  Folder,
  Percent,
  Palette,
  Copy,
  ExternalLink,
  Settings,
  ChevronRight,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useService } from '@/hooks/useServices';
import { useToast } from '@/hooks/useToast';
import { cn, formatCurrency, formatDuration, formatDate } from '@/lib/utils';
import type { Service, Professional } from '@/types';

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  bgClass: string;
  colorClass: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ label, value, icon: Icon, bgClass, colorClass, trend }: StatCardProps) {
  return (
    <Card className="border border-gray-100/80 dark:border-gray-800/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2.5 rounded-xl', bgClass)}>
            <Icon className={cn('h-4 w-4', colorClass)} />
          </div>
          {trend && (
            <span className={cn(
              'text-xs font-medium flex items-center gap-0.5',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-3" style={{ letterSpacing: '-0.02em' }}>
          {value}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-0.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}

interface ProfessionalCardProps {
  professional: Professional;
  onRemove?: () => void;
}

function ProfessionalCard({ professional, onRemove }: ProfessionalCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
    >
      <div className="w-10 h-10 rounded-full bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center text-ruby-600 font-medium">
        {professional.avatar ? (
          <img src={professional.avatar} alt={professional.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          professional.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
          {professional.name}
        </p>
        {professional.email && (
          <p className="text-xs text-gray-500 truncate">{professional.email}</p>
        )}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-gray-400 hover:text-red-500"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const serviceId = params.id as string;

  const { service, isLoading, error, deleteService, isDeleting, refetch } = useService(serviceId);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock stats (in real app, would come from analytics API)
  const mockStats = {
    totalBookings: 156,
    monthlyBookings: 24,
    revenue: 1872000, // in cents
    avgRating: 4.8,
  };

  const handleDelete = async () => {
    try {
      await deleteService();
      toast({
        title: 'Serviço excluído',
        description: 'O serviço foi excluído com sucesso.',
      });
      router.push('/services');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao excluir serviço',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;
    
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: service.status === 'ACTIVE' ? 'deactivate' : 'activate',
        }),
      });

      if (!response.ok) throw new Error('Falha ao alterar status');

      await refetch();
      toast({
        title: service.status === 'ACTIVE' ? 'Serviço desativado' : 'Serviço ativado',
        description: `O serviço foi ${service.status === 'ACTIVE' ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao alterar status',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/booking/service/${serviceId}`);
    toast({
      title: 'Link copiado',
      description: 'O link do serviço foi copiado para a área de transferência.',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Serviço não encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              O serviço que você está procurando não existe ou foi removido.
            </p>
            <Link href="/services">
              <Button>Voltar para Serviços</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = service.status === 'ACTIVE';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                {service.name}
              </h1>
              <Badge variant={isActive ? 'default' : 'secondary'} className="ml-1">
                {isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {service.category && (
                <span className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  {service.category.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(service.duration)}
              </span>
              {service.onlineBooking && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Globe className="h-3.5 w-3.5" />
                  Agendamento online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
            disabled={!service.onlineBooking}
          >
            <Copy className="h-4 w-4" />
            Copiar Link
          </Button>
          <Link href={`/services/${serviceId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStatus}>
                {isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteDialog(true)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Agendamentos Totais"
          value={mockStats.totalBookings}
          icon={Calendar}
          bgClass="bg-blue-50 dark:bg-blue-950/50"
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Este Mês"
          value={mockStats.monthlyBookings}
          icon={TrendingUp}
          bgClass="bg-emerald-50 dark:bg-emerald-950/50"
          colorClass="text-emerald-600 dark:text-emerald-400"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Receita Total"
          value={formatCurrency(mockStats.revenue)}
          icon={DollarSign}
          bgClass="bg-amber-50 dark:bg-amber-950/50"
          colorClass="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Avaliação Média"
          value={mockStats.avgRating.toFixed(1)}
          icon={Star}
          bgClass="bg-ruby-50 dark:bg-ruby-950/50"
          colorClass="text-ruby-600 dark:text-ruby-400"
        />
      </motion.div>

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="professionals">
              Profissionais
              {service.professionals && service.professionals.length > 0 && (
                <Badge variant="secondary" className="ml-2">{service.professionals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {service.description || 'Sem descrição disponível.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-ruby-500" />
                      Preços
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Preço Regular</p>
                        <p className={cn(
                          'text-2xl font-semibold',
                          service.promoPrice ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                        )}>
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                      {service.promoPrice && (
                        <div>
                          <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Promoção
                          </p>
                          <p className="text-2xl font-semibold text-emerald-600">
                            {formatCurrency(service.promoPrice)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detalhes</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                    <InfoItem
                      icon={Clock}
                      label="Duração"
                      value={formatDuration(service.duration)}
                    />
                    <InfoItem
                      icon={Folder}
                      label="Categoria"
                      value={service.category?.name || 'Sem categoria'}
                    />
                    <InfoItem
                      icon={Globe}
                      label="Agendamento Online"
                      value={service.onlineBooking ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Habilitado
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          Desabilitado
                        </span>
                      )}
                    />
                    {service.color && (
                      <InfoItem
                        icon={Palette}
                        label="Cor"
                        value={
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md border border-gray-200"
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="uppercase text-xs">{service.color}</span>
                          </div>
                        }
                      />
                    )}
                    <InfoItem
                      icon={Calendar}
                      label="Criado em"
                      value={formatDate(service.createdAt)}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Professionals Tab */}
          <TabsContent value="professionals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-ruby-500" />
                  Profissionais Vinculados
                </CardTitle>
                <Link href={`/services/${serviceId}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Gerenciar
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {service.professionals && service.professionals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.professionals.map((prof: any) => (
                      <ProfessionalCard key={prof.id} professional={prof} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum profissional vinculado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Adicione profissionais para que possam executar este serviço
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-ruby-500" />
                  Desempenho do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Análises em breve</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Gráficos de desempenho e tendências serão exibidos aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Excluir Serviço"
        description={`Tem certeza que deseja excluir o serviço "${service.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
