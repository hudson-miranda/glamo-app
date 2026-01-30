'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  Gift,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Agendamentos',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    name: 'Clientes',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    name: 'Serviços',
    href: '/dashboard/services',
    icon: Scissors,
  },
  {
    name: 'Profissionais',
    href: '/dashboard/professionals',
    icon: UserCog,
  },
  {
    name: 'Estoque',
    href: '/dashboard/inventory',
    icon: Package,
  },
  {
    name: 'Financeiro',
    href: '/dashboard/financial',
    icon: DollarSign,
  },
  {
    name: 'Marketing',
    href: '/dashboard/marketing',
    icon: Gift,
  },
  {
    name: 'Notificações',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    name: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, collapse, expand } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-glamo-500 text-white font-bold">
              G
            </div>
            <span className="text-xl font-bold text-glamo-500">Glamo</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (isCollapsed ? expand() : collapse())}
          className={cn(isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-glamo-500/10 text-glamo-500'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center px-2',
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Glamo
          </p>
        )}
      </div>
    </aside>
  );
}
