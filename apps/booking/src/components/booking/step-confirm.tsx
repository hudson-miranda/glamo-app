'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, Clock, User, Calendar, MapPin, Loader2 } from 'lucide-react';
import { BookingData } from './booking-wizard';
import { bookingService } from '@/services/booking';

const customerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface StepConfirmProps {
  bookingData: BookingData;
  tenant: any;
  onConfirm: (appointmentId: string) => void;
  onBack: () => void;
}

export function StepConfirm({ bookingData, tenant, onConfirm, onBack }: StepConfirmProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingService.createBooking(data),
    onSuccess: (response) => {
      onConfirm(response.id);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Erro ao criar agendamento');
    },
  });

  const onSubmit = (data: CustomerForm) => {
    setError(null);
    createBookingMutation.mutate({
      tenantId: bookingData.tenantId,
      serviceIds: bookingData.services.map((s) => s.id),
      professionalId: bookingData.professional?.id === 'any' ? null : bookingData.professional?.id,
      date: format(bookingData.date!, 'yyyy-MM-dd'),
      time: bookingData.time,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      notes: data.notes,
    });
  };

  const totalPrice = bookingData.services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = bookingData.services.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Voltar</span>
      </button>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Confirme seu agendamento</h2>
        <p className="text-gray-500 mt-1">Revise os detalhes e preencha seus dados</p>
      </div>

      {/* Resumo */}
      <div className="bg-white rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Resumo</h3>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{tenant.name}</p>
            <p className="text-sm text-gray-500">{tenant.address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">
              {format(bookingData.date!, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-500">às {bookingData.time}</p>
          </div>
        </div>

        {bookingData.professional && (
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{bookingData.professional.name}</p>
              <p className="text-sm text-gray-500">Profissional</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          {bookingData.services.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{service.name}</span>
                <span className="text-xs text-gray-400">({service.duration} min)</span>
              </div>
              <span className="font-medium">
                R$ {(service.price / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Duração total: {totalDuration} min</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-fuchsia-600">
              R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Seus dados</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 outline-none transition-colors"
              placeholder="Seu nome"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 outline-none transition-colors"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 outline-none transition-colors"
              placeholder="(00) 00000-0000"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 outline-none transition-colors resize-none"
              placeholder="Alguma informação adicional?"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={createBookingMutation.isPending}
          className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {createBookingMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Agendando...
            </>
          ) : (
            'Confirmar agendamento'
          )}
        </button>
      </form>
    </div>
  );
}
