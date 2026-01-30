'use client';

import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Gift,
  MessageSquare,
  Mail,
  TrendingUp,
  Users,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerContainer, StaggerItem, AnimatedCard } from '@/components/ui/page-transition';

// Mock data
const campaigns = [
  {
    id: '1',
    name: 'Promoção de Aniversário',
    type: 'email',
    status: 'active',
    reach: 1250,
    opens: 890,
    conversions: 45,
    startDate: '2026-01-15',
    endDate: '2026-02-15'
  },
  {
    id: '2',
    name: 'Black Friday Antecipada',
    type: 'sms',
    status: 'scheduled',
    reach: 0,
    opens: 0,
    conversions: 0,
    startDate: '2026-02-01',
    endDate: '2026-02-28'
  },
  {
    id: '3',
    name: 'Dia da Mulher',
    type: 'whatsapp',
    status: 'draft',
    reach: 0,
    opens: 0,
    conversions: 0,
    startDate: '2026-03-01',
    endDate: '2026-03-08'
  },
  {
    id: '4',
    name: 'Clientes Inativos',
    type: 'email',
    status: 'completed',
    reach: 450,
    opens: 312,
    conversions: 28,
    startDate: '2026-01-01',
    endDate: '2026-01-14'
  },
];

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const statusLabels = {
  active: 'Ativa',
  scheduled: 'Agendada',
  draft: 'Rascunho',
  completed: 'Concluída',
};

const typeIcons = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
};

export default function MarketingPage() {
  const stats = [
    { label: 'Campanhas Ativas', value: 1, icon: Megaphone },
    { label: 'Alcance Total', value: '1.7K', icon: Users },
    { label: 'Taxa de Abertura', value: '71%', icon: Eye },
    { label: 'Conversões', value: 73, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas campanhas e promoções
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-ruby-100 dark:bg-ruby-900/30">
                  <stat.icon className="h-5 w-5 text-ruby-600 dark:text-ruby-400" />
                </div>
              </div>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-5 bg-gradient-to-br from-ruby-500 to-ruby-600 rounded-2xl text-white cursor-pointer"
        >
          <Mail className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Email Marketing</h3>
          <p className="text-sm text-white/80">Envie emails personalizados para seus clientes</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white cursor-pointer"
        >
          <MessageSquare className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">WhatsApp</h3>
          <p className="text-sm text-white/80">Mensagens diretas via WhatsApp Business</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white cursor-pointer"
        >
          <Gift className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Programa de Fidelidade</h3>
          <p className="text-sm text-white/80">Configure recompensas para seus clientes</p>
        </motion.div>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const TypeIcon = typeIcons[campaign.type as keyof typeof typeIcons];
              return (
                <motion.div
                  key={campaign.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-ruby-200 dark:hover:border-ruby-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                      <TypeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                          {statusLabels[campaign.status as keyof typeof statusLabels]}
                        </span>
                        <span className="text-xs text-gray-400">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {campaign.startDate} - {campaign.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {campaign.status === 'active' || campaign.status === 'completed' ? (
                      <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.reach}</p>
                          <p className="text-xs text-gray-400">Alcance</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.opens}</p>
                          <p className="text-xs text-gray-400">Aberturas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-emerald-600">{campaign.conversions}</p>
                          <p className="text-xs text-gray-400">Conversões</p>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="flex items-center gap-1">
                      {campaign.status === 'active' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'draft' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
