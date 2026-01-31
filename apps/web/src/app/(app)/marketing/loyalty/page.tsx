'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  Star,
  Users,
  Award,
  TrendingUp,
  Crown,
  Percent,
  Target,
  CheckCircle,
  Clock,
  MoreVertical
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
} from '@/components/ui';

// Tipos para fidelidade
interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'pontos' | 'carimbos' | 'indicacao';
  status: 'active' | 'inactive';
  members: number;
  pointsIssued: number;
  redemptions: number;
  description: string;
}

interface Reward {
  id: string;
  name: string;
  points: number;
  type: 'desconto' | 'servico' | 'produto';
  redemptions: number;
}

interface TopMember {
  id: string;
  name: string;
  points: number;
  tier: 'gold' | 'silver' | 'bronze';
}

interface LoyaltyData {
  loyaltyPrograms: LoyaltyProgram[];
  rewards: Reward[];
  topMembers: TopMember[];
}

// Mock data
const mockLoyaltyPrograms: LoyaltyProgram[] = [
  {
    id: '1',
    name: 'Programa Fidelidade Premium',
    type: 'pontos',
    status: 'active',
    members: 234,
    pointsIssued: 45600,
    redemptions: 89,
    description: '1 ponto por R$1 gasto'
  },
  {
    id: '2',
    name: 'Cartão Frequência',
    type: 'carimbos',
    status: 'active',
    members: 156,
    pointsIssued: 780,
    redemptions: 45,
    description: '10 carimbos = 1 serviço grátis'
  },
  {
    id: '3',
    name: 'Indique um Amigo',
    type: 'indicacao',
    status: 'active',
    members: 89,
    pointsIssued: 178,
    redemptions: 34,
    description: '10% de desconto por indicação'
  },
];

const mockRewards: Reward[] = [
  { id: '1', name: 'Desconto 10%', points: 100, type: 'desconto', redemptions: 45 },
  { id: '2', name: 'Corte Grátis', points: 500, type: 'servico', redemptions: 23 },
  { id: '3', name: 'Kit Produtos', points: 800, type: 'produto', redemptions: 12 },
  { id: '4', name: 'Tratamento VIP', points: 1500, type: 'servico', redemptions: 5 },
];

const mockTopMembers: TopMember[] = [
  { id: '1', name: 'Maria Silva', points: 2340, tier: 'gold' },
  { id: '2', name: 'Ana Santos', points: 1890, tier: 'gold' },
  { id: '3', name: 'Carla Oliveira', points: 1560, tier: 'silver' },
  { id: '4', name: 'Julia Costa', points: 1230, tier: 'silver' },
  { id: '5', name: 'Fernanda Lima', points: 980, tier: 'bronze' },
];

const mockLoyaltyData: LoyaltyData = {
  loyaltyPrograms: mockLoyaltyPrograms,
  rewards: mockRewards,
  topMembers: mockTopMembers,
};

const tierColors = {
  gold: 'text-amber-500',
  silver: 'text-gray-400',
  bronze: 'text-orange-600',
};

// Função para buscar dados de fidelidade - substituir por API real
const fetchLoyaltyData = async (): Promise<LoyaltyData> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockLoyaltyData;
};

export default function LoyaltyPage() {
  // Hook de dados assíncronos com cache
  const { data: loyaltyData, isLoading } = usePageData(
    fetchLoyaltyData,
    { cacheKey: 'marketing-loyalty', initialData: mockLoyaltyData }
  );

  const { loyaltyPrograms, rewards, topMembers } = loyaltyData || mockLoyaltyData;

  const stats = [
    { label: 'Total de Membros', value: 479, icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Pontos em Circulação', value: '46.5K', icon: Star, bg: 'bg-amber-50 dark:bg-amber-950/50', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Resgates do Mês', value: 168, icon: Gift, bg: 'bg-ruby-50 dark:bg-ruby-950/50', color: 'text-ruby-600 dark:text-ruby-400' },
    { label: 'Taxa de Retenção', value: '87%', icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programa de Fidelidade</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie recompensas e fidelize seus clientes
          </p>
        </div>
        <Button className="bg-ruby-600 hover:bg-ruby-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Programa
        </Button>
      </motion.div>

      {/* Stats */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-ruby-50 dark:bg-ruby-950/50 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-ruby-600 dark:text-ruby-400" />
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Programs */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-ruby-500" />
            Programas Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyPrograms.map((program) => (
              <motion.div
                key={program.id}
                whileHover={{ scale: 1.01 }}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                    {program.type === 'pontos' && <Star className="h-6 w-6 text-ruby-600 dark:text-ruby-400" />}
                    {program.type === 'carimbos' && <CheckCircle className="h-6 w-6 text-ruby-600 dark:text-ruby-400" />}
                    {program.type === 'indicacao' && <Users className="h-6 w-6 text-ruby-600 dark:text-ruby-400" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{program.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{program.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{program.members}</p>
                    <p className="text-xs text-gray-500">Membros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{program.redemptions}</p>
                    <p className="text-xs text-gray-500">Resgates</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                    Ativo
                  </span>
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </AnimatedCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rewards */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-ruby-500" />
              Recompensas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      {reward.type === 'desconto' && <Percent className="h-5 w-5 text-amber-600" />}
                      {reward.type === 'servico' && <Target className="h-5 w-5 text-amber-600" />}
                      {reward.type === 'produto' && <Gift className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{reward.name}</p>
                      <p className="text-sm text-gray-500">{reward.points} pontos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{reward.redemptions}</p>
                    <p className="text-xs text-gray-500">resgates</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Top Members */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-ruby-500" />
              Clientes Top
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <div className="flex items-center gap-1">
                        <Crown className={`h-3 w-3 ${tierColors[member.tier as keyof typeof tierColors]}`} />
                        <span className="text-xs text-gray-500 capitalize">{member.tier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">{member.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  );
}
