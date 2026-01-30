'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  Home,
  ChevronLeft,
  Plus,
  List,
  Filter,
  Clock,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/appointments" className="hover:text-gray-700">
        Agendamentos
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Calendário</span>
    </nav>
  );
}

// Mock time slots
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

// Mock appointments
const appointments = [
  { id: '1', time: '09:00', duration: 60, customer: 'Maria Silva', service: 'Corte', professional: 'Ana', color: 'bg-purple-500' },
  { id: '2', time: '10:30', duration: 30, customer: 'João Santos', service: 'Barba', professional: 'Carlos', color: 'bg-blue-500' },
  { id: '3', time: '14:00', duration: 120, customer: 'Paula Oliveira', service: 'Coloração', professional: 'Fernanda', color: 'bg-pink-500' },
];

// Mock week days
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AppointmentsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');

  // Get current week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-500 mt-1">Visualize e gerencie os agendamentos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/appointments">
            <Button variant="outline">
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </Link>
          <Link href="/dashboard/appointments/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <h2 className="text-lg font-semibold capitalize">
                {formatMonthYear()}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ana">Ana Costa</SelectItem>
                  <SelectItem value="carlos">Carlos Lima</SelectItem>
                  <SelectItem value="fernanda">Fernanda Souza</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={view === 'day' ? 'default' : 'ghost'}
                  className="rounded-none"
                  onClick={() => setView('day')}
                >
                  Dia
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'ghost'}
                  className="rounded-none"
                  onClick={() => setView('week')}
                >
                  Semana
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            {/* Time column header */}
            <div className="p-3 bg-gray-50 border-r">
              <Clock className="h-4 w-4 text-gray-400 mx-auto" />
            </div>
            {/* Day headers */}
            {weekDates.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`p-3 text-center border-r last:border-r-0 ${
                    isToday ? 'bg-purple-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-500">{weekDays[index]}</div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-purple-600' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                {/* Time label */}
                <div className="p-2 text-sm text-gray-500 bg-gray-50 border-r text-center">
                  {time}
                </div>
                {/* Day slots */}
                {weekDates.map((_, dayIndex) => {
                  // Find appointment for this slot
                  const appointment = appointments.find(a => a.time === time && dayIndex === 3); // Mock: show on Wednesday
                  
                  return (
                    <div
                      key={dayIndex}
                      className="p-1 border-r last:border-r-0 min-h-[40px] hover:bg-gray-50 cursor-pointer relative"
                    >
                      {appointment && (
                        <div
                          className={`${appointment.color} text-white text-xs p-1 rounded truncate`}
                        >
                          <div className="font-medium">{appointment.customer}</div>
                          <div className="opacity-80">{appointment.service}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda de Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">Ana Costa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Carlos Lima</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-500 rounded"></div>
              <span className="text-sm">Fernanda Souza</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
