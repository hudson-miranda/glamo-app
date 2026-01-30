'use client';

import { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Clock,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Check,
} from 'lucide-react';
import { establishments, serviceCategories, professionals } from '@/lib/mock-data';
import { formatPrice, formatDuration } from '@/lib/mock-data';
import type { Service, Professional } from '@/types';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  acceptTerms: boolean;
  createAccount: boolean;
}

export default function BookingConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Parse booking data from URL
  const bookingDataParam = searchParams.get('data');
  let bookingData: {
    services: string[];
    professional?: string;
    date?: string;
    time?: string;
  } = { services: [] };

  try {
    if (bookingDataParam) {
      bookingData = JSON.parse(decodeURIComponent(bookingDataParam));
    }
  } catch (e) {
    console.error('Failed to parse booking data');
  }

  // Find establishment
  const establishment = establishments.find((e) => e.slug === slug);

  // Resolve services
  const allServices = serviceCategories.flatMap((c) => c.services);
  const selectedServices: Service[] = bookingData.services
    .map((id) => allServices.find((s) => s.id === id))
    .filter(Boolean) as Service[];

  // Resolve professional
  const selectedProfessional: Professional | undefined = bookingData.professional
    ? professionals.find((p) => p.id === bookingData.professional)
    : undefined;

  // Parse date
  const selectedDate = bookingData.date ? new Date(bookingData.date) : undefined;
  const selectedTime = bookingData.time;

  // Calculate totals
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0);

  // Form state
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    acceptTerms: false,
    createAccount: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Navigate to success page
    router.push(`/${slug}/booking/success`);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  if (!establishment || selectedServices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dados inválidos</h1>
          <p className="text-gray-600 mb-4">Não foi possível carregar os dados do agendamento.</p>
          <Link href={`/${slug}`} className="text-primary hover:underline">
            Voltar para o estabelecimento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Confirmar Agendamento</h1>
              <p className="text-sm text-gray-500">{establishment.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Booking Summary */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo do Agendamento</h2>

            {/* Date and Time */}
            {selectedDate && selectedTime && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">às {selectedTime}</p>
                </div>
              </div>
            )}

            {/* Professional */}
            {selectedProfessional && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {selectedProfessional.avatar ? (
                  <img
                    src={selectedProfessional.avatar}
                    alt={selectedProfessional.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Profissional</p>
                  <p className="font-medium text-gray-900">{selectedProfessional.name}</p>
                </div>
              </div>
            )}

            {/* Services */}
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Serviços selecionados</p>
              {selectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{formatDuration(service.duration)}</p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatPrice(service.promotionalPrice || service.price)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="text-sm text-gray-500">Duração: {formatDuration(totalDuration)}</p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</p>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 pt-4 mt-4 border-t">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{establishment.name}</p>
                <p className="text-sm text-gray-600">{establishment.address}</p>
                <p className="text-sm text-gray-600">
                  {establishment.city}, {establishment.state}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Seus Dados</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Digite seu nome"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhone(e.target.value) })
                }
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.phone ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Alguma informação adicional?"
                rows={3}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, createAccount: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                />
                <span className="text-sm text-gray-600">
                  Criar conta para acompanhar meus agendamentos
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptTerms: e.target.checked })
                  }
                  className={`w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5 ${
                    errors.acceptTerms ? 'border-red-500' : ''
                  }`}
                />
                <span className="text-sm text-gray-600">
                  Li e aceito os{' '}
                  <a href="#" className="text-primary hover:underline">
                    termos de uso
                  </a>{' '}
                  e a{' '}
                  <a href="#" className="text-primary hover:underline">
                    política de cancelamento
                  </a>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.acceptTerms}
                </p>
              )}
            </div>
          </form>

          {/* Cancellation Policy */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              Política de Cancelamento
            </h3>
            <p className="text-sm text-amber-700">
              Você pode cancelar ou remarcar seu agendamento com até 2 horas de antecedência
              sem custos. Cancelamentos de última hora podem estar sujeitos a cobrança de
              taxa de no-show.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Finalizar Agendamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
