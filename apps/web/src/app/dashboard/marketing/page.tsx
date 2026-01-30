'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  StaggerContainer, 
  StaggerItem, 
  AnimatedCard,
  Skeleton,
  SkeletonCard,
  SkeletonList,
} from '@/components/ui';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Campanhas Ativas', value: '1', icon: Megaphone, bg: 'bg-ruby-50 dark:bg-ruby-950/50', color: 'text-ruby-600 dark:text-ruby-400' },
    { label: 'Alcance Total', value: '1.7K', icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Taxa de Abertura', value: '71%', icon: Eye, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Conversões', value: '73', icon: TrendingUp, bg: 'bg-violet-50 dark:bg-violet-950/50', color: 'text-violet-600 dark:text-violet-400' },
  ];

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-ruby-500" />
            Marketing
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas campanhas e promoções
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-gradient-to-r from-ruby-600 to-ruby-700 hover:shadow-lg hover:shadow-ruby-500/25 transition-all">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-5 bg-gradient-to-br from-ruby-500 to-ruby-600 rounded-2xl text-white cursor-pointer shadow-lg shadow-ruby-500/20"
        >
          <Mail className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Email Marketing</h3>
          <p className="text-sm text-white/80">Envie emails personalizados para seus clientes</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <MessageSquare className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">WhatsApp</h3>
          <p className="text-sm text-white/80">Mensagens diretas via WhatsApp Business</p>
        </motion.div>
        
        <Link href="/dashboard/marketing/loyalty">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white cursor-pointer shadow-lg shadow-purple-500/20"
          >
            <Gift className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Programa de Fidelidade</h3>
            <p className="text-sm text-white/80">Configure recompensas para seus clientes</p>
          </motion.div>
        </Link>
      </motion.div>

      {/* Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
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
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'draft' && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
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
      </motion.div>
    </motion.div>
  );
}
