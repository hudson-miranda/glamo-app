'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Plus,
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react';
import { establishments, serviceCategories, professionals } from '@/lib/mock-data';
import { formatPrice, formatDuration } from '@/lib/mock-data';

export default function BookingSuccessPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Find establishment
  const establishment = establishments.find((e) => e.slug === slug);

  // Mock booking data (in real app, would come from API response)
  const booking = {
    id: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    services: [serviceCategories[0].services[0], serviceCategories[0].services[4]],
    professional: professionals[0],
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    time: '14:00',
    totalPrice: 14000,
    totalDuration: 105,
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(booking.date);
    const [hours, minutes] = booking.time.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + booking.totalDuration * 60000);

    const event = {
      title: `Agendamento - ${establishment?.name}`,
      description: `Serviços: ${booking.services.map((s) => s.name).join(', ')}\nProfissional: ${booking.professional.name}`,
      start: startDate.toISOString().replace(/-|:|\.\d+/g, ''),
      end: endDate.toISOString().replace(/-|:|\.\d+/g, ''),
      location: establishment?.address,
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${event.start}/${event.end}&details=${encodeURIComponent(
      event.description
    )}&location=${encodeURIComponent(event.location || '')}`;

    window.open(googleCalendarUrl, '_blank');
  };

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estabelecimento não encontrado</h1>
          <Link href="/" className="text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Agendamento Confirmado!
            </h1>
            <p className="text-gray-600">
              Seu horário foi reservado com sucesso. Enviamos os detalhes para seu e-mail.
            </p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-primary/5 p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Código do agendamento</p>
                  <p className="text-lg font-bold text-primary">{booking.id}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(booking.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Date and Time */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.date.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {booking.time} • {formatDuration(booking.totalDuration)}
                  </p>
                </div>
              </div>

              {/* Professional */}
              <div className="flex items-center gap-3">
                {booking.professional.avatar ? (
                  <img
                    src={booking.professional.avatar}
                    alt={booking.professional.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Profissional</p>
                  <p className="font-semibold text-gray-900">{booking.professional.name}</p>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Serviços</p>
                <div className="space-y-2">
                  {booking.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{service.name}</span>
                      <span className="text-gray-500">{formatDuration(service.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-medium text-gray-700">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(booking.totalPrice)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 pt-3 border-t">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{establishment.name}</p>
                  <p className="text-sm text-gray-600">{establishment.address}</p>
                  <a
                    href={`tel:${establishment.phone}`}
                    className="flex items-center gap-1 text-sm text-primary mt-1 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {establishment.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCalendar}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar ao Calendário
            </button>

            <Link
              href="/customer/appointments"
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Ver Meus Agendamentos
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href={`/${slug}`}
              className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Voltar para {establishment.name}
            </Link>
          </div>

          {/* Help Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">Precisa de ajuda?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Para remarcar ou cancelar seu agendamento, acesse "Meus Agendamentos" ou entre
              em contato diretamente com o estabelecimento.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cancelamento gratuito com 2h de antecedência</li>
              <li>• Remarcação sujeita à disponibilidade</li>
              <li>• Chegue com 10 minutos de antecedência</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
