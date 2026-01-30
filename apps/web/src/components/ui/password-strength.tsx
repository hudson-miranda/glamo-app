'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const criteria: PasswordCriteria[] = useMemo(() => [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Caractere especial (!@#$%)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = criteria.filter(c => c.met).length;
    if (metCount <= 1) return { level: 0, label: 'Muito fraca', color: 'bg-red-500' };
    if (metCount === 2) return { level: 1, label: 'Fraca', color: 'bg-orange-500' };
    if (metCount === 3) return { level: 2, label: 'Média', color: 'bg-yellow-500' };
    if (metCount === 4) return { level: 3, label: 'Forte', color: 'bg-lime-500' };
    return { level: 4, label: 'Muito forte', color: 'bg-green-500' };
  }, [criteria]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= strength.level ? strength.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${
          strength.level <= 1 ? 'text-red-600' :
          strength.level === 2 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </p>
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <ul className="space-y-1">
          {criteria.map((criterion, index) => (
            <li
              key={index}
              className={`flex items-center gap-2 text-xs transition-colors ${
                criterion.met ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {criterion.met ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              {criterion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function isPasswordStrong(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
