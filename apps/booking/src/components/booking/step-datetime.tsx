'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { bookingService } from '@/services/booking';

interface StepDateTimeProps {
  tenantId: string;
  professionalId?: string;
  duration: number;
  selectedDate?: Date;
  selectedTime?: string;
  onSelect: (date: Date, time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDateTime({
  tenantId,
  professionalId,
  duration,
  selectedDate,
  selectedTime,
  onSelect,
  onNext,
  onBack,
}: StepDateTimeProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());

  const weekDays = useMemo(() => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['available-slots', tenantId, professionalId, format(currentDate, 'yyyy-MM-dd'), duration],
    queryFn: () =>
      bookingService.getAvailableSlots(tenantId, {
        date: format(currentDate, 'yyyy-MM-dd'),
        professionalId,
        duration,
      }),
    enabled: !!currentDate,
  });

  const morningSlots = slots.filter((slot: string) => {
    const hour = parseInt(slot.split(':')[0]);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((slot: string) => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 12 && hour < 18;
  });

  const eveningSlots = slots.filter((slot: string) => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 18;
  });

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (selectedTime) {
      onSelect(date, selectedTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    onSelect(currentDate, time);
  };

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
        <h2 className="text-xl font-bold text-gray-900">Escolha a data e hora</h2>
        <p className="text-gray-500 mt-1">Selecione o melhor horário para você</p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">
            {format(weekDays[0], 'MMM yyyy', { locale: ptBR })}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, currentDate);
            const isPast = isBefore(day, startOfDay(new Date()));
            const dayIsToday = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => !isPast && handleDateSelect(day)}
                disabled={isPast}
                className={`flex flex-col items-center py-3 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-fuchsia-500 text-white'
                    : isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-xs uppercase">
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={`text-lg font-semibold mt-1 ${
                    dayIsToday && !isSelected ? 'text-fuchsia-500' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum horário disponível nesta data</p>
          <p className="text-sm text-gray-400 mt-1">Tente selecionar outra data</p>
        </div>
      ) : (
        <div className="space-y-6">
          {morningSlots.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Manhã</h3>
              <div className="grid grid-cols-4 gap-2">
                {morningSlots.map((time: string) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 rounded-lg border-2 font-medium transition-colors ${
                      selectedDate &&
                      isSameDay(selectedDate, currentDate) &&
                      selectedTime === time
                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Tarde</h3>
              <div className="grid grid-cols-4 gap-2">
                {afternoonSlots.map((time: string) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 rounded-lg border-2 font-medium transition-colors ${
                      selectedDate &&
                      isSameDay(selectedDate, currentDate) &&
                      selectedTime === time
                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {eveningSlots.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Noite</h3>
              <div className="grid grid-cols-4 gap-2">
                {eveningSlots.map((time: string) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 rounded-lg border-2 font-medium transition-colors ${
                      selectedDate &&
                      isSameDay(selectedDate, currentDate) &&
                      selectedTime === time
                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!selectedDate || !selectedTime}
        className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continuar
      </button>
    </div>
  );
}
