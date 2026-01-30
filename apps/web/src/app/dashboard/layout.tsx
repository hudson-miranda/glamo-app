'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore, useAuthStore } from '@/stores';
import { Sidebar, Header, MobileTabBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import { authService } from '@/services';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isCollapsed } = useSidebarStore();
  const { user, tenant, setAuth, logout, setLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se há token
        const token = authService.getAccessToken();
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Se já tem user no store, não precisa buscar
        if (user && tenant) {
          setIsChecking(false);
          return;
        }

        // Buscar dados do usuário
        const userData = await authService.getCurrentUser();
        
        if (!userData) {
          logout();
          router.push('/login');
          return;
        }

        setIsChecking(false);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, user, tenant, setAuth, logout, setLoading]);

  // Enquanto verifica auth, mostrar loading
  if (isChecking && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25 animate-pulse">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ruby-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-ruby-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-ruby-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          // Mobile: no margin, add bottom padding for tab bar
          'ml-0 pb-24 md:pb-0',
          // Desktop: sidebar margin
          isCollapsed ? 'md:ml-16' : 'md:ml-64',
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
      <MobileTabBar />
    </div>
  );
}
