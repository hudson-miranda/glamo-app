'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Gift,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// ============== LOGO COMPONENT ==============
function GlamoLogo({ variant = 'default' }: { variant?: 'default' | 'white' }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25">
        <span className="text-white font-bold text-xl">G</span>
      </div>
      <span className={`text-2xl font-bold ${variant === 'white' ? 'text-white' : 'bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent'}`}>
        Glamo
      </span>
    </Link>
  );
}

// ============== NAVBAR ==============
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <GlamoLogo />

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 dark:hover:text-ruby-400 transition-colors font-medium">Recursos</a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 dark:hover:text-ruby-400 transition-colors font-medium">Planos</a>
            <a href="#testimonials" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 dark:hover:text-ruby-400 transition-colors font-medium">Depoimentos</a>
            <a href="#faq" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 dark:hover:text-ruby-400 transition-colors font-medium">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle variant="compact" />
            <Link href="/login" className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:text-ruby-600 dark:hover:text-ruby-400 transition-colors font-medium">
              Entrar
            </Link>
            <Link href="/register" className="px-6 py-2.5 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 hover:shadow-xl hover:shadow-ruby-600/30">
              Começar Grátis
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-6 border-t dark:border-gray-800 bg-white dark:bg-gray-900 absolute left-0 right-0 top-20 shadow-lg">
            <div className="container mx-auto px-4 flex flex-col gap-4">
              <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 py-2 font-medium">Recursos</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 py-2 font-medium">Planos</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 py-2 font-medium">Depoimentos</a>
              <a href="#faq" className="text-gray-600 dark:text-gray-400 hover:text-ruby-600 py-2 font-medium">FAQ</a>
              <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tema</span>
                <ThemeToggle variant="compact" />
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t dark:border-gray-800 mt-2">
                <Link href="/login" className="text-center py-3 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700">Entrar</Link>
                <Link href="/register" className="text-center py-3 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold">
                  Começar Grátis
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ============== HERO SECTION ==============
function HeroSection() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 overflow-hidden relative">
      <div className="absolute top-20 right-0 w-96 h-96 bg-ruby-100 dark:bg-ruby-900/30 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-ruby-50 dark:bg-ruby-950/40 rounded-full blur-3xl opacity-60" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-ruby-50 dark:bg-ruby-950/50 text-ruby-700 dark:text-ruby-400 rounded-full text-sm font-medium mb-8 border border-ruby-100 dark:border-ruby-900/50">
              <Sparkles className="w-4 h-4" />
              Plataforma #1 para Beleza e Estética
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Gerencie seu{' '}
              <span className="bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent">
                negócio de beleza
              </span>{' '}
              com excelência
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Agendamento online, gestão de clientes, controle financeiro, marketing e muito mais. 
              Tudo em uma única plataforma elegante e profissional.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 hover:shadow-xl hover:shadow-ruby-600/30 flex items-center justify-center gap-2">
                Teste Grátis por 14 Dias
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#demo" className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-ruby-200 dark:hover:border-ruby-800 hover:text-ruby-600 dark:hover:text-ruby-400 transition-all flex items-center justify-center gap-2 shadow-sm">
                Ver Demonstração
              </a>
            </div>
            
            <div className="flex gap-10 mt-14 justify-center lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">5.000+</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Salões Ativos</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">1M+</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Agendamentos/mês</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1 justify-center lg:justify-start">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">4.9</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Avaliação</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
                <div className="w-3 h-3 rounded-full bg-ruby-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="ml-4 text-xs text-gray-400 font-medium">Dashboard Glamo</span>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-ruby-50 to-white dark:from-ruby-950/50 dark:to-gray-800 p-4 rounded-xl border border-ruby-100 dark:border-ruby-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-ruby-600 dark:text-ruby-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hoje</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Agendamentos</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-gray-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Receita</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ 4.850</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+12% vs ontem</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Próximos Agendamentos</div>
                  {[
                    { time: '09:00', name: 'Maria Silva', service: 'Corte + Escova' },
                    { time: '10:30', name: 'Ana Costa', service: 'Coloração' },
                    { time: '14:00', name: 'Julia Santos', service: 'Manicure' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div className="text-sm font-semibold text-ruby-600 dark:text-ruby-400 w-14">{item.time}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.service}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-ruby-200 to-ruby-100 dark:from-ruby-900/40 dark:to-ruby-950/30 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-br from-ruby-100 to-ruby-50 dark:from-ruby-950/40 dark:to-ruby-900/20 rounded-full blur-3xl opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============== FEATURES SECTION ==============
const features = [
  { icon: Calendar, title: 'Agendamento Inteligente', description: 'Agenda online 24/7 com confirmação automática, lembretes por WhatsApp e gestão de lista de espera.', color: 'ruby' },
  { icon: Users, title: 'CRM Completo', description: 'Histórico de clientes, preferências, aniversários, programa de fidelidade e segmentação avançada.', color: 'violet' },
  { icon: CreditCard, title: 'Financeiro Integrado', description: 'Controle de caixa, comissões automáticas, cobranças via PIX e relatórios detalhados.', color: 'emerald' },
  { icon: BarChart3, title: 'Analytics & BI', description: 'Dashboards em tempo real, insights com IA, previsão de demanda e comparativos.', color: 'blue' },
  { icon: MessageSquare, title: 'Marketing Automático', description: 'Campanhas por WhatsApp, SMS, email marketing, cupons e promoções inteligentes.', color: 'amber' },
  { icon: Gift, title: 'Programa de Fidelidade', description: 'Sistema de pontos, cashback, níveis VIP e recompensas para engajar seus clientes.', color: 'pink' },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  ruby: { bg: 'bg-ruby-50 dark:bg-ruby-950/50', icon: 'text-ruby-600 dark:text-ruby-400', border: 'border-ruby-100 dark:border-ruby-900/50' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/50', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/50' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/50', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950/50', icon: 'text-pink-600 dark:text-pink-400', border: 'border-pink-100 dark:border-pink-900/50' },
};

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-ruby-600 dark:text-ruby-400 font-semibold text-sm uppercase tracking-wider">Recursos</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Módulos integrados que trabalham juntos para automatizar e elevar seu negócio
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors = colorClasses[feature.color];
            return (
              <div key={index} className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-ruby-200 dark:hover:border-ruby-800 hover:shadow-xl hover:shadow-ruby-500/5 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-5`}>
                  <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-8 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">E muito mais...</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Controle de Estoque', 'Multi-Unidades', 'App para Profissionais', 'Relatórios Detalhados', 'Notas Fiscais', 'Gestão de Equipe', 'Assinatura Digital', 'API para Integrações'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                <div className="w-5 h-5 rounded-full bg-ruby-100 dark:bg-ruby-900/50 flex items-center justify-center">
                  <Check className="w-3 h-3 text-ruby-600 dark:text-ruby-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============== PRICING SECTION ==============
const plans = [
  { name: 'Starter', description: 'Perfeito para profissionais autônomos', price: 79, features: ['1 profissional', '100 clientes', '200 agendamentos/mês', 'Agendamento online', 'Lembretes por WhatsApp', 'Controle financeiro básico'], popular: false },
  { name: 'Professional', description: 'Ideal para pequenos salões', price: 149, features: ['Até 5 profissionais', 'Clientes ilimitados', 'Agendamentos ilimitados', 'CRM avançado', 'Comissões automáticas', 'Marketing por WhatsApp', 'Relatórios detalhados'], popular: true },
  { name: 'Business', description: 'Para salões em crescimento', price: 299, features: ['Até 15 profissionais', 'Multi-unidades', 'Estoque completo', 'Analytics avançado', 'Programa de fidelidade', 'API para integrações', 'Suporte prioritário'], popular: false },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-ruby-600 dark:text-ruby-400 font-semibold text-sm uppercase tracking-wider">Planos</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">Planos para todos os tamanhos</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Todos incluem 14 dias de teste grátis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl ${plan.popular ? 'ring-2 ring-ruby-500 shadow-xl shadow-ruby-500/10 scale-105' : 'border border-gray-200 dark:border-gray-700 shadow-sm'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white text-sm font-semibold rounded-full shadow-lg">
                    Mais Popular
                  </div>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">R$ {plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-ruby-100 dark:bg-ruby-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-ruby-600 dark:text-ruby-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`w-full block text-center py-3.5 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-ruby-600 to-ruby-700 text-white hover:from-ruby-700 hover:to-ruby-800 shadow-lg shadow-ruby-500/25' : 'border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-ruby-300 dark:hover:border-ruby-700 hover:text-ruby-600 dark:hover:text-ruby-400'}`}>
                Começar Grátis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============== TESTIMONIALS SECTION ==============
const testimonials = [
  { name: 'Carla Mendes', role: 'Proprietária - Studio Carla', content: 'O Glamo transformou meu salão! Antes eu perdia horas com agenda de papel, agora tudo é automático. Meus clientes adoram agendar pelo WhatsApp.', rating: 5 },
  { name: 'Roberto Silva', role: 'Gerente - Barbearia Old School', content: 'A gestão de comissões era um pesadelo. Com o Glamo, tudo é calculado automaticamente. Meus barbeiros confiam nos números e eu economizo tempo.', rating: 5 },
  { name: 'Ana Paula Ferreira', role: 'CEO - Rede Beleza Total', content: 'Gerenciar 8 unidades nunca foi tão fácil. Os relatórios em tempo real me dão visão completa do negócio. Recomendo para qualquer rede!', rating: 5 },
];

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-ruby-600 dark:text-ruby-400 font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">Amado por milhares de profissionais</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Veja o que nossos clientes dizem sobre o Glamo</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-900/5 dark:hover:shadow-black/20 transition-all duration-300">
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">"{testimonial.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center text-white font-bold shadow-lg shadow-ruby-500/25">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============== FAQ SECTION ==============
const faqs = [
  { question: 'Posso testar grátis antes de assinar?', answer: 'Sim! Todos os planos incluem 14 dias de teste grátis com acesso a todas as funcionalidades. Não pedimos cartão de crédito para testar.' },
  { question: 'Como funciona o agendamento online?', answer: 'Seus clientes podem agendar 24/7 pelo link personalizado do seu salão, ou diretamente pelo WhatsApp. Eles recebem confirmação automática e lembretes.' },
  { question: 'Consigo migrar meus dados de outro sistema?', answer: 'Sim! Nossa equipe ajuda na migração de clientes, histórico e dados do seu sistema anterior sem custo adicional.' },
  { question: 'Funciona offline?', answer: 'O app para profissionais funciona offline. Você pode registrar atendimentos sem internet e sincronizar depois.' },
  { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, sem multas ou taxas de cancelamento. Você pode exportar todos os seus dados quando quiser.' },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-ruby-600 dark:text-ruby-400 font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">Perguntas Frequentes</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <button className="w-full p-6 text-left flex items-center justify-between" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-48' : 'max-h-0'}`}>
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============== CTA SECTION ==============
function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-ruby-600 via-ruby-700 to-ruby-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 text-center relative">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para transformar seu negócio?</h2>
        <p className="text-lg text-ruby-100 mb-10 max-w-2xl mx-auto">
          Junte-se a milhares de profissionais que já automatizaram sua gestão com o Glamo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="px-8 py-4 bg-white text-ruby-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-xl">
            Começar Grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
            <MessageSquare className="w-5 h-5" />
            Falar pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

// ============== FOOTER ==============
function Footer() {
  return (
    <footer className="py-16 bg-gray-900 text-gray-400">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-2xl font-bold text-white">Glamo</span>
            </div>
            <p className="text-sm leading-relaxed">
              A plataforma completa para gestão de salões de beleza, barbearias e clínicas de estética.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-5">Produto</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Planos</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Entrar</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Criar Conta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-5">Empresa</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/about" className="hover:text-white transition-colors">Sobre</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="/careers" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacidade</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="/lgpd" className="hover:text-white transition-colors">LGPD</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 Glamo. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors text-sm">Instagram</a>
            <a href="#" className="hover:text-white transition-colors text-sm">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors text-sm">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============== MAIN PAGE ==============
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-3xl">G</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
