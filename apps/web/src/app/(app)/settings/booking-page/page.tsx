'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion } from 'framer-motion';
import { 
  Globe, 
  ArrowLeft, 
  Save,
  Eye,
  Copy,
  ExternalLink,
  Palette,
  Image,
  Type,
  Layout
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';
import { useAuthStore } from '@/stores';

// Tipo para configurações da página de agendamento
interface BookingPageSettings {
  slug: string;
  title: string;
  description: string;
  primaryColor: string;
  showLogo: boolean;
  showDescription: boolean;
  showPrices: boolean;
  requirePhone: boolean;
  requireEmail: boolean;
  allowNotes: boolean;
}

// Função para buscar configurações da página de agendamento
const fetchBookingPageSettings = async (tenantSlug: string): Promise<BookingPageSettings> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    slug: tenantSlug || 'meunegocio',
    title: 'Agende seu horário',
    description: 'Escolha o serviço e horário de sua preferência',
    primaryColor: '#e11d48',
    showLogo: true,
    showDescription: true,
    showPrices: true,
    requirePhone: true,
    requireEmail: false,
    allowNotes: true,
  };
};

export default function BookingPageSettingsPage() {
  const router = useRouter();
  const { tenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const bookingUrl = `https://glamo.app/${tenant?.slug || 'meunegocio'}`;

  // Hook de dados assíncronos com cache
  const { data: initialSettings, isLoading: pageLoading } = usePageData(
    () => fetchBookingPageSettings(tenant?.slug || 'meunegocio'),
    { cacheKey: `booking-page-settings-${tenant?.slug}`, initialData: {
      slug: tenant?.slug || 'meunegocio',
      title: 'Agende seu horário',
      description: 'Escolha o serviço e horário de sua preferência',
      primaryColor: '#e11d48',
      showLogo: true,
      showDescription: true,
      showPrices: true,
      requirePhone: true,
      requireEmail: false,
      allowNotes: true,
    }}
  );

  const [settings, setSettings] = useState(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  if (pageLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </motion.div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Página de Agendamento</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Personalize sua página pública de agendamento
          </p>
        </div>
      </motion.div>

      {/* URL Preview */}
      <AnimatedCard>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-ruby-600 dark:text-ruby-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Sua página de agendamento</p>
                <p className="font-medium text-gray-900 dark:text-white truncate">{bookingUrl}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Settings */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-ruby-500" />
              Endereço da Página
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Personalizada
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-gray-500">
                  glamo.app/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={settings.slug}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-r-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Use apenas letras, números e hífens</p>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Content */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-ruby-500" />
              Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título
              </label>
              <input
                type="text"
                name="title"
                value={settings.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={settings.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500 resize-none"
              />
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Appearance */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-ruby-500" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cor Principal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={settings.primaryColor}
                  onChange={handleChange}
                  className="h-10 w-16 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                />
              </div>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Display Options */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-ruby-500" />
              Opções de Exibição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { name: 'showLogo', label: 'Exibir logo do negócio' },
                { name: 'showDescription', label: 'Exibir descrição' },
                { name: 'showPrices', label: 'Exibir preços dos serviços' },
                { name: 'requirePhone', label: 'Telefone obrigatório' },
                { name: 'requireEmail', label: 'E-mail obrigatório' },
                { name: 'allowNotes', label: 'Permitir observações do cliente' },
              ].map((option) => (
                <div key={option.name} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={option.name}
                    name={option.name}
                    checked={settings[option.name as keyof typeof settings] as boolean}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-ruby-600 focus:ring-ruby-500"
                  />
                  <label htmlFor={option.name} className="text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-ruby-600 hover:bg-ruby-700" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
