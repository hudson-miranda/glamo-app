'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { cn, getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Plus, 
  Check,
  Settings,
  CreditCard
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan?: string;
  role?: string;
}

interface BusinessSwitcherProps {
  collapsed?: boolean;
  className?: string;
}

export function BusinessSwitcher({ collapsed = false, className }: BusinessSwitcherProps) {
  const router = useRouter();
  const { tenant } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // TODO: Buscar lista de negócios do usuário da API
  // Por enquanto, usando apenas o tenant atual
  const businesses: Business[] = tenant ? [{
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logo: tenant.logo,
    plan: tenant.plan,
    role: 'Proprietário'
  }] : [];

  const currentBusiness = businesses.find(b => b.id === tenant?.id) || businesses[0];

  const handleSelectBusiness = (_business: Business) => {
    // TODO: Implementar troca de negócio via API
    // Por enquanto, apenas fecha o dropdown
    setIsOpen(false);
  };

  const handleCreateBusiness = () => {
    router.push('/onboarding');
  };

  const handleBusinessSettings = () => {
    router.push('/settings/business');
  };

  if (collapsed) {
    return (
      <div className={className}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button 
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold shadow-lg shadow-ruby-500/25 hover:shadow-xl hover:shadow-ruby-500/30 transition-all"
              title={currentBusiness?.name || 'Selecionar Negócio'}
            >
              {currentBusiness?.logo ? (
                <img 
                  src={currentBusiness.logo} 
                  alt={currentBusiness.name} 
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-sm">
                  {currentBusiness?.name ? getInitials(currentBusiness.name) : 'N'}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-64" 
            side="right" 
            align="start"
            sideOffset={12}
          >
            <BusinessDropdownContent 
              businesses={businesses}
              currentBusiness={currentBusiness}
              onSelect={handleSelectBusiness}
              onCreate={handleCreateBusiness}
              onSettings={handleBusinessSettings}
            />
          </DropdownMenuContent>
      </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all group"
          >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-600 text-white font-semibold shadow-md flex-shrink-0">
            {currentBusiness?.logo ? (
              <img 
                src={currentBusiness.logo} 
                alt={currentBusiness.name} 
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-sm">
                {currentBusiness?.name ? getInitials(currentBusiness.name) : 'N'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {currentBusiness?.name || 'Selecionar Negócio'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentBusiness?.plan || 'Trial'} • {currentBusiness?.role || 'Membro'}
            </p>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[calc(100%-24px)] ml-3" 
        align="start"
        sideOffset={8}
      >
        <BusinessDropdownContent 
          businesses={businesses}
          currentBusiness={currentBusiness}
          onSelect={handleSelectBusiness}
          onCreate={handleCreateBusiness}
          onSettings={handleBusinessSettings}
        />
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}

interface BusinessDropdownContentProps {
  businesses: Business[];
  currentBusiness?: Business;
  onSelect: (business: Business) => void;
  onCreate: () => void;
  onSettings: () => void;
}

function BusinessDropdownContent({ 
  businesses, 
  currentBusiness, 
  onSelect, 
  onCreate,
  onSettings 
}: BusinessDropdownContentProps) {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Seus Negócios
      </DropdownMenuLabel>
      
      {businesses.map((business) => (
        <DropdownMenuItem
          key={business.id}
          onClick={() => onSelect(business)}
          className="flex items-center gap-3 p-2 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ruby-500 to-ruby-600 text-white text-xs font-semibold flex-shrink-0">
            {business.logo ? (
              <img 
                src={business.logo} 
                alt={business.name} 
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              getInitials(business.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {business.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {business.plan || 'Trial'}
            </p>
          </div>
          {business.id === currentBusiness?.id && (
            <Check className="h-4 w-4 text-ruby-600 dark:text-ruby-400" />
          )}
        </DropdownMenuItem>
      ))}
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={onSettings}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
      >
        <Settings className="h-4 w-4" />
        Configurações do Negócio
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => {}}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
      >
        <CreditCard className="h-4 w-4" />
        Gerenciar Plano
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={onCreate}
        className="flex items-center gap-2 text-ruby-600 dark:text-ruby-400"
      >
        <Plus className="h-4 w-4" />
        Criar Novo Negócio
      </DropdownMenuItem>
    </>
  );
}
