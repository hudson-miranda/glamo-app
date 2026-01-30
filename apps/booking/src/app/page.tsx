'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight,
  Scissors,
  Sparkles
} from 'lucide-react';
import { categories, establishments } from '@/lib/mock-data';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const featuredEstablishments = establishments.filter(e => e.isFeatured);

  const categoryIcons: Record<string, string> = {
    'cabelo': '💇',
    'barba': '🧔',
    'unhas': '💅',
    'estetica': '✨',
    'massagem': '💆',
    'maquiagem': '💄',
  };

  return (
    <div className="bg-gradient-to-b from-primary/5 to-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Agende seu horário{' '}
              <span className="text-primary">online</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Encontre os melhores salões de beleza, barbearias e spas perto de você. 
              Agende com facilidade, a qualquer hora.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Busque por salão, serviço ou profissional..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-32 py-4 text-lg border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-gray-600">Estabelecimentos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">10k+</p>
                <p className="text-gray-600">Agendamentos/mês</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">4.9</p>
                <p className="text-gray-600">Avaliação média</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Explore por categoria
            </h2>
            <p className="text-gray-600">
              Encontre o serviço perfeito para você
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.slug}`}
                className="group flex flex-col items-center p-6 bg-gray-50 rounded-2xl hover:bg-primary/10 hover:shadow-lg transition-all"
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {categoryIcons[category.slug] || '✨'}
                </span>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Establishments Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Estabelecimentos em Destaque
              </h2>
              <p className="text-gray-600">
                Os mais bem avaliados da sua região
              </p>
            </div>
            <Link
              href="/search"
              className="hidden md:flex items-center gap-1 text-primary font-medium hover:underline"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEstablishments.map((establishment) => (
              <Link
                key={establishment.id}
                href={`/${establishment.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={establishment.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop'}
                    alt={establishment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {establishment.isOpen && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Aberto
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {establishment.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="font-semibold text-primary">{establishment.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {establishment.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {establishment.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {establishment.workingHours.monday?.open} - {establishment.workingHours.monday?.close}
                    </span>
                  </div>

                  {/* Categories Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {establishment.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              Ver todos os estabelecimentos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Como funciona
            </h2>
            <p className="text-gray-600">
              Agendar nunca foi tão fácil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Busque</h3>
              <p className="text-gray-600 text-sm">
                Encontre o estabelecimento ideal pelo nome, serviço ou localização
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Escolha</h3>
              <p className="text-gray-600 text-sm">
                Selecione os serviços, profissional e horário que preferir
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Agende</h3>
              <p className="text-gray-600 text-sm">
                Confirme seu agendamento e receba lembretes automáticos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Pronto para agendar?
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Junte-se a milhares de clientes que já estão agendando online. 
            É rápido, fácil e gratuito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Explorar Estabelecimentos
            </Link>
            <Link
              href="/customer"
              className="px-8 py-3 bg-primary/20 text-white font-semibold rounded-xl border border-white/30 hover:bg-primary/30 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
