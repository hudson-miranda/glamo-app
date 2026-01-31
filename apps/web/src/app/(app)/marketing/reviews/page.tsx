'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  MoreVertical,
  Reply,
  Flag,
  CheckCircle,
  AlertCircle
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

// Tipos para avaliações
interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  service: string;
  professional: string;
  date: string;
  status: 'published' | 'pending';
  response: string | null;
}

interface RatingDistribution {
  stars: number;
  count: number;
  percent: number;
}

interface ReviewsData {
  reviews: Review[];
  ratingDistribution: RatingDistribution[];
}

// Mock data
const mockReviews: Review[] = [
  {
    id: '1',
    customerName: 'Maria Silva',
    rating: 5,
    comment: 'Excelente atendimento! A profissional foi muito atenciosa e o resultado ficou incrível. Recomendo muito!',
    service: 'Corte + Escova',
    professional: 'Ana Paula',
    date: '2026-01-20',
    status: 'published',
    response: 'Obrigada pelo carinho, Maria! Ficamos muito felizes que você gostou. Esperamos te ver em breve! 💕'
  },
  {
    id: '2',
    customerName: 'Julia Santos',
    rating: 4,
    comment: 'Muito bom! O serviço foi ótimo, só achei o tempo de espera um pouco longo.',
    service: 'Manicure + Pedicure',
    professional: 'Carla Souza',
    date: '2026-01-19',
    status: 'published',
    response: null
  },
  {
    id: '3',
    customerName: 'Ana Costa',
    rating: 5,
    comment: 'Perfeito! Já é a terceira vez que venho e cada vez fico mais impressionada com a qualidade.',
    service: 'Coloração',
    professional: 'Fernanda Lima',
    date: '2026-01-18',
    status: 'published',
    response: 'Ana, é um prazer te atender sempre! Obrigada pela confiança. 🌟'
  },
  {
    id: '4',
    customerName: 'Patrícia Mendes',
    rating: 3,
    comment: 'O serviço foi bom, mas esperava mais pelo preço que paguei.',
    service: 'Tratamento Capilar',
    professional: 'Ana Paula',
    date: '2026-01-17',
    status: 'pending',
    response: null
  },
  {
    id: '5',
    customerName: 'Fernanda Alves',
    rating: 5,
    comment: 'Simplesmente maravilhoso! Ambiente super agradável e profissionais muito qualificados.',
    service: 'Design de Sobrancelhas',
    professional: 'Juliana Martins',
    date: '2026-01-16',
    status: 'published',
    response: null
  },
];

const mockRatingDistribution: RatingDistribution[] = [
  { stars: 5, count: 156, percent: 68 },
  { stars: 4, count: 52, percent: 23 },
  { stars: 3, count: 15, percent: 6 },
  { stars: 2, count: 5, percent: 2 },
  { stars: 1, count: 2, percent: 1 },
];

const mockReviewsData: ReviewsData = {
  reviews: mockReviews,
  ratingDistribution: mockRatingDistribution,
};

// Função para buscar avaliações - substituir por API real
const fetchReviewsData = async (): Promise<ReviewsData> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockReviewsData;
};

export default function ReviewsPage() {
  // Hook de dados assíncronos com cache
  const { data: reviewsData, isLoading } = usePageData(
    fetchReviewsData,
    { cacheKey: 'marketing-reviews', initialData: mockReviewsData }
  );

  const { reviews, ratingDistribution } = reviewsData || mockReviewsData;

  const stats = [
    { label: 'Avaliação Média', value: '4.8', icon: Star, extra: 'estrelas', bg: 'bg-amber-50 dark:bg-amber-950/50', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total de Avaliações', value: 230, icon: MessageSquare, bg: 'bg-blue-50 dark:bg-blue-950/50', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Taxa de Resposta', value: '92%', icon: Reply, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Satisfação', value: '96%', icon: ThumbsUp, bg: 'bg-ruby-50 dark:bg-ruby-950/50', color: 'text-ruby-600 dark:text-ruby-400' },
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
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
        </div>
        <SkeletonCard className="h-96" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Avaliações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe o feedback dos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Flag className="h-4 w-4 mr-2" />
            Moderação
          </Button>
          <Button className="bg-ruby-600 hover:bg-ruby-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar Avaliação
          </Button>
        </div>
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
                    <div className="flex items-baseline gap-1 mt-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      {stat.extra && (
                        <span className="text-sm text-gray-500">{stat.extra}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating Distribution */}
        <AnimatedCard className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-ruby-500" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.stars}
                    </span>
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.8, delay: item.stars * 0.1 }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${star <= 4 ? 'text-amber-400 fill-amber-400' : 'text-amber-400 fill-amber-400'}`}
                  />
                ))}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">4.8</p>
              <p className="text-sm text-gray-500">de 230 avaliações</p>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Recent Reviews */}
        <AnimatedCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-ruby-500" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-ruby-600 dark:text-ruby-400">
                          {review.customerName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{review.customerName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{review.service}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.status === 'pending' ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Publicada
                        </span>
                      )}
                      <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    "{review.comment}"
                  </p>

                  {review.response ? (
                    <div className="mt-3 pl-4 border-l-2 border-ruby-200 dark:border-ruby-800">
                      <p className="text-xs text-ruby-600 dark:text-ruby-400 font-medium mb-1">Sua resposta:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.response}</p>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-ruby-600 hover:text-ruby-700 hover:bg-ruby-50 dark:hover:bg-ruby-950/50">
                      <Reply className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {review.professional}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(review.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  );
}
