/**
 * GLAMO - Services List Page
 * Enterprise service management with full integration
 * 
 * @version 1.0.0
 * @description Full-featured services list with DataTable, filters, bulk actions
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Plus, 
  Search, 
  Filter,
  X,
  MoreVertical,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  Tag,
  Users,
  ChevronDown,
  Folder,
  RefreshCw,
  ArrowUpDown,
  Globe,
  Calendar,
  Percent
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent,
  StaggerContainer, 
  StaggerItem,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
  Input,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useServices, type ServiceFilters, type ServiceStats } from '@/hooks/useServices';
import { useToast } from '@/hooks/useToast';
import type { Service, BusinessSegment } from '@/types';
import { cn, formatCurrency, formatDuration } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEGMENT_LABELS: Record<BusinessSegment, string> = {
  BELEZA: 'Beleza',
  ESTETICA: 'Estética',
  SAUDE: 'Saúde',
  BEM_ESTAR: 'Bem-Estar',
  TATUAGEM_PIERCING: 'Tatuagem & Piercing',
  PET: 'Pet',
  SERVICOS_GERAIS: 'Serviços Gerais',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'INACTIVE', label: 'Inativos' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  bgClass: string;
  colorClass: string;
  subtitle?: string;
}

function StatCard({ label, value, icon: Icon, bgClass, colorClass, subtitle }: StatCardProps) {
  return (
    <AnimatedCard>
      <Card className="border border-gray-100/80 dark:border-gray-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-gray-900">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3">
            <div className={cn('p-2.5 rounded-xl w-fit', bgClass)}>
              <Icon className={cn('h-[18px] w-[18px]', colorClass)} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                {value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              {subtitle && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
  onClear: () => void;
  categories: Array<{ id: string; name: string }>;
}

function FilterPanel({ isOpen, onClose, filters, onFiltersChange, onClear, categories }: FilterPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <Card className="border border-gray-100/80 dark:border-gray-800/40 bg-white dark:bg-gray-900 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">Filtros Avançados</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Status
                  </label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as 'ACTIVE' | 'INACTIVE' })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Categoria
                  </label>
                  <Select
                    value={filters.categoryId || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, categoryId: value === 'all' ? undefined : value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Segment Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Segmento
                  </label>
                  <Select
                    value={filters.segment || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, segment: value === 'all' ? undefined : value as BusinessSegment })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os segmentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os segmentos</SelectItem>
                      {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView: () => void;
}

function ServiceCard({ service, isSelected, onSelect, onEdit, onDelete, onToggleStatus, onView }: ServiceCardProps) {
  const isActive = service.status === 'ACTIVE';
  
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]',
        'p-5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300',
        isSelected ? 'border-ruby-500' : 'border-gray-100/80 dark:border-gray-800/40',
        !isActive && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-0.5"
          />
          <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-900/30">
            <Scissors className="h-[18px] w-[18px] text-ruby-600 dark:text-ruby-400" />
          </div>
          {service.onlineBooking && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-medium">
              <Globe className="h-2.5 w-2.5" />
              Online
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <MoreVertical className="h-[15px] w-[15px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleStatus}>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & Category */}
      <Link href={`/services/${service.id}`} className="group">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-ruby-600 transition-colors" style={{ letterSpacing: '-0.01em' }}>
          {service.name}
        </h3>
      </Link>
      {service.category && (
        <div className="flex items-center gap-1.5 mb-2">
          <Folder className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">{service.category.name}</span>
        </div>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
        {service.description || 'Sem descrição'}
      </p>

      {/* Price & Duration */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="h-[15px] w-[15px]" />
            {formatDuration(service.duration)}
          </span>
          <div className="flex flex-col">
            <span className={cn(
              'flex items-center gap-1 font-medium',
              service.promoPrice ? 'text-gray-400 line-through text-xs' : 'text-emerald-600 dark:text-emerald-400'
            )}>
              <DollarSign className="h-[15px] w-[15px]" />
              {formatCurrency(service.price)}
            </span>
            {service.promoPrice && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Percent className="h-3 w-3" />
                {formatCurrency(service.promoPrice)}
              </span>
            )}
          </div>
        </div>
        {service.professionals && service.professionals.length > 0 && (
          <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
            <Users className="h-3 w-3" />
            {service.professionals.length}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100/80 dark:border-gray-800/40">
        <span className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isActive ? 'text-emerald-600' : 'text-gray-400'
        )}>
          {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="h-8 w-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300"
          >
            <Edit className="h-[15px] w-[15px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-colors duration-300"
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ServicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; service: Service | null; isBulk: boolean }>({
    open: false,
    service: null,
    isBulk: false,
  });

  // Hooks
  const {
    services,
    total,
    totalPages,
    stats,
    isLoading,
    isDeleting,
    page,
    limit,
    setPage,
    setLimit,
    search,
    setSearch,
    filters,
    setFilters,
    clearFilters,
    sortBy,
    sortOrder,
    setSort,
    selectedIds,
    setSelectedIds,
    selectAll,
    clearSelection,
    deleteService,
    updateService,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    refetch,
    loadStats,
  } = useServices();

  // Load stats and categories on mount
  useEffect(() => {
    loadStats();
    // Load categories
    fetch('/api/categories?limit=100')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, [loadStats]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.categoryId) count++;
    if (filters.segment) count++;
    if (filters.professionalId) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleDelete = async () => {
    try {
      if (deleteDialog.isBulk) {
        await bulkDelete(selectedIds);
        toast({
          title: 'Serviços excluídos',
          description: `${selectedIds.length} serviços foram excluídos com sucesso.`,
        });
      } else if (deleteDialog.service) {
        await deleteService(deleteDialog.service.id);
        toast({
          title: 'Serviço excluído',
          description: `O serviço "${deleteDialog.service.name}" foi excluído.`,
        });
      }
      setDeleteDialog({ open: false, service: null, isBulk: false });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao excluir',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateService(service.id, { status: newStatus } as any);
      toast({
        title: newStatus === 'ACTIVE' ? 'Serviço ativado' : 'Serviço desativado',
        description: `O serviço "${service.name}" foi ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao alterar status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      setDeleteDialog({ open: true, service: null, isBulk: true });
      return;
    }

    try {
      if (action === 'activate') {
        await bulkActivate(selectedIds);
        toast({
          title: 'Serviços ativados',
          description: `${selectedIds.length} serviços foram ativados.`,
        });
      } else {
        await bulkDeactivate(selectedIds);
        toast({
          title: 'Serviços desativados',
          description: `${selectedIds.length} serviços foram desativados.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha na operação',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.segment) params.set('segment', filters.segment);

      const response = await fetch(`/api/services/export?${params}`);
      if (!response.ok) throw new Error('Falha ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao exportar dados.',
        variant: 'destructive',
      });
    }
  };

  // Table columns
  const columns: Column<Service>[] = [
    {
      key: 'select',
      header: () => (
        <Checkbox
          checked={selectedIds.length === services.length && services.length > 0}
          onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
        />
      ),
      cell: (service) => (
        <Checkbox
          checked={selectedIds.includes(service.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds([...selectedIds, service.id]);
            } else {
              setSelectedIds(selectedIds.filter((id) => id !== service.id));
            }
          }}
        />
      ),
      width: '40px',
    },
    {
      key: 'name',
      header: 'Serviço',
      sortable: true,
      cell: (service) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-ruby-50 dark:bg-ruby-900/30">
            <Scissors className="h-4 w-4 text-ruby-600 dark:text-ruby-400" />
          </div>
          <div>
            <Link href={`/services/${service.id}`} className="font-medium text-gray-900 dark:text-white hover:text-ruby-600 transition-colors">
              {service.name}
            </Link>
            {service.category && (
              <p className="text-xs text-gray-500">{service.category.name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duração',
      sortable: true,
      cell: (service) => (
        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(service.duration)}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Preço',
      sortable: true,
      cell: (service) => (
        <div>
          <span className={cn(
            'font-medium',
            service.promoPrice ? 'text-gray-400 line-through text-sm' : 'text-gray-900 dark:text-white'
          )}>
            {formatCurrency(service.price)}
          </span>
          {service.promoPrice && (
            <span className="block text-emerald-600 font-medium">
              {formatCurrency(service.promoPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service) => (
        <Badge variant={service.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {service.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'onlineBooking',
      header: 'Online',
      cell: (service) => (
        service.onlineBooking ? (
          <span className="flex items-center gap-1 text-blue-600">
            <Globe className="h-4 w-4" />
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (service) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/services/${service.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/services/${service.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
              {service.status === 'ACTIVE' ? (
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
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setDeleteDialog({ open: true, service, isBulk: false })}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: '60px',
    },
  ];

  // Loading state
  if (isLoading && services.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
            <div className="p-2 rounded-xl bg-ruby-50 dark:bg-ruby-950/30">
              <Scissors className="w-5 h-5 text-ruby-500" />
            </div>
            Serviços
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            {total} serviços cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Link href="/services/new">
            <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-500 to-ruby-600 hover:shadow-[0_4px_16px_rgba(177,35,61,0.2)] transition-all duration-300">
              <Plus className="h-4 w-4" />
              Novo Serviço
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              label="Total de Serviços"
              value={stats.total}
              icon={Package}
              bgClass="bg-blue-50 dark:bg-blue-950/50"
              colorClass="text-blue-600 dark:text-blue-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Serviços Ativos"
              value={stats.active}
              icon={CheckCircle}
              bgClass="bg-emerald-50 dark:bg-emerald-950/50"
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Preço Médio"
              value={formatCurrency(stats.averagePrice)}
              icon={DollarSign}
              bgClass="bg-amber-50 dark:bg-amber-950/50"
              colorClass="text-amber-600 dark:text-amber-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Duração Média"
              value={formatDuration(stats.averageDuration)}
              icon={Clock}
              bgClass="bg-ruby-50 dark:bg-ruby-950/50"
              colorClass="text-ruby-600 dark:text-ruby-400"
            />
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Search and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'gap-2 rounded-xl',
              activeFiltersCount > 0 && 'border-ruby-500 text-ruby-600'
            )}
          >
            <Filter className="h-[18px] w-[18px]" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-xl overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-none h-10 w-10"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="rounded-none h-10 w-10"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onClear={clearFilters}
        categories={categories}
      />

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-ruby-50 dark:bg-ruby-950/30 border-ruby-200 dark:border-ruby-800">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <span className="text-sm font-medium text-ruby-900 dark:text-ruby-100">
                  {selectedIds.length} serviço(s) selecionado(s)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Ativar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Desativar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {services.length === 0 ? (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Scissors className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum serviço encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                  {search || activeFiltersCount > 0
                    ? 'Tente ajustar os filtros ou termo de busca.'
                    : 'Comece adicionando seu primeiro serviço.'}
                </p>
                {!search && activeFiltersCount === 0 && (
                  <Link href="/services/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Serviço
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <StaggerItem key={service.id}>
                  <ServiceCard
                    service={service}
                    isSelected={selectedIds.includes(service.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedIds([...selectedIds, service.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== service.id));
                      }
                    }}
                    onEdit={() => router.push(`/services/${service.id}/edit`)}
                    onDelete={() => setDeleteDialog({ open: true, service, isBulk: false })}
                    onToggleStatus={() => handleToggleStatus(service)}
                    onView={() => router.push(`/services/${service.id}`)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </motion.div>
      ) : (
        <DataTable
          data={services}
          columns={columns}
          isLoading={isLoading}
          page={page}
          pageSize={limit}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={setSort}
          emptyMessage="Nenhum serviço encontrado"
          emptyIcon={Scissors}
        />
      )}

      {/* Pagination for Grid View */}
      {viewMode === 'grid' && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, service: null, isBulk: false })}
        title={deleteDialog.isBulk ? 'Excluir Serviços' : 'Excluir Serviço'}
        description={
          deleteDialog.isBulk
            ? `Tem certeza que deseja excluir ${selectedIds.length} serviços? Esta ação não pode ser desfeita.`
            : `Tem certeza que deseja excluir o serviço "${deleteDialog.service?.name}"? Esta ação não pode ser desfeita.`
        }
        confirmText="Excluir"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
