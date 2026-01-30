'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  ArrowLeft, 
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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

const themes = [
  {
    id: 'light',
    name: 'Claro',
    description: 'Tema claro para uso diurno',
    icon: Sun,
  },
  {
    id: 'dark',
    name: 'Escuro',
    description: 'Tema escuro para reduzir fadiga ocular',
    icon: Moon,
  },
  {
    id: 'system',
    name: 'Sistema',
    description: 'Segue as configurações do dispositivo',
    icon: Monitor,
  },
];

const accentColors = [
  { name: 'Ruby', value: '#e11d48', class: 'bg-ruby-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
];

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aparência</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Personalize a aparência do sistema
          </p>
        </div>
      </motion.div>

      {/* Theme Selection */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-ruby-500" />
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {themes.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme(t.id)}
                className={`relative p-4 rounded-2xl border-2 transition-colors text-left ${
                  theme === t.id
                    ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                }`}
              >
                {theme === t.id && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-ruby-500" />
                  </div>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${
                  t.id === 'light' ? 'bg-amber-100' :
                  t.id === 'dark' ? 'bg-gray-800' :
                  'bg-gradient-to-br from-amber-100 to-gray-800'
                }`}>
                  <t.icon className={`h-6 w-6 ${
                    t.id === 'light' ? 'text-amber-600' :
                    t.id === 'dark' ? 'text-gray-300' :
                    'text-gray-600'
                  }`} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Theme Preview */}
      <AnimatedCard>
        <CardHeader>
          <CardTitle>Prévia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Light Preview */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-ruby-500 flex items-center justify-center text-white font-bold">
                  G
                </div>
                <div>
                  <div className="h-3 w-24 bg-gray-900 rounded" />
                  <div className="h-2 w-16 bg-gray-300 rounded mt-1.5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-100 rounded-lg" />
                <div className="h-8 bg-ruby-50 border border-ruby-200 rounded-lg" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">Tema Claro</p>
            </div>

            {/* Dark Preview */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-ruby-500 flex items-center justify-center text-white font-bold">
                  G
                </div>
                <div>
                  <div className="h-3 w-24 bg-white rounded" />
                  <div className="h-2 w-16 bg-gray-600 rounded mt-1.5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-800 rounded-lg" />
                <div className="h-8 bg-ruby-950/50 border border-ruby-800 rounded-lg" />
                <div className="h-8 bg-gray-800 rounded-lg" />
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Tema Escuro</p>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Accent Color (Future Feature) */}
      <AnimatedCard className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cor de Destaque</CardTitle>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
              Em breve
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {accentColors.map((color) => (
              <button
                key={color.name}
                disabled
                className={`h-10 w-10 rounded-xl ${color.class} flex items-center justify-center cursor-not-allowed ${
                  color.name === 'Ruby' ? 'ring-2 ring-offset-2 ring-ruby-500' : ''
                }`}
              >
                {color.name === 'Ruby' && <Check className="h-5 w-5 text-white" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            A personalização de cores estará disponível em uma atualização futura.
          </p>
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
