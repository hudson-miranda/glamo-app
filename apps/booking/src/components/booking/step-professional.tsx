'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, ChevronLeft } from 'lucide-react';
import { bookingService } from '@/services/booking';

interface Professional {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
}

interface StepProfessionalProps {
  tenantId: string;
  serviceIds: string[];
  selectedProfessional?: Professional;
  onSelect: (professional: Professional) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepProfessional({
  tenantId,
  serviceIds,
  selectedProfessional,
  onSelect,
  onNext,
  onBack,
}: StepProfessionalProps) {
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', tenantId, serviceIds],
    queryFn: () => bookingService.getProfessionals(tenantId, serviceIds),
  });

  const handleSelect = (professional: Professional) => {
    onSelect(professional);
  };

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
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Voltar</span>
      </button>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Escolha o profissional</h2>
        <p className="text-gray-500 mt-1">Selecione quem irá atendê-lo</p>
      </div>

      {/* Qualquer profissional */}
      <button
        onClick={() => handleSelect({ id: 'any', name: 'Qualquer profissional' })}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
          selectedProfessional?.id === 'any'
            ? 'border-fuchsia-500 bg-fuchsia-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-xl">?</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Sem preferência</h4>
            <p className="text-sm text-gray-500">Qualquer profissional disponível</p>
          </div>
        </div>
      </button>

      <div className="space-y-3">
        {professionals.map((professional: Professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <button
              key={professional.id}
              onClick={() => handleSelect(professional)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-fuchsia-500 bg-fuchsia-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {professional.avatar ? (
                  <img
                    src={professional.avatar}
                    alt={professional.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-fuchsia-100 flex items-center justify-center">
                    <span className="text-fuchsia-600 font-semibold text-xl">
                      {professional.name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{professional.name}</h4>
                  {professional.bio && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {professional.bio}
                    </p>
                  )}
                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {professional.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                  {professional.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">{professional.rating.toFixed(1)}</span>
                      {professional.reviewCount && (
                        <span className="text-sm text-gray-500">
                          ({professional.reviewCount} avaliações)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!selectedProfessional}
        className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continuar
      </button>
    </div>
  );
}
