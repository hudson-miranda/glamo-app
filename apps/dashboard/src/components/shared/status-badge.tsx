'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'default'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Generic
  success: { label: 'Sucesso', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  warning: { label: 'Atenção', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  error: { label: 'Erro', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  info: { label: 'Info', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  default: { label: 'Padrão', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  
  // Appointment Status
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  completed: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  no_show: { label: 'Não Compareceu', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  in_progress: { label: 'Em Andamento', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  
  // Active/Inactive
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  
  // Payment Status
  paid: { label: 'Pago', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  unpaid: { label: 'Não Pago', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  partial: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  refunded: { label: 'Reembolsado', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  
  // Priority
  low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.default;
  
  return (
    <Badge
      variant="outline"
      className={cn('font-medium border-0', config.className, className)}
    >
      {label || config.label}
    </Badge>
  );
}

// Appointment-specific badge
interface AppointmentStatusBadgeProps {
  status: 'pending' | 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'in_progress';
  className?: string;
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}

// Payment-specific badge
interface PaymentStatusBadgeProps {
  status: 'paid' | 'unpaid' | 'partial' | 'refunded' | 'pending';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}
