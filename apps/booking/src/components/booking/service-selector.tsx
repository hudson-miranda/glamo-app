'use client';

import { Check, Clock } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/mock-data';
import type { Service, ServiceCategory } from '@/types';

interface ServiceSelectorProps {
  categories: ServiceCategory[];
  selectedServices: Service[];
  onSelect: (services: Service[]) => void;
}

export function ServiceSelector({
  categories,
  selectedServices,
  onSelect,
}: ServiceSelectorProps) {
  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      onSelect(selectedServices.filter((s) => s.id !== service.id));
    } else {
      onSelect([...selectedServices, service]);
    }
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Escolha os serviços</h2>
        <p className="text-gray-500 mt-1">Selecione um ou mais serviços desejados</p>
      </div>

      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {category.name}
            <span className="text-sm font-normal text-gray-400">
              ({category.services.length})
            </span>
          </h3>
          <div className="space-y-3">
            {category.services.map((service) => {
              const isSelected = isServiceSelected(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        {service.isPopular && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {service.promotionalPrice ? (
                          <>
                            <span className="text-sm text-gray-400 line-through block">
                              {formatPrice(service.price)}
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(service.promotionalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">
                            {formatPrice(service.price)}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-primary border-primary text-white'
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

      {selectedServices.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Selecione pelo menos um serviço para continuar
        </p>
      )}
    </div>
  );
}
