'use client';

import { useSidebarStore } from '@/stores';
import { Sidebar, Header } from '@/components/layout';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
