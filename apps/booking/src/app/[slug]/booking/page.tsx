'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check, Clock, User, Calendar, Sparkles } from 'lucide-react';
import { ServiceSelector } from '@/components/booking/service-selector';
import { ProfessionalSelector } from '@/components/booking/professional-selector';
import { DateTimePicker } from '@/components/booking/date-time-picker';
import { BookingSummary } from '@/components/booking/booking-summary';
import { establishments, serviceCategories, professionals } from '@/lib/mock-data';
import type { Service, Professional } from '@/types';

type BookingStep = 'services' | 'professional' | 'datetime' | 'summary';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Get pre-selected service from URL if any
  const preSelectedServiceId = searchParams.get('service');

  // Find establishment
  const establishment = establishments.find((e) => e.slug === slug);

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('services');
  const [selectedServices, setSelectedServices] = useState<Service[]>(() => {
    if (preSelectedServiceId) {
      const allServices = serviceCategories.flatMap((c) => c.services);
      const preSelected = allServices.find((s) => s.id === preSelectedServiceId);
      return preSelected ? [preSelected] : [];
    }
    return [];
  });
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  // Calculate totals
  const totalDuration = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.duration, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0),
    [selectedServices]
  );

  const steps: { key: BookingStep; label: string; icon: any }[] = [
    { key: 'services', label: 'Serviços', icon: Sparkles },
    { key: 'professional', label: 'Profissional', icon: User },
    { key: 'datetime', label: 'Data e Hora', icon: Calendar },
    { key: 'summary', label: 'Resumo', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'services':
        return selectedServices.length > 0;
      case 'professional':
        return true; // Professional is optional
      case 'datetime':
        return selectedDate && selectedTime;
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    } else {
      router.push(`/${slug}`);
    }
  };

  const handleConfirm = () => {
    // Navigate to confirmation page with booking data
    const bookingData = {
      services: selectedServices.map((s) => s.id),
      professional: selectedProfessional?.id,
      date: selectedDate?.toISOString(),
      time: selectedTime,
    };
    router.push(`/${slug}/booking/confirm?data=${encodeURIComponent(JSON.stringify(bookingData))}`);
  };

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estabelecimento não encontrado</h1>
          <p className="text-gray-600 mb-4">Verifique o endereço e tente novamente.</p>
          <Link href="/" className="text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">{establishment.name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900">{establishment.name}</h1>
              <p className="text-sm text-gray-500">{establishment.address}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : isActive
                          ? 'bg-primary/10 text-primary ring-2 ring-primary'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isActive || isCompleted ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {currentStep === 'services' && (
            <ServiceSelector
              categories={serviceCategories}
              selectedServices={selectedServices}
              onSelect={setSelectedServices}
            />
          )}

          {currentStep === 'professional' && (
            <ProfessionalSelector
              professionals={professionals}
              selectedProfessional={selectedProfessional}
              onSelect={setSelectedProfessional}
            />
          )}

          {currentStep === 'datetime' && (
            <DateTimePicker
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
              duration={totalDuration}
            />
          )}

          {currentStep === 'summary' && (
            <BookingSummary
              establishment={establishment}
              services={selectedServices}
              professional={selectedProfessional}
              date={selectedDate}
              time={selectedTime}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
            />
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              {selectedServices.length > 0 && (
                <>
                  <p className="text-sm text-gray-500">
                    {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} • {totalDuration} min
                  </p>
                  <p className="font-bold text-primary">
                    R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
              )}
              {currentStep === 'summary' ? (
                <button
                  onClick={handleConfirm}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Confirmar Agendamento
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
