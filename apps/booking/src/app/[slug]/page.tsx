'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Star,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  Heart,
  Share2,
  Check,
  Wifi,
  Car,
  Coffee,
  Wind,
} from 'lucide-react';
import { establishments, serviceCategories, professionals, reviews } from '@/lib/mock-data';
import { formatPrice, formatDuration } from '@/lib/mock-data';

type TabType = 'services' | 'professionals' | 'reviews' | 'location';

export default function EstablishmentPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [isFavorite, setIsFavorite] = useState(false);

  // Find establishment by slug
  const establishment = establishments.find((e) => e.slug === slug);

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estabelecimento não encontrado</h1>
          <p className="text-gray-600 mb-4">Verifique o endereço e tente novamente.</p>
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  const amenityIcons: Record<string, any> = {
    'Wi-Fi': Wifi,
    'Estacionamento': Car,
    'Café': Coffee,
    'Ar condicionado': Wind,
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Segunda',
      tuesday: 'Terça',
      wednesday: 'Quarta',
      thursday: 'Quinta',
      friday: 'Sexta',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    return days[day] || day;
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'services', label: 'Serviços' },
    { key: 'professionals', label: 'Profissionais' },
    { key: 'reviews', label: 'Avaliações' },
    { key: 'location', label: 'Localização' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <img
          src={establishment.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=400&fit=crop'}
          alt={establishment.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
          <button className="p-2 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Logo & Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
              {establishment.logo ? (
                <img
                  src={establishment.logo}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{establishment.name[0]}</span>
                </div>
              )}
            </div>
            <div className="text-white pb-1">
              <h1 className="text-2xl md:text-3xl font-bold drop-shadow-md">
                {establishment.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{establishment.rating}</span>
                  <span className="text-white/80">({establishment.reviewCount} avaliações)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cards */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="font-medium">{establishment.address}</p>
                    <p className="text-sm text-gray-600">{establishment.city}, {establishment.state}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">{establishment.phone}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {establishment.amenities && establishment.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {establishment.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <span
                        key={amenity}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        <Icon className="w-4 h-4" />
                        {amenity}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Sobre</h2>
              <p className="text-gray-600">{establishment.description}</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {serviceCategories.map((category) => (
                      <div key={category.id}>
                        <h3 className="font-semibold text-gray-900 mb-3">{category.name}</h3>
                        <div className="space-y-3">
                          {category.services.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                                  {service.isPopular && (
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(service.duration)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="text-right">
                                  {service.promotionalPrice ? (
                                    <>
                                      <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(service.price)}
                                      </span>
                                      <p className="font-bold text-primary">
                                        {formatPrice(service.promotionalPrice)}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="font-bold text-primary">
                                      {formatPrice(service.price)}
                                    </p>
                                  )}
                                </div>
                                <Link
                                  href={`/${slug}/booking?service=${service.id}`}
                                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  Agendar
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Professionals Tab */}
                {activeTab === 'professionals' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professionals.map((professional) => (
                      <div
                        key={professional.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          {professional.avatar ? (
                            <img
                              src={professional.avatar}
                              alt={professional.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xl font-bold text-primary">
                                {professional.name[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{professional.name}</h4>
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">{professional.rating}</span>
                                <span className="text-gray-400">
                                  ({professional.reviewCount} avaliações)
                                </span>
                              </div>
                            </div>
                            {professional.isAvailable ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Disponível
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                Indisponível
                              </span>
                            )}
                          </div>
                          {professional.bio && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {professional.bio}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {professional.specialties.slice(0, 3).map((specialty) => (
                              <span
                                key={specialty}
                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Rating Summary */}
                    <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-xl mb-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{establishment.rating}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(establishment.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {establishment.reviewCount} avaliações
                        </p>
                      </div>
                    </div>

                    {/* Reviews List */}
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                            {review.customerAvatar && (
                              <img
                                src={review.customerAvatar}
                                alt={review.customerName}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{review.customerName}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-2">{review.comment}</p>
                            {review.professionalName && (
                              <p className="text-sm text-gray-500 mt-2">
                                Atendido por: <span className="font-medium">{review.professionalName}</span>
                              </p>
                            )}
                            {review.response && (
                              <div className="mt-3 p-3 bg-white rounded-lg border-l-2 border-primary">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Resposta do estabelecimento
                                </p>
                                <p className="text-sm text-gray-600">{review.response.text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Mapa será exibido aqui</p>
                        <p className="text-sm text-gray-400">{establishment.address}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-900 mb-2">Como chegar</h4>
                      <p className="text-gray-600">{establishment.address}</p>
                      <p className="text-gray-600">{establishment.city}, {establishment.state} - {establishment.zipCode}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${establishment.address}, ${establishment.city}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary font-medium mt-3 hover:underline"
                      >
                        Abrir no Google Maps
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Book Now CTA */}
            <div className="bg-white rounded-xl p-4 shadow-sm sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Agendar Horário</h3>
              <Link
                href={`/${slug}/booking`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Agendar Agora
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Horário de Funcionamento
              </h3>
              <div className="space-y-2">
                {Object.entries(establishment.workingHours).map(([day, hours]) => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const isToday = day === today;
                  
                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm py-1 ${
                        isToday ? 'font-medium text-primary' : 'text-gray-600'
                      }`}
                    >
                      <span>{getDayName(day)}</span>
                      <span>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Fechado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Contato</h3>
              <div className="space-y-3">
                <a
                  href={`tel:${establishment.phone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-gray-700">{establishment.phone}</span>
                </a>
                <a
                  href={`https://wa.me/55${establishment.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-green-700 font-medium">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
