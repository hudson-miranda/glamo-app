'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Calendar, Clock, MapPin, User, Share2, CalendarPlus } from 'lucide-react';
import { BookingData } from './booking-wizard';

interface StepSuccessProps {
  appointmentId: string;
  bookingData: BookingData;
  tenant: any;
}

export function StepSuccess({ appointmentId, bookingData, tenant }: StepSuccessProps) {
  const totalPrice = bookingData.services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = bookingData.services.reduce((sum, s) => sum + s.duration, 0);

  const handleAddToCalendar = () => {
    const startDate = bookingData.date!;
    const [hours, minutes] = bookingData.time!.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + totalDuration * 60000);

    const event = {
      title: `Agendamento - ${tenant.name}`,
      description: bookingData.services.map((s) => s.name).join(', '),
      location: tenant.address,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    // Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(
      endDate,
      "yyyyMMdd'T'HHmmss"
    )}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(
      event.location
    )}`;

    window.open(googleUrl, '_blank');
  };

  const handleShare = async () => {
    const text = `Agendei um horário no ${tenant.name}!\n📅 ${format(
      bookingData.date!,
      "d 'de' MMMM 'às' ",
      { locale: ptBR }
    )}${bookingData.time}\n💇 ${bookingData.services.map((s) => s.name).join(', ')}`;

    if (navigator.share) {
      await navigator.share({
        title: 'Meu agendamento',
        text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Agendamento confirmado!
          </h1>
          <p className="text-gray-500">
            Você receberá um email com os detalhes do seu agendamento
          </p>

          {/* Confirmation Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6 mt-8 text-left space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Código do agendamento:</span>
              <span className="font-mono font-semibold text-gray-900">
                #{appointmentId.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-500">{tenant.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {format(bookingData.date!, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500">às {bookingData.time}</p>
                </div>
              </div>

              {bookingData.professional && bookingData.professional.id !== 'any' && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {bookingData.professional.name}
                    </p>
                    <p className="text-sm text-gray-500">Profissional</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {bookingData.services.map((s) => s.name).join(', ')}
                  </p>
                  <p className="text-sm text-gray-500">{totalDuration} minutos</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <span className="text-gray-600">Valor total</span>
              <span className="text-xl font-bold text-fuchsia-600">
                R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleAddToCalendar}
              className="w-full py-3 border-2 border-fuchsia-500 text-fuchsia-600 font-semibold rounded-xl hover:bg-fuchsia-50 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-5 h-5" />
              Adicionar ao calendário
            </button>

            <button
              onClick={handleShare}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Compartilhar
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-8">
            Precisa alterar ou cancelar?{' '}
            <a href={`tel:${tenant.phone}`} className="text-fuchsia-600 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
