'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ArrowLeft, 
  Check,
  Zap,
  Crown,
  Building2,
  Calendar,
  Users,
  BarChart3,
  Gift,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/page-transition';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: 'mês',
    description: 'Ideal para profissionais autônomos',
    icon: Zap,
    color: 'blue',
    features: [
      '1 Profissional',
      'Até 100 agendamentos/mês',
      'Agendamento online',
      'Gestão de clientes',
      'Relatórios básicos',
    ],
    current: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    period: 'mês',
    description: 'Para salões em crescimento',
    icon: Crown,
    color: 'ruby',
    popular: true,
    features: [
      'Até 5 Profissionais',
      'Agendamentos ilimitados',
      'Programa de fidelidade',
      'Marketing por SMS/Email',
      'Relatórios avançados',
      'Controle de estoque',
      'Suporte prioritário',
    ],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    period: 'mês',
    description: 'Para redes e franquias',
    icon: Building2,
    color: 'purple',
    features: [
      'Profissionais ilimitados',
      'Múltiplas unidades',
      'API personalizada',
      'Integração personalizada',
      'Gerente de conta dedicado',
      'SLA 99.9%',
      'Treinamento in-loco',
    ],
    current: false,
  },
];

const currentPlan = {
  name: 'Professional',
  startDate: '15/01/2026',
  nextBilling: '15/02/2026',
  status: 'active',
};

const usage = [
  { name: 'Profissionais', current: 3, max: 5, icon: Users },
  { name: 'Agendamentos (mês)', current: 234, max: null, icon: Calendar },
  { name: 'Clientes ativos', current: 156, max: null, icon: Users },
  { name: 'Relatórios gerados', current: 12, max: null, icon: BarChart3 },
];

export default function SubscriptionSettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plano e Assinatura</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie seu plano e informações de pagamento
          </p>
        </div>
      </motion.div>

      {/* Current Plan */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-ruby-500" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-ruby-500 to-ruby-600 rounded-2xl text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5" />
                <span className="font-bold text-lg">{currentPlan.name}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">Ativo</span>
              </div>
              <p className="text-ruby-100 text-sm">
                Assinatura desde {currentPlan.startDate}
              </p>
            </div>
            <div className="text-right">
              <p className="text-ruby-100 text-sm">Próxima cobrança</p>
              <p className="font-bold text-lg">{currentPlan.nextBilling}</p>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Usage */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ruby-500" />
            Uso do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {usage.map((item) => (
              <div key={item.name} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.current}</span>
                  {item.max && (
                    <span className="text-gray-500">/ {item.max}</span>
                  )}
                </div>
                {item.max && (
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-ruby-500 rounded-full transition-all"
                      style={{ width: `${(item.current / item.max) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Planos Disponíveis</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-ruby-500 text-white text-xs font-bold rounded-full">
                  Mais Popular
                </div>
              )}
              <Card className={`h-full ${plan.current ? 'border-ruby-500 border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${
                    plan.color === 'ruby' ? 'bg-ruby-100 dark:bg-ruby-900/30' :
                    plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <plan.icon className={`h-6 w-6 ${
                      plan.color === 'ruby' ? 'text-ruby-600' :
                      plan.color === 'blue' ? 'text-blue-600' :
                      'text-purple-600'
                    }`} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">R${plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.current ? (
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button className={`w-full ${
                      plan.color === 'ruby' ? 'bg-ruby-600 hover:bg-ruby-700' :
                      plan.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}>
                      {plan.price > 99 ? 'Falar com Vendas' : 'Fazer Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <AnimatedCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-ruby-500" />
              Método de Pagamento
            </CardTitle>
            <Button variant="outline" size="sm">
              Alterar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="h-12 w-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4532</p>
              <p className="text-sm text-gray-500">Expira em 12/2028</p>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Cancel */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30">
          Cancelar Assinatura
        </Button>
      </div>
    </div>
  );
}
