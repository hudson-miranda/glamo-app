'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Star,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Flag,
  TrendingUp,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/marketing" className="hover:text-gray-700">
        Marketing
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Avaliações</span>
    </nav>
  );
}

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Mock data
  const stats = {
    average: 4.8,
    total: 156,
    distribution: [
      { stars: 5, count: 120, percentage: 77 },
      { stars: 4, count: 25, percentage: 16 },
      { stars: 3, count: 8, percentage: 5 },
      { stars: 2, count: 2, percentage: 1 },
      { stars: 1, count: 1, percentage: 1 },
    ],
  };

  const reviews = [
    {
      id: '1',
      customer: 'Maria Silva',
      rating: 5,
      comment: 'Adorei o atendimento! A Ana foi super atenciosa e o resultado ficou perfeito. Com certeza voltarei!',
      service: 'Coloração',
      professional: 'Ana Costa',
      date: '29/01/2026',
      replied: true,
      reply: 'Obrigada pelo carinho, Maria! Esperamos você em breve! 💜',
    },
    {
      id: '2',
      customer: 'Paula Oliveira',
      rating: 5,
      comment: 'Profissionais excelentes, ambiente agradável e preços justos. Recomendo!',
      service: 'Corte + Escova',
      professional: 'Fernanda Souza',
      date: '28/01/2026',
      replied: false,
      reply: null,
    },
    {
      id: '3',
      customer: 'Ana Santos',
      rating: 4,
      comment: 'Muito bom, só acho que poderia ter mais opções de horário no final de semana.',
      service: 'Manicure',
      professional: 'Carla Lima',
      date: '27/01/2026',
      replied: true,
      reply: 'Obrigada pelo feedback, Ana! Estamos trabalhando para ampliar nossos horários. 😊',
    },
    {
      id: '4',
      customer: 'Juliana Costa',
      rating: 3,
      comment: 'O serviço foi bom mas tive que esperar um pouco além do horário marcado.',
      service: 'Escova',
      professional: 'Maria Santos',
      date: '26/01/2026',
      replied: false,
      reply: null,
    },
  ];

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
            <p className="text-gray-500 mt-1">Monitore a satisfação dos clientes</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
              <div className="flex justify-center mt-2">
                {renderStars(Math.round(stats.average), 'lg')}
              </div>
              <p className="text-gray-500 mt-2">{stats.total} avaliações</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {stats.distribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{item.stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar avaliação..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({reviews.length})</TabsTrigger>
          <TabsTrigger value="pending">Sem Resposta ({reviews.filter(r => !r.replied).length})</TabsTrigger>
          <TabsTrigger value="replied">Respondidas ({reviews.filter(r => r.replied).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {review.customer.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{review.customer}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{review.service}</Badge>
                    {review.replied ? (
                      <Badge className="bg-green-100 text-green-700">Respondida</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-2">"{review.comment}"</p>
                <p className="text-sm text-gray-500">
                  Profissional: <span className="font-medium">{review.professional}</span>
                </p>

                {review.replied && review.reply && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <p className="text-sm font-medium text-purple-800 mb-1">Sua resposta:</p>
                    <p className="text-sm text-purple-700">{review.reply}</p>
                  </div>
                )}

                {replyingTo === review.id ? (
                  <div className="mt-4 space-y-3">
                    <Textarea placeholder="Digite sua resposta..." rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                        Enviar Resposta
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    {!review.replied && (
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(review.id)}>
                        <Reply className="h-4 w-4 mr-2" />
                        Responder
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Flag className="h-4 w-4 mr-2" />
                      Reportar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {reviews.filter(r => !r.replied).map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {review.customer.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{review.customer}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">"{review.comment}"</p>
                <div className="mt-4">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="replied" className="space-y-4 mt-4">
          {reviews.filter(r => r.replied).map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {review.customer.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{review.customer}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"{review.comment}"</p>
                {review.reply && (
                  <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <p className="text-sm font-medium text-purple-800 mb-1">Sua resposta:</p>
                    <p className="text-sm text-purple-700">{review.reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
