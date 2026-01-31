'use client';

import { useAuthStore, useSidebarStore } from '@/stores';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Bell, LogOut, User, Settings } from 'lucide-react';
import { authService } from '@/services';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100/80 dark:border-gray-800/40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl px-4 md:px-6 transition-all duration-400 ease-out',
        // Mobile: full width
        'left-0',
        // Desktop: respect sidebar
        isCollapsed ? 'md:left-[68px]' : 'md:left-64',
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold shadow-[0_2px_8px_rgba(177,35,61,0.12)] text-sm">
            G
          </div>
          <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-ruby-500 to-ruby-600 bg-clip-text text-transparent">
            Glamo
          </span>
        </div>
        {/* Desktop Title - Hidden for cleaner look */}
        <div className="hidden">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Toggle de Tema */}
        <ThemeToggle variant="compact" />
        
        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-ruby-500 ring-2 ring-white dark:ring-gray-900" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1">
              <Avatar className="h-9 w-9 border border-gray-200/80 dark:border-gray-700/60">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-ruby-500 to-ruby-600 text-white text-sm font-medium">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-1.5" align="end" forceMount>
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs leading-none text-gray-400 dark:text-gray-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="rounded-lg py-2">
              <User className="mr-2.5 h-4 w-4 text-gray-400" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg py-2">
              <Settings className="mr-2.5 h-4 w-4 text-gray-400" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg py-2 text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50/80 dark:focus:bg-red-950/30">
              <LogOut className="mr-2.5 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
