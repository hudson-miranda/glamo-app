'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores';
import { BusinessSwitcher } from './business-switcher';
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
  Gift,
  UserCog,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Megaphone,
  Wallet,
  Star,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Principal',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Agendamentos',
        href: '/dashboard/appointments',
        icon: Calendar,
        badge: 3,
      },
    ],
  },
  {
    title: 'Gestão',
    items: [
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
    ],
  },
  {
    title: 'Financeiro',
    items: [
      {
        name: 'Caixa',
        href: '/dashboard/financial',
        icon: Wallet,
      },
      {
        name: 'Transações',
        href: '/dashboard/financial/transactions',
        icon: DollarSign,
      },
      {
        name: 'Relatórios',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        name: 'Campanhas',
        href: '/dashboard/marketing',
        icon: Megaphone,
      },
      {
        name: 'Fidelidade',
        href: '/dashboard/marketing/loyalty',
        icon: Gift,
      },
      {
        name: 'Avaliações',
        href: '/dashboard/marketing/reviews',
        icon: Star,
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        name: 'Notificações',
        href: '/dashboard/notifications',
        icon: Bell,
        badge: 5,
      },
      {
        name: 'Configurações',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, collapse, expand } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 text-white font-bold shadow-lg shadow-ruby-500/25">
              G
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent">
              Glamo
            </span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 text-white font-bold shadow-lg shadow-ruby-500/25">
              G
            </div>
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => (isCollapsed ? expand() : collapse())}
        className={cn(
          'absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Business Switcher */}
      <div className={cn(
        "border-b border-gray-200 dark:border-gray-800",
        isCollapsed ? "p-2" : "p-3"
      )}>
        <BusinessSwitcher collapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {navigation.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
            {/* Section Title */}
            {!isCollapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.title}
              </h3>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="my-3 mx-2 border-t border-gray-200 dark:border-gray-800" />
            )}
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                // Dashboard só fica ativo com match exato, outras páginas usam startsWith
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                      isActive
                        ? 'bg-gradient-to-r from-ruby-500 to-ruby-600 text-white shadow-lg shadow-ruby-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                      isCollapsed && 'justify-center px-2',
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                            isActive 
                              ? "bg-white/20 text-white"
                              : "bg-ruby-100 dark:bg-ruby-950/50 text-ruby-600 dark:text-ruby-400"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ruby-500 text-[10px] font-bold text-white">
                        {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Help */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        {!isCollapsed ? (
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <HelpCircle className="h-5 w-5" />
            <span>Ajuda & Suporte</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/help"
            className="flex items-center justify-center rounded-xl p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title="Ajuda & Suporte"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        )}
      </div>
    </aside>
  );
}
