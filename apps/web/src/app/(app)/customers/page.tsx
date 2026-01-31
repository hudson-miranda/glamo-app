/**
 * GLAMO - Customers List Page
 * Enterprise customer management with DataTable integration
 * 
 * @version 2.0.0
 * @description Full-featured customer list with search, filters, sorting, bulk actions
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCustomers, type CustomerListItem } from '@/hooks/useCustomers';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DataTable, type ColumnDefinition, type DataTableAction, type DataTableBulkAction } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Button,
  Card, 
  CardContent,
  StaggerContainer, 
  StaggerItem,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
  SkeletonList,
} from '@/components/ui';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Check,
  XCircle,
  Download,
  ChevronDown,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CustomerFiltersState {
  status: 'all' | 'ACTIVE' | 'INACTIVE';
  gender: 'all' | 'MALE' | 'FEMALE' | 'OTHER';
  hasEmail: 'all' | 'yes' | 'no';
  hasPhone: 'all' | 'yes' | 'no';
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CustomerAvatar({ customer }: { customer: CustomerListItem }) {
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white font-medium text-sm shadow-[0_2px_8px_rgba(236,72,153,0.25)]">
        {initials}
      </div>
      <div>
        <div className="font-medium text-gray-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
          {customer.name}
        </div>
        {customer.email && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {customer.email}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium',
        isActive && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        !isActive && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      )}
    >
      {isActive ? (
        <>
          <Check className="w-3 h-3" />
          Ativo
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          Inativo
        </>
      )}
    </span>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  bg,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
}) {
  return (
    <AnimatedCard>
      <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-gray-900">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3">
            <div className={`p-2.5 rounded-xl ${bg} w-fit`}>
              <Icon className={`h-[18px] w-[18px] ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClear,
  isOpen,
}: {
  filters: CustomerFiltersState;
  onChange: (filters: CustomerFiltersState) => void;
  onClear: () => void;
  isOpen: boolean;
}) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.gender !== 'all' ||
    filters.hasEmail !== 'all' ||
    filters.hasPhone !== 'all';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100/80 dark:border-gray-800/40 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value as CustomerFiltersState['status'] })}
              className={cn(
                'px-3 py-2 rounded-xl border text-sm min-w-[140px]',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                'transition-all duration-300'
              )}
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Gênero
            </label>
            <select
              value={filters.gender}
              onChange={(e) => onChange({ ...filters, gender: e.target.value as CustomerFiltersState['gender'] })}
              className={cn(
                'px-3 py-2 rounded-xl border text-sm min-w-[140px]',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                'transition-all duration-300'
              )}
            >
              <option value="all">Todos</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Feminino</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          {/* Has Email Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <select
              value={filters.hasEmail}
              onChange={(e) => onChange({ ...filters, hasEmail: e.target.value as CustomerFiltersState['hasEmail'] })}
              className={cn(
                'px-3 py-2 rounded-xl border text-sm min-w-[140px]',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                'transition-all duration-300'
              )}
            >
              <option value="all">Todos</option>
              <option value="yes">Com email</option>
              <option value="no">Sem email</option>
            </select>
          </div>

          {/* Has Phone Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Telefone
            </label>
            <select
              value={filters.hasPhone}
              onChange={(e) => onChange({ ...filters, hasPhone: e.target.value as CustomerFiltersState['hasPhone'] })}
              className={cn(
                'px-3 py-2 rounded-xl border text-sm min-w-[140px]',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
                'transition-all duration-300'
              )}
            >
              <option value="all">Todos</option>
              <option value="yes">Com telefone</option>
              <option value="no">Sem telefone</option>
            </select>
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CustomersPage() {
  const router = useRouter();

  // State
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<CustomerFiltersState>({
    status: 'all',
    gender: 'all',
    hasEmail: 'all',
    hasPhone: 'all',
  });

  // Customers hook
  const {
    customers,
    total,
    totalPages,
    isLoading,
    page,
    limit,
    setPage,
    search,
    setSearch,
    setFilters,
    clearFilters,
    sortBy,
    sortOrder,
    setSort,
    selectedIds,
    setSelectedIds,
    deleteCustomer,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    stats,
    loadStats,
  } = useCustomers({ autoFetch: true });

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Confirm dialog
  const { dialog, confirm, closeDialog } = useConfirmDialog();

  // Apply local filters
  useEffect(() => {
    const apiFilters: Record<string, unknown> = {};
    
    if (localFilters.status !== 'all') {
      apiFilters.status = localFilters.status;
    }
    if (localFilters.gender !== 'all') {
      apiFilters.gender = localFilters.gender;
    }
    if (localFilters.hasEmail !== 'all') {
      apiFilters.hasEmail = localFilters.hasEmail === 'yes';
    }
    if (localFilters.hasPhone !== 'all') {
      apiFilters.hasPhone = localFilters.hasPhone === 'yes';
    }

    setFilters(apiFilters);
  }, [localFilters, setFilters]);

  // Handlers
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      status: 'all',
      gender: 'all',
      hasEmail: 'all',
      hasPhone: 'all',
    });
    clearFilters();
  }, [clearFilters]);

  const handleDelete = useCallback(
    async (customer: CustomerListItem) => {
      const confirmed = await confirm({
        title: 'Excluir cliente',
        message: `Tem certeza que deseja excluir "${customer.name}"? Esta ação pode ser revertida.`,
        variant: 'danger',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      });

      if (confirmed) {
        await deleteCustomer(customer.id);
      }
    },
    [confirm, deleteCustomer]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      const confirmed = await confirm({
        title: 'Excluir clientes',
        message: `Tem certeza que deseja excluir ${ids.length} cliente(s)?`,
        variant: 'danger',
        confirmText: 'Excluir todos',
      });

      if (confirmed) {
        await bulkDelete(ids);
      }
    },
    [confirm, bulkDelete]
  );

  const handleBulkActivate = useCallback(
    async (ids: string[]) => {
      await bulkActivate(ids);
    },
    [bulkActivate]
  );

  const handleBulkDeactivate = useCallback(
    async (ids: string[]) => {
      await bulkDeactivate(ids);
    },
    [bulkDeactivate]
  );

  // Table columns
  const columns: ColumnDefinition<CustomerListItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Cliente',
        accessor: 'name',
        sortable: true,
        cell: (_value, customer) => <CustomerAvatar customer={customer} />,
      },
      {
        id: 'phone',
        header: 'Telefone',
        accessor: 'phone',
        cell: (_value, customer) => (
          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            {customer.phone ? (
              <>
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </>
            ) : (
              '—'
            )}
          </span>
        ),
      },
      {
        id: 'cpf',
        header: 'CPF',
        accessor: 'cpf',
        cell: (_value, customer) => (
          <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">
            {customer.cpf || '—'}
          </span>
        ),
      },
      {
        id: 'isActive',
        header: 'Status',
        accessor: 'isActive',
        sortable: true,
        cell: (_value, customer) => <StatusBadge isActive={customer.isActive} />,
      },
      {
        id: 'createdAt',
        header: 'Cadastrado em',
        accessor: 'createdAt',
        sortable: true,
        cell: (_value, customer) => (
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
          </span>
        ),
      },
    ],
    []
  );

  // Row actions
  const actions: DataTableAction<CustomerListItem>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'Ver detalhes',
        icon: <Eye className="w-4 h-4" />,
        onClick: (customer) => router.push(`/customers/${customer.id}`),
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: <Edit className="w-4 h-4" />,
        onClick: (customer) => router.push(`/customers/${customer.id}/edit`),
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDelete,
        variant: 'danger',
      },
    ],
    [router, handleDelete]
  );

  // Bulk actions
  const bulkActions: DataTableBulkAction[] = useMemo(
    () => [
      {
        id: 'delete',
        label: 'Excluir',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleBulkDelete,
        variant: 'danger',
      },
      {
        id: 'activate',
        label: 'Ativar',
        icon: <Check className="w-4 h-4" />,
        onClick: handleBulkActivate,
      },
      {
        id: 'deactivate',
        label: 'Desativar',
        icon: <XCircle className="w-4 h-4" />,
        onClick: handleBulkDeactivate,
        variant: 'warning',
      },
    ],
    [handleBulkDelete, handleBulkActivate, handleBulkDeactivate]
  );

  // Loading state
  if (isLoading && customers.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <SkeletonList rows={5} />
      </motion.div>
    );
  }

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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3" style={{ letterSpacing: '-0.02em' }}>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/30">
              <Users className="w-5 h-5 text-pink-500" />
            </div>
            Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Gerencie sua base de {stats?.total || 0} clientes
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all duration-300">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      {stats && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatsCard
              label="Total de Clientes"
              value={stats.total}
              icon={Users}
              bg="bg-blue-50 dark:bg-blue-950/50"
              color="text-blue-600 dark:text-blue-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              label="Ativos"
              value={stats.active}
              icon={Check}
              bg="bg-emerald-50 dark:bg-emerald-950/50"
              color="text-emerald-600 dark:text-emerald-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              label="Novos este mês"
              value={stats.newThisMonth}
              icon={UserPlus}
              bg="bg-violet-50 dark:bg-violet-950/50"
              color="text-violet-600 dark:text-violet-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              label="Com email"
              value={stats.withEmail}
              icon={Mail}
              bg="bg-pink-50 dark:bg-pink-950/50"
              color="text-pink-600 dark:text-pink-400"
            />
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-100/80 dark:border-gray-800/40 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2 rounded-xl px-5 border-gray-100/80 dark:border-gray-800/40 transition-all duration-300",
            showFilters ? "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950/30 dark:border-pink-800" : "hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
          )}
        >
          <Filter className="h-[18px] w-[18px]" />
          Filtros
          <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
        </Button>
        <a href="/api/customers/export" download>
          <Button 
            variant="outline" 
            className="gap-2 rounded-xl px-5 border-gray-100/80 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300"
          >
            <Download className="h-[18px] w-[18px]" />
            Exportar
          </Button>
        </a>
      </motion.div>

      {/* Filter Panel */}
      <FilterPanel
        filters={localFilters}
        onChange={setLocalFilters}
        onClear={handleClearFilters}
        isOpen={showFilters}
      />

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <DataTable
          data={customers}
          columns={columns}
          keyExtractor={(customer) => customer.id}
          actions={actions}
          bulkActions={bulkActions}
          isLoading={isLoading}
          emptyMessage="Nenhum cliente encontrado"
          emptyDescription="Comece adicionando seu primeiro cliente"
          selectionMode="multiple"
          selection={{
            selectedIds,
            onSelectionChange: setSelectedIds,
          }}
          pagination={{
            page,
            pageSize: limit,
            totalItems: total,
            totalPages,
            onPageChange: setPage,
          }}
          sorting={{
            sortBy,
            sortOrder,
            onSortChange: (column, order) => setSort(column, order),
          }}
          onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
          stickyHeader
          striped
        />
      </motion.div>

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
