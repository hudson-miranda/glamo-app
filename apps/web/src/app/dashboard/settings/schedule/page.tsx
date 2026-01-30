'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  ArrowLeft, 
  Save,
  Plus,
  Trash2,
  Copy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/page-transition';

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface DaySchedule {
  enabled: boolean;
  periods: { start: string; end: string }[];
}

type Schedule = Record<string, DaySchedule>;

const defaultSchedule: Schedule = {
  monday: { enabled: true, periods: [{ start: '09:00', end: '18:00' }] },
  tuesday: { enabled: true, periods: [{ start: '09:00', end: '18:00' }] },
  wednesday: { enabled: true, periods: [{ start: '09:00', end: '18:00' }] },
  thursday: { enabled: true, periods: [{ start: '09:00', end: '18:00' }] },
  friday: { enabled: true, periods: [{ start: '09:00', end: '18:00' }] },
  saturday: { enabled: true, periods: [{ start: '09:00', end: '14:00' }] },
  sunday: { enabled: false, periods: [] },
};

export default function ScheduleSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);

  const toggleDay = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
        periods: !prev[dayKey].enabled ? [{ start: '09:00', end: '18:00' }] : prev[dayKey].periods
      }
    }));
  };

  const updatePeriod = (dayKey: string, periodIndex: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        periods: prev[dayKey].periods.map((p, i) => 
          i === periodIndex ? { ...p, [field]: value } : p
        )
      }
    }));
  };

  const addPeriod = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        periods: [...prev[dayKey].periods, { start: '14:00', end: '18:00' }]
      }
    }));
  };

  const removePeriod = (dayKey: string, periodIndex: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        periods: prev[dayKey].periods.filter((_, i) => i !== periodIndex)
      }
    }));
  };

  const copyToAll = (fromDayKey: string) => {
    const sourcePeriods = schedule[fromDayKey].periods;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      daysOfWeek.forEach(day => {
        if (day.key !== fromDayKey && newSchedule[day.key].enabled) {
          newSchedule[day.key] = {
            ...newSchedule[day.key],
            periods: [...sourcePeriods]
          };
        }
      });
      return newSchedule;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Horário de Funcionamento</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure os dias e horários de atendimento
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-ruby-500" />
              Horários por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div
                key={day.key}
                className={`p-4 rounded-xl border transition-colors ${
                  schedule[day.key].enabled
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={schedule[day.key].enabled}
                      onChange={() => toggleDay(day.key)}
                      className="h-4 w-4 rounded border-gray-300 text-ruby-600 focus:ring-ruby-500"
                    />
                    <span className={`font-medium ${
                      schedule[day.key].enabled 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {day.label}
                    </span>
                  </div>
                  {schedule[day.key].enabled && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAll(day.key)}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar para todos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addPeriod(day.key)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar período
                      </Button>
                    </div>
                  )}
                </div>

                {schedule[day.key].enabled && (
                  <div className="space-y-2 pl-7">
                    {schedule[day.key].periods.map((period, periodIndex) => (
                      <div key={periodIndex} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={period.start}
                          onChange={(e) => updatePeriod(day.key, periodIndex, 'start', e.target.value)}
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                        />
                        <span className="text-gray-500">até</span>
                        <input
                          type="time"
                          value={period.end}
                          onChange={(e) => updatePeriod(day.key, periodIndex, 'end', e.target.value)}
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                        />
                        {schedule[day.key].periods.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePeriod(day.key, periodIndex)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!schedule[day.key].enabled && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">Fechado</p>
                )}
              </div>
            ))}
          </CardContent>
        </AnimatedCard>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-ruby-600 hover:bg-ruby-700" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
