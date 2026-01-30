'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Settings, 
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const settingsGroups = [
  {
    title: 'Conta',
    items: [
      {
        name: 'Meu Perfil',
        description: 'Informações pessoais e foto',
        icon: User,
        href: '/dashboard/settings/profile'
      },
      {
        name: 'Segurança',
        description: 'Senha, autenticação e sessões',
        icon: Shield,
        href: '/dashboard/settings/security'
      },
      {
        name: 'Notificações',
        description: 'Preferências de notificação',
        icon: Bell,
        href: '/dashboard/settings/notifications'
      },
    ]
  },
  {
    title: 'Negócio',
    items: [
      {
        name: 'Informações do Negócio',
        description: 'Nome, endereço e contato',
        icon: Building2,
        href: '/dashboard/settings/business'
      },
      {
        name: 'Horário de Funcionamento',
        description: 'Dias e horários de atendimento',
        icon: Settings,
        href: '/dashboard/settings/schedule'
      },
      {
        name: 'Página de Agendamento',
        description: 'Personalize sua página pública',
        icon: Globe,
        href: '/dashboard/settings/booking-page'
      },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      {
        name: 'Plano e Assinatura',
        description: 'Gerencie seu plano',
        icon: CreditCard,
        href: '/dashboard/settings/subscription'
      },
    ]
  },
  {
    title: 'Preferências',
    items: [
      {
        name: 'Aparência',
        description: 'Tema e personalização',
        icon: Palette,
        href: '/dashboard/settings/appearance'
      },
      {
        name: 'Ajuda e Suporte',
        description: 'FAQ e contato',
        icon: HelpCircle,
        href: '/dashboard/help'
      },
    ]
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gerencie as configurações da sua conta e negócio
        </p>
      </div>

      {/* Settings Groups */}
      <StaggerContainer className="space-y-8">
        {settingsGroups.map((group) => (
          <StaggerItem key={group.title}>
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                {group.title}
              </h2>
              <Card>
                <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                  {group.items.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                          <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </motion.div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3 px-1">
          Zona de Perigo
        </h2>
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="p-0">
            <motion.button
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 p-4 w-full text-left hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-600 dark:text-red-400">Sair da Conta</h3>
                <p className="text-sm text-red-500/70 dark:text-red-400/70">Encerrar sua sessão atual</p>
              </div>
              <ChevronRight className="h-5 w-5 text-red-400" />
            </motion.button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
