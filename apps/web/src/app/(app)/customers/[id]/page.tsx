/**
 * GLAMO - Customer Detail Page
 * Enterprise customer profile view
 * 
 * @version 2.0.0
 * @description Full customer profile with history, anamnesis, and actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCustomer } from '@/hooks/useCustomers';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Button,
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
  SkeletonList,
} from '@/components/ui';
import { 
  Users, 
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Tag,
  Clock,
  Star,
  MessageSquare,
  DollarSign,
  Scissors,
  Heart,
  Check,
  XCircle,
  Copy,
  ExternalLink,
  MoreVertical,
  RefreshCcw,
} from 'lucide-react';
import type { Customer } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEGMENT_LABELS: Record<string, string> = {
  BELEZA: 'Beleza',
  ESTETICA: 'Estética',
  SAUDE: 'Saúde',
  BEM_ESTAR: 'Bem-estar',
  TATUAGEM_PIERCING: 'Tatuagem & Piercing',
  PET: 'Pet',
  SERVICOS_GERAIS: 'Serviços Gerais',
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CustomerAvatar({ customer, size = 'lg' }: { customer: Customer; size?: 'sm' | 'md' | 'lg' }) {
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  return customer.avatar ? (
    <img
      src={customer.avatar}
      alt={customer.name}
      className={cn(sizeClasses[size], 'rounded-2xl object-cover shadow-lg')}
    />
  ) : (
    <div className={cn(
      sizeClasses[size],
      'flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white font-semibold shadow-[0_4px_16px_rgba(236,72,153,0.3)]'
    )}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium',
        status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        status === 'INACTIVE' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      )}
    >
      {status === 'ACTIVE' ? (
        <>
          <Check className="w-4 h-4" />
          Cliente Ativo
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4" />
          Cliente Inativo
        </>
      )}
    </span>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  copyable = false,
  link,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
  copyable?: boolean;
  link?: string;
}) {
  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
    }
  };

  const content = (
    <div className="flex items-start gap-3 group">
      <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {value || '—'}
        </p>
      </div>
      {copyable && typeof value === 'string' && value && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      )}
    </div>
  );

  return content;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  description,
  icon: Icon,
}: {
  date: Date;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/30">
          <Icon className="w-4 h-4 text-pink-500" />
        </div>
        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
      </div>
      <div className="pb-6 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function CustomerDetailSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SkeletonCard className="h-[400px]" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toast } = useToast();

  // Fetch customer data
  const { customer, isLoading, error, refetch, deleteCustomer, isDeleting } = useCustomer(customerId);

  // Confirm dialog
  const { dialog, confirm, closeDialog } = useConfirmDialog();

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!customer) return;

    const confirmed = await confirm({
      title: 'Excluir cliente',
      message: `Tem certeza que deseja excluir "${customer.name}"? Esta ação pode ser revertida.`,
      variant: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      try {
        await deleteCustomer();
        toast({
          title: 'Cliente excluído',
          description: `${customer.name} foi movido para a lixeira.`,
          variant: 'success',
        });
        router.push('/customers');
      } catch (error) {
        toast({
          title: 'Erro ao excluir',
          description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
          variant: 'error',
        });
      }
    }
  }, [customer, confirm, deleteCustomer, toast, router]);

  // Loading state
  if (isLoading) {
    return <CustomerDetailSkeleton />;
  }

  // Error state
  if (error || !customer) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <XCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Cliente não encontrado
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          O cliente que você está procurando não existe ou foi removido.
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAddress = (address: Customer['address']) => {
    if (!address) return null;
    const parts = [
      address.street,
      address.number && `nº ${address.number}`,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Perfil do Cliente
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Visualize e gerencie as informações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 rounded-xl"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </Button>
          <Link href={`/customers/${customerId}/edit`}>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="md:col-span-1"
        >
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm overflow-hidden">
              {/* Header with gradient */}
              <div className="h-24 bg-gradient-to-br from-pink-400 to-pink-600 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  <CustomerAvatar customer={customer} size="lg" />
                </div>
              </div>

              <CardContent className="pt-16 pb-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
                  {customer.name}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={customer.status} />
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-medium bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex justify-center gap-2 mt-6">
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`}>
                      <Button variant="outline" size="icon" className="rounded-xl">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {customer.email && (
                    <a href={`mailto:${customer.email}`}>
                      <Button variant="outline" size="icon" className="rounded-xl">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>

                {/* Member Since */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                  Cliente desde {formatDate(customer.createdAt)}
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Right Column - Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Agendamentos"
              value={customer.appointments?.length || 0}
              icon={Calendar}
              color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Total Gasto"
              value={`R$ ${(customer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Serviços"
              value={customer.services?.length || 0}
              icon={Scissors}
              color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="Avaliação"
              value={customer.rating || '—'}
              icon={Star}
              color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* Contact Info */}
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-pink-500" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoItem
                    icon={Mail}
                    label="Email"
                    value={customer.email || ''}
                    copyable
                    link={customer.email ? `mailto:${customer.email}` : undefined}
                  />
                  <InfoItem
                    icon={Phone}
                    label="Telefone"
                    value={customer.phone || ''}
                    copyable
                    link={customer.phone ? `tel:${customer.phone}` : undefined}
                  />
                  <InfoItem
                    icon={FileText}
                    label="CPF/CNPJ"
                    value={customer.document || ''}
                    copyable
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Data de Nascimento"
                    value={formatDate(customer.birthDate) || ''}
                  />
                  <InfoItem
                    icon={Users}
                    label="Gênero"
                    value={customer.gender ? GENDER_LABELS[customer.gender] : ''}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Endereço"
                    value={formatAddress(customer.address) || ''}
                  />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Notes */}
          {customer.notes && (
            <AnimatedCard>
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-pink-500" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {/* Anamnesis */}
          {customer.anamnesis && (
            <AnimatedCard>
              <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Ficha de Anamnese
                    {customer.anamnesis.segment && (
                      <span className="text-xs text-gray-400 font-normal">
                        — {SEGMENT_LABELS[customer.anamnesis.segment] || customer.anamnesis.segment}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.anamnesis.data && Object.keys(customer.anamnesis.data).length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(customer.anamnesis.data).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                            {typeof value === 'boolean' 
                              ? (value ? 'Sim' : 'Não')
                              : Array.isArray(value)
                                ? value.join(', ')
                                : String(value) || '—'
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma informação de anamnese registrada.
                    </p>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {/* Recent Activity */}
          <AnimatedCard>
            <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-pink-500" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <TimelineItem
                    date={new Date(customer.createdAt)}
                    title="Cliente cadastrado"
                    description="Primeiro registro no sistema"
                    icon={Users}
                  />
                  {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                    <TimelineItem
                      date={new Date(customer.updatedAt)}
                      title="Informações atualizadas"
                      description="Dados do cliente foram modificados"
                      icon={Edit}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>
      </div>

      {/* Confirm Dialog */}
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
