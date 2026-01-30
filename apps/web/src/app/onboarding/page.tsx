'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Loader2,
  Crown,
  Briefcase,
  Sparkles,
} from 'lucide-react';

type ProfileType = 'owner' | 'employee' | null;

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ProfileType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Verificar se usuário está autenticado
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Buscar dados do usuário
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name?.split(' ')[0] || 'Usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedType === 'owner') {
      router.push('/onboarding/create-business');
    } else if (selectedType === 'employee') {
      router.push('/onboarding/invitations');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-ruby-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent">
            Glamo
          </span>
        </Link>

        {/* Welcome */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-ruby-100 text-ruby-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Bem-vindo ao Glamo
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Olá, {userName}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Como você deseja usar o Glamo?
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Proprietário */}
          <button
            onClick={() => setSelectedType('owner')}
            className={`relative p-6 rounded-2xl border-2 transition-all text-left group ${
              selectedType === 'owner'
                ? 'border-ruby-500 bg-ruby-50 shadow-lg shadow-ruby-500/15'
                : 'border-gray-200 bg-white hover:border-ruby-300 hover:shadow-md'
            }`}
          >
            {/* Check icon */}
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              selectedType === 'owner'
                ? 'bg-ruby-500 text-white'
                : 'bg-gray-100 text-transparent'
            }`}>
              <Check className="w-4 h-4" />
            </div>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'owner'
                ? 'bg-gradient-to-br from-ruby-500 to-ruby-600 text-white'
                : 'bg-ruby-100 text-ruby-600 group-hover:bg-ruby-200'
            }`}>
              <Crown className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sou Proprietário
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Tenho ou quero criar meu próprio estabelecimento de beleza
            </p>

            <ul className="space-y-2">
              {[
                'Crie e gerencie seu negócio',
                'Adicione serviços e profissionais',
                'Controle agenda e finanças',
                'Convide funcionários',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <Check className="w-4 h-4 text-ruby-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </button>

          {/* Funcionário */}
          <button
            onClick={() => setSelectedType('employee')}
            className={`relative p-6 rounded-2xl border-2 transition-all text-left group ${
              selectedType === 'employee'
                ? 'border-ruby-500 bg-ruby-50 shadow-lg shadow-ruby-500/15'
                : 'border-gray-200 bg-white hover:border-ruby-300 hover:shadow-md'
            }`}
          >
            {/* Check icon */}
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              selectedType === 'employee'
                ? 'bg-ruby-500 text-white'
                : 'bg-gray-100 text-transparent'
            }`}>
              <Check className="w-4 h-4" />
            </div>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'employee'
                ? 'bg-gradient-to-br from-ruby-500 to-ruby-600 text-white'
                : 'bg-ruby-100 text-ruby-600 group-hover:bg-ruby-200'
            }`}>
              <Briefcase className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sou Profissional
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Trabalho em um ou mais estabelecimentos de beleza
            </p>

            <ul className="space-y-2">
              {[
                'Veja convites de estabelecimentos',
                'Gerencie sua agenda pessoal',
                'Acompanhe seus atendimentos',
                'Trabalhe em múltiplos locais',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <Check className="w-4 h-4 text-ruby-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </button>
        </div>

        {/* Info box */}
        <div className="bg-white rounded-xl p-4 mb-8 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900">Boa notícia!</strong> Você pode ter ambos os perfis. 
                Primeiro, escolha o que melhor te define agora. Você poderá adicionar o outro perfil depois.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className="w-full py-4 px-6 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Continuar
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Skip for now */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Dúvidas?{' '}
          <Link href="/" className="text-ruby-600 hover:text-ruby-700 font-medium transition-colors">
            Entre em contato
          </Link>
        </p>
      </div>
    </div>
  );
}
