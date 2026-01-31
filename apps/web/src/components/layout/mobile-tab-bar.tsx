'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Menu,
} from 'lucide-react';

interface TabItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  action?: 'menu';
}

const tabs: TabItem[] = [
  {
    name: 'Início',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Agenda',
    href: '/appointments',
    icon: Calendar,
  },
  {
    name: 'Clientes',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Caixa',
    href: '/financial',
    icon: DollarSign,
  },
  {
    name: 'Menu',
    icon: Menu,
    action: 'menu',
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();

  return (
    <>
      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Glass effect background - more refined */}
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-t border-gray-100/80 dark:border-gray-800/40" />
        
        {/* Safe area padding for iOS */}
        <div className="relative px-2 pb-safe">
          <div className="flex items-center justify-around py-2">
            {tabs.map((tab) => {
              const isActive = tab.href 
                ? tab.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                : isOpen;

              if (tab.action === 'menu') {
                return (
                  <button
                    key={tab.name}
                    onClick={toggle}
                    className="flex flex-col items-center justify-center min-w-[64px] py-1 relative group"
                  >
                    <div className={cn(
                      "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
                      isOpen
                        ? "bg-gradient-to-br from-ruby-500 to-ruby-600 shadow-[0_4px_12px_rgba(177,35,61,0.15)]"
                        : "group-hover:bg-gray-100/80 dark:group-hover:bg-gray-800/50"
                    )}>
                      <tab.icon className={cn(
                        "h-[18px] w-[18px] transition-colors duration-300",
                        isOpen
                          ? "text-white"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                      )} />
                    </div>
                    <span className={cn(
                      "mt-1 text-[10px] font-medium transition-colors duration-300",
                      isOpen
                        ? "text-ruby-600 dark:text-ruby-400"
                        : "text-gray-400 dark:text-gray-500"
                    )}>
                      {tab.name}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={tab.name}
                  href={tab.href!}
                  className="flex flex-col items-center justify-center min-w-[64px] py-1 relative group"
                >
                  <div className={cn(
                    "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-ruby-500 to-ruby-600 shadow-[0_4px_12px_rgba(177,35,61,0.15)]"
                      : "group-hover:bg-gray-100/80 dark:group-hover:bg-gray-800/50"
                  )}>
                    <tab.icon className={cn(
                      "h-[18px] w-[18px] transition-colors duration-300",
                      isActive
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    )} />
                    {isActive && (
                      <motion.div
                        layoutId="tabIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-600 -z-10"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "mt-1 text-[10px] font-medium transition-colors duration-300",
                    isActive
                      ? "text-ruby-600 dark:text-ruby-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}>
                    {tab.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Overlay when menu is open */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={toggle}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
