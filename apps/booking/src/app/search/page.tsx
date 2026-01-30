'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Filter,
  X,
  ChevronDown,
  Map,
  Grid,
  SlidersHorizontal,
} from 'lucide-react';
import { establishments, categories } from '@/lib/mock-data';
import type { Establishment, SearchFilters } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    category: initialCategory,
    rating: undefined,
    priceRange: undefined,
    isOpen: undefined,
    sortBy: 'rating',
  });

  // Filter establishments
  const filteredEstablishments = useMemo(() => {
    let results = [...establishments];

    // Search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.categories.some((c) => c.includes(query))
      );
    }

    // Category
    if (filters.category) {
      results = results.filter((e) => e.categories.includes(filters.category!));
    }

    // Rating
    if (filters.rating) {
      results = results.filter((e) => e.rating >= filters.rating!);
    }

    // Price range
    if (filters.priceRange && filters.priceRange.length > 0) {
      results = results.filter((e) => filters.priceRange!.includes(e.priceRange));
    }

    // Is open
    if (filters.isOpen !== undefined) {
      results = results.filter((e) => e.isOpen === filters.isOpen);
    }

    // Sort
    switch (filters.sortBy) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        results.sort((a, b) => a.priceRange - b.priceRange);
        break;
      case 'popularity':
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return results;
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, query: searchQuery });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      rating: undefined,
      priceRange: undefined,
      isOpen: undefined,
      sortBy: 'rating',
    });
    setSearchQuery('');
  };

  const getPriceLabel = (priceRange: number) => {
    return '$'.repeat(priceRange);
  };

  const activeFiltersCount = [
    filters.category,
    filters.rating,
    filters.priceRange?.length,
    filters.isOpen !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, serviço ou localização..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avaliação mínima
                  </label>
                  <select
                    value={filters.rating || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Qualquer</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4">4.0+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faixa de preço
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => {
                          const current = filters.priceRange || [];
                          const newRange = current.includes(price)
                            ? current.filter((p) => p !== price)
                            : [...current, price];
                          setFilters({ ...filters, priceRange: newRange.length ? newRange : undefined });
                        }}
                        className={`flex-1 py-2 text-sm border rounded-lg transition-colors ${
                          filters.priceRange?.includes(price)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getPriceLabel(price)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open Now */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        isOpen: filters.isOpen === true ? undefined : true,
                      })
                    }
                    className={`w-full py-2 text-sm border rounded-lg transition-colors ${
                      filters.isOpen === true
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filters.isOpen === true ? '✓ ' : ''}Aberto agora
                  </button>
                </div>
              </div>

              {/* Sort & Clear */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ordenar por:</span>
                  <select
                    value={filters.sortBy || 'rating'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="rating">Melhor avaliados</option>
                    <option value="price">Menor preço</option>
                    <option value="popularity">Mais populares</option>
                  </select>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Quick Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilters({ ...filters, category: '' })}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                !filters.category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilters({ ...filters, category: cat.slug })}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  filters.category === cat.slug
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredEstablishments.length} estabelecimento{filteredEstablishments.length !== 1 ? 's' : ''} encontrado{filteredEstablishments.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstablishments.length > 0 ? (
              filteredEstablishments.map((establishment) => (
                <Link
                  key={establishment.id}
                  href={`/${establishment.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        establishment.coverImage ||
                        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop'
                      }
                      alt={establishment.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {establishment.isOpen && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                        Aberto
                      </span>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                      {getPriceLabel(establishment.priceRange)}
                    </div>
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
                        {establishment.workingHours.monday?.open} -{' '}
                        {establishment.workingHours.monday?.close}
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
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros ou buscar por outro termo
                </p>
                <button
                  onClick={clearFilters}
                  className="text-primary font-medium hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          // Map View Placeholder
          <div className="bg-gray-200 rounded-2xl h-[calc(100vh-300px)] min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Mapa com {filteredEstablishments.length} estabelecimentos
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Integração com Google Maps em desenvolvimento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
