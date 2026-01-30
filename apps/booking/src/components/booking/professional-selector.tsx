'use client';

import { Star, Check } from 'lucide-react';
import type { Professional } from '@/types';

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessional?: Professional;
  onSelect: (professional: Professional | undefined) => void;
}

export function ProfessionalSelector({
  professionals,
  selectedProfessional,
  onSelect,
}: ProfessionalSelectorProps) {
  const availableProfessionals = professionals.filter((p) => p.isAvailable);
  const unavailableProfessionals = professionals.filter((p) => !p.isAvailable);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Escolha o profissional</h2>
        <p className="text-gray-500 mt-1">Selecione quem vai te atender (opcional)</p>
      </div>

      {/* Any Professional Option */}
      <button
        onClick={() => onSelect(undefined)}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
          !selectedProfessional
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-2xl">🎲</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Sem preferência</h4>
              <p className="text-sm text-gray-500">Qualquer profissional disponível</p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              !selectedProfessional
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300'
            }`}
          >
            {!selectedProfessional && <Check className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Available Professionals */}
      {availableProfessionals.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            Disponíveis
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {availableProfessionals.length}
            </span>
          </h3>
          <div className="space-y-3">
            {availableProfessionals.map((professional) => {
              const isSelected = selectedProfessional?.id === professional.id;
              return (
                <button
                  key={professional.id}
                  onClick={() => onSelect(professional)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                        {professional.avatar ? (
                          <img
                            src={professional.avatar}
                            alt={professional.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">
                              {professional.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{professional.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {professional.rating}
                          </span>
                          <span className="text-sm text-gray-400">
                            ({professional.reviewCount} avaliações)
                          </span>
                        </div>
                        {professional.bio && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {professional.bio}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {professional.specialties.slice(0, 3).map((specialty) => (
                            <span
                              key={specialty}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
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
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Unavailable Professionals */}
      {unavailableProfessionals.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-400 mb-3 flex items-center gap-2">
            Indisponíveis
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              {unavailableProfessionals.length}
            </span>
          </h3>
          <div className="space-y-3 opacity-60">
            {unavailableProfessionals.map((professional) => (
              <div
                key={professional.id}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 grayscale">
                    {professional.avatar ? (
                      <img
                        src={professional.avatar}
                        alt={professional.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-400">
                          {professional.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-500">{professional.name}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">Não disponível no momento</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
