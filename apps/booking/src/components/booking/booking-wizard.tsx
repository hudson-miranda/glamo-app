'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Clock, User, Calendar, Sparkles } from 'lucide-react';
import { StepServices } from '@/components/booking/step-services';
import { StepProfessional } from '@/components/booking/step-professional';
import { StepDateTime } from '@/components/booking/step-datetime';
import { StepConfirm } from '@/components/booking/step-confirm';
import { StepSuccess } from '@/components/booking/step-success';
import { bookingService } from '@/services/booking';

export type BookingStep = 'services' | 'professional' | 'datetime' | 'confirm' | 'success';

export interface BookingData {
  tenantId: string;
  tenantSlug: string;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
  professional?: {
    id: string;
    name: string;
    avatar?: string;
  };
  date?: Date;
  time?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: string;
}

interface BookingWizardProps {
  tenantSlug: string;
}

export function BookingWizard({ tenantSlug }: BookingWizardProps) {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<BookingStep>('services');
  const [bookingData, setBookingData] = useState<BookingData>({
    tenantId: '',
    tenantSlug,
    services: [],
  });
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => bookingService.getTenantBySlug(tenantSlug),
  });

  const steps: { key: BookingStep; label: string; icon: any }[] = [
    { key: 'services', label: 'Serviços', icon: Sparkles },
    { key: 'professional', label: 'Profissional', icon: User },
    { key: 'datetime', label: 'Data e Hora', icon: Calendar },
    { key: 'confirm', label: 'Confirmar', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

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
    }
  };

  const handleBookingComplete = (id: string) => {
    setAppointmentId(id);
    setCurrentStep('success');
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Salão não encontrado</h1>
          <p className="text-gray-600 mt-2">Verifique o endereço e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return <StepSuccess appointmentId={appointmentId!} bookingData={bookingData} tenant={tenant} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{tenant.name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-500">{tenant.address}</p>
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
                          ? 'bg-fuchsia-500 text-white'
                          : isActive
                          ? 'bg-fuchsia-100 text-fuchsia-600 ring-2 ring-fuchsia-500'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isActive || isCompleted ? 'text-fuchsia-600' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-fuchsia-500' : 'bg-gray-200'
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
            <StepServices
              tenantId={tenant.id}
              selectedServices={bookingData.services}
              onSelect={(services) => updateBookingData({ services, tenantId: tenant.id })}
              onNext={handleNext}
            />
          )}

          {currentStep === 'professional' && (
            <StepProfessional
              tenantId={tenant.id}
              serviceIds={bookingData.services.map((s) => s.id)}
              selectedProfessional={bookingData.professional}
              onSelect={(professional) => updateBookingData({ professional })}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 'datetime' && (
            <StepDateTime
              tenantId={tenant.id}
              professionalId={bookingData.professional?.id}
              duration={bookingData.services.reduce((sum, s) => sum + s.duration, 0)}
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              onSelect={(date, time) => updateBookingData({ date, time })}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 'confirm' && (
            <StepConfirm
              bookingData={bookingData}
              tenant={tenant}
              onConfirm={handleBookingComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </main>

      {/* Summary Footer */}
      {bookingData.services.length > 0 && currentStep !== 'confirm' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {bookingData.services.length} serviço(s) selecionado(s)
                </p>
                <p className="font-bold text-lg">
                  R$ {(bookingData.services.reduce((sum, s) => sum + s.price, 0) / 100).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {bookingData.services.reduce((sum, s) => sum + s.duration, 0)} min
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
