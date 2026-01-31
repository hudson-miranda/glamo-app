'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  MessageSquare,
  Phone,
  Mail,
  Book,
  Video,
  ChevronRight,
  ExternalLink,
  Search,
  FileText,
  Lightbulb,
  Zap,
  Settings,
  Users,
  Calendar,
  DollarSign
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

// Tipos para ajuda
interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface Guide {
  title: string;
  description: string;
  icon: typeof Zap;
  color: string;
  href: string;
}

interface Video {
  title: string;
  duration: string;
  views: string;
}

interface HelpData {
  faqs: FAQ[];
  guides: Guide[];
  videos: Video[];
}

const mockFaqs: FAQ[] = [
  {
    question: 'Como faço para agendar um serviço?',
    answer: 'Acesse o menu Agendamentos, clique em "Novo Agendamento", selecione o cliente, serviço, profissional e horário desejado.',
    category: 'agendamentos'
  },
  {
    question: 'Como cadastrar um novo cliente?',
    answer: 'Vá em Clientes > Novo Cliente e preencha as informações necessárias. Apenas nome e telefone são obrigatórios.',
    category: 'clientes'
  },
  {
    question: 'Como registrar uma venda?',
    answer: 'Acesse Financeiro > Transações ou use o botão "Nova Venda" no Dashboard. Adicione os itens, aplique desconto se necessário e finalize.',
    category: 'financeiro'
  },
  {
    question: 'Como funciona o programa de fidelidade?',
    answer: 'Configure em Marketing > Fidelidade. Você pode criar programas baseados em pontos, carimbos ou indicações.',
    category: 'marketing'
  },
  {
    question: 'Como alterar minha senha?',
    answer: 'Acesse Configurações > Minha Conta > Segurança e clique em "Alterar Senha".',
    category: 'conta'
  },
  {
    question: 'Como adicionar um novo profissional?',
    answer: 'Vá em Gestão > Profissionais > Novo Profissional. Preencha os dados e defina os serviços que ele realiza.',
    category: 'profissionais'
  },
];

const mockGuides: Guide[] = [
  {
    title: 'Primeiros Passos',
    description: 'Configure seu negócio e comece a usar o Glamo',
    icon: Zap,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    href: '#'
  },
  {
    title: 'Gestão de Agendamentos',
    description: 'Aprenda a gerenciar sua agenda de forma eficiente',
    icon: Calendar,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    href: '#'
  },
  {
    title: 'Controle Financeiro',
    description: 'Domine o fluxo de caixa e relatórios financeiros',
    icon: DollarSign,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    href: '#'
  },
  {
    title: 'Marketing e Fidelização',
    description: 'Estratégias para reter e atrair clientes',
    icon: Users,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    href: '#'
  },
];

const mockVideos: Video[] = [
  { title: 'Tour pelo Sistema', duration: '5:32', views: '1.2K' },
  { title: 'Configurando Serviços', duration: '3:45', views: '890' },
  { title: 'Relatórios e Métricas', duration: '7:18', views: '654' },
];

const mockHelpData: HelpData = {
  faqs: mockFaqs,
  guides: mockGuides,
  videos: mockVideos,
};

// Função para buscar dados de ajuda - substituir por API real
const fetchHelpData = async (): Promise<HelpData> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockHelpData;
};

export default function HelpPage() {
  // Hook de dados assíncronos com cache
  const { data: helpData, isLoading } = usePageData(
    fetchHelpData,
    { cacheKey: 'help-data', initialData: mockHelpData }
  );

  const { faqs, guides, videos } = helpData || mockHelpData;

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center max-w-2xl mx-auto">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </div>
        <Skeleton className="h-12 w-full max-w-md mx-auto rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonList rows={6} />
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="h-16 w-16 rounded-2xl bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="h-8 w-8 text-ruby-600 dark:text-ruby-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Ajuda</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Encontre respostas, tutoriais e suporte para usar o Glamo
        </p>
      </motion.div>

      {/* Search */}
      <AnimatedCard className="max-w-2xl mx-auto">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar na Central de Ajuda..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
            />
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Quick Guides */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {guides.map((guide) => (
          <StaggerItem key={guide.title}>
            <AnimatedCard className="h-full cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className={`h-12 w-12 rounded-xl ${guide.color} flex items-center justify-center mb-4`}>
                  <guide.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{guide.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{guide.description}</p>
              </CardContent>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FAQs */}
        <AnimatedCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-ruby-500" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.details
                  key={index}
                  className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                </motion.details>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              <FileText className="h-4 w-4 mr-2" />
              Ver Todas as Perguntas
            </Button>
          </CardContent>
        </AnimatedCard>

        {/* Contact & Videos */}
        <div className="space-y-6">
          {/* Video Tutorials */}
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-ruby-500" />
                Vídeos Tutoriais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videos.map((video, index) => (
                  <button
                    key={index}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                      <Video className="h-5 w-5 text-ruby-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{video.title}</p>
                      <p className="text-xs text-gray-500">{video.duration} • {video.views} views</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Contact Support */}
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-ruby-500" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full p-3 bg-ruby-50 dark:bg-ruby-950/30 rounded-xl flex items-center gap-3 hover:bg-ruby-100 dark:hover:bg-ruby-950/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-ruby-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Chat ao Vivo</p>
                  <p className="text-xs text-gray-500">Resposta em minutos</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              <button className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">E-mail</p>
                  <p className="text-xs text-gray-500">suporte@glamo.com.br</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              <button className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Telefone</p>
                  <p className="text-xs text-gray-500">(11) 4000-1234</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </motion.div>
  );
}
