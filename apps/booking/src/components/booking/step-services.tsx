'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Clock } from 'lucide-react';
import { bookingService } from '@/services/booking';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: {
    id: string;
    name: string;
  };
}

interface StepServicesProps {
  tenantId: string;
  selectedServices: Service[];
  onSelect: (services: Service[]) => void;
  onNext: () => void;
}

export function StepServices({ tenantId, selectedServices, onSelect, onNext }: StepServicesProps) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', tenantId],
    queryFn: () => bookingService.getServices(tenantId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories', tenantId],
    queryFn: () => bookingService.getServiceCategories(tenantId),
  });

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      onSelect(selectedServices.filter((s) => s.id !== service.id));
    } else {
      onSelect([...selectedServices, service]);
    }
  };

  const groupedServices = categories.reduce((acc: any, category: any) => {
    acc[category.id] = {
      name: category.name,
      services: services.filter((s: Service) => s.category?.id === category.id),
    };
    return acc;
  }, {});

  const uncategorizedServices = services.filter((s: Service) => !s.category);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Escolha os serviços</h2>
        <p className="text-gray-500 mt-1">Selecione um ou mais serviços desejados</p>
      </div>

      {Object.entries(groupedServices).map(([categoryId, group]: [string, any]) => (
        <div key={categoryId}>
          <h3 className="font-semibold text-gray-700 mb-3">{group.name}</h3>
          <div className="space-y-3">
            {group.services.map((service: Service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-fuchsia-500 bg-fuchsia-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-fuchsia-600">
                        R$ {(service.price / 100).toFixed(2).replace('.', ',')}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-fuchsia-500 border-fuchsia-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {uncategorizedServices.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Outros serviços</h3>
          <div className="space-y-3">
            {uncategorizedServices.map((service: Service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-fuchsia-500 bg-fuchsia-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-fuchsia-600">
                        R$ {(service.price / 100).toFixed(2).replace('.', ',')}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-fuchsia-500 border-fuchsia-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={selectedServices.length === 0}
        className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continuar
      </button>
    </div>
  );
}
