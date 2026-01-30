'use client';

import { Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/mock-data';
import type { Service, Professional, Establishment } from '@/types';

interface BookingSummaryProps {
  establishment: Establishment;
  services: Service[];
  professional?: Professional;
  date?: Date;
  time?: string;
  totalDuration: number;
  totalPrice: number;
}

export function BookingSummary({
  establishment,
  services,
  professional,
  date,
  time,
  totalDuration,
  totalPrice,
}: BookingSummaryProps) {
  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Resumo do Agendamento</h2>
        <p className="text-gray-500 mt-1">Confira os detalhes antes de confirmar</p>
      </div>

      {/* Date and Time */}
      {date && time && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {date.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-gray-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                às {time} • Duração: {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Professional */}
      <div className="bg-white rounded-xl p-4 border">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Profissional</h3>
        {professional ? (
          <div className="flex items-center gap-3">
            {professional.avatar ? (
              <img
                src={professional.avatar}
                alt={professional.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{professional.name}</p>
              <p className="text-sm text-gray-500">
                {professional.specialties.slice(0, 2).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xl">🎲</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Sem preferência</p>
              <p className="text-sm text-gray-500">Qualquer profissional disponível</p>
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl p-4 border">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Serviços ({services.length})
        </h3>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-500">{formatDuration(service.duration)}</p>
              </div>
              <div className="text-right">
                {service.promotionalPrice ? (
                  <>
                    <span className="text-sm text-gray-400 line-through block">
                      {formatPrice(service.price)}
                    </span>
                    <span className="font-semibold text-primary">
                      {formatPrice(service.promotionalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-primary">
                    {formatPrice(service.price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Total</p>
            <p className="text-sm text-gray-500">Duração: {formatDuration(totalDuration)}</p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl p-4 border">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Local</h3>
        <div className="flex items-start gap-3">
          {establishment.logo ? (
            <img
              src={establishment.logo}
              alt={establishment.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {establishment.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{establishment.name}</p>
            <p className="text-sm text-gray-500 flex items-start gap-1 mt-1">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {establishment.address}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {establishment.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-700">
          <strong>💳 Pagamento no local:</strong> O pagamento será realizado diretamente no
          estabelecimento após o atendimento. Formas de pagamento aceitas: dinheiro,
          cartão de crédito/débito e PIX.
        </p>
      </div>

      {/* Cancellation Policy */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          Ao confirmar, você concorda com os{' '}
          <a href="#" className="text-primary hover:underline">
            termos de uso
          </a>{' '}
          e a{' '}
          <a href="#" className="text-primary hover:underline">
            política de cancelamento
          </a>
        </p>
      </div>
    </div>
  );
}
