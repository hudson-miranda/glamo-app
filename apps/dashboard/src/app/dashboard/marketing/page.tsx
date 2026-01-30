'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Home,
  Megaphone,
  Star,
  Gift,
  MessageSquare,
  TrendingUp,
  Users,
  Send,
  Heart,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Marketing</span>
    </nav>
  );
}

export default function MarketingPage() {
  // Mock data
  const stats = {
    campaigns: 5,
    activeCampaigns: 2,
    loyaltyMembers: 128,
    reviewsAvg: 4.8,
    reviewsTotal: 156,
  };

  const quickLinks = [
    {
      title: 'Campanhas',
      description: 'Crie e gerencie campanhas promocionais',
      icon: Megaphone,
      href: '/dashboard/marketing/campaigns',
      badge: `${stats.activeCampaigns} ativas`,
    },
    {
      title: 'Programa de Fidelidade',
      description: 'Recompense seus clientes fiéis',
      icon: Gift,
      href: '/dashboard/marketing/loyalty',
      badge: `${stats.loyaltyMembers} membros`,
    },
    {
      title: 'Avaliações',
      description: 'Monitore a satisfação dos clientes',
      icon: Star,
      href: '/dashboard/marketing/reviews',
      badge: `${stats.reviewsAvg} ⭐`,
    },
  ];

  const recentCampaigns = [
    { id: '1', name: 'Verão 2026', type: 'Desconto', status: 'active', reach: 450 },
    { id: '2', name: 'Dia das Mães', type: 'Promoção', status: 'scheduled', reach: 0 },
    { id: '3', name: 'Black Friday', type: 'Desconto', status: 'completed', reach: 1200 },
  ];

  const recentReviews = [
    { id: '1', customer: 'Maria Silva', rating: 5, comment: 'Adorei o atendimento!', date: '29/01/2026' },
    { id: '2', customer: 'Paula Oliveira', rating: 5, comment: 'Profissionais excelentes', date: '28/01/2026' },
    { id: '3', customer: 'Ana Santos', rating: 4, comment: 'Muito bom, voltarei', date: '27/01/2026' },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 mt-1">Gerencie suas estratégias de marketing</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Campanhas Ativas</p>
                <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Membros Fidelidade</p>
                <p className="text-2xl font-bold">{stats.loyaltyMembers}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avaliação Média</p>
                <p className="text-2xl font-bold">{stats.reviewsAvg} ⭐</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Avaliações</p>
                <p className="text-2xl font-bold">{stats.reviewsTotal}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                    <link.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="outline">{link.badge}</Badge>
                </div>
                <h3 className="font-semibold text-lg">{link.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Campanhas Recentes</CardTitle>
              <CardDescription>Últimas campanhas criadas</CardDescription>
            </div>
            <Link href="/dashboard/marketing/campaigns">
              <Button variant="outline" size="sm">Ver Todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                      <Megaphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      campaign.status === 'active' ? 'default' :
                      campaign.status === 'scheduled' ? 'secondary' :
                      'outline'
                    }>
                      {campaign.status === 'active' ? 'Ativa' :
                       campaign.status === 'scheduled' ? 'Agendada' :
                       'Finalizada'}
                    </Badge>
                    {campaign.reach > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {campaign.reach} alcançados
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Avaliações Recentes</CardTitle>
              <CardDescription>Últimos feedbacks dos clientes</CardDescription>
            </div>
            <Link href="/dashboard/marketing/reviews">
              <Button variant="outline" size="sm">Ver Todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.customer}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">"{review.comment}"</p>
                  <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col">
              <Send className="h-5 w-5 mb-2" />
              Enviar SMS
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Megaphone className="h-5 w-5 mb-2" />
              Nova Campanha
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Gift className="h-5 w-5 mb-2" />
              Criar Promoção
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-5 w-5 mb-2" />
              Segmentar Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
