'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  ChevronLeft,
  Home,
  Clock,
  Plus,
  List,
  Settings,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/professionals" className="hover:text-gray-700">
        Profissionais
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Agenda</span>
    </nav>
  );
}

// Mock data
const professionals = [
  { id: '1', name: 'Ana Costa', specialty: 'Cabeleireira', color: 'bg-purple-500' },
  { id: '2', name: 'Carlos Lima', specialty: 'Barbeiro', color: 'bg-blue-500' },
  { id: '3', name: 'Fernanda Souza', specialty: 'Colorista', color: 'bg-pink-500' },
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

// Mock appointments
const appointments: Record<string, Array<{ time: string; customer: string; service: string; duration: number }>> = {
  '1': [
    { time: '09:00', customer: 'Maria Silva', service: 'Corte', duration: 60 },
    { time: '14:00', customer: 'Paula Oliveira', service: 'Escova', duration: 45 },
  ],
  '2': [
    { time: '10:00', customer: 'João Santos', service: 'Barba', duration: 30 },
    { time: '15:00', customer: 'Pedro Costa', service: 'Corte Masculino', duration: 30 },
  ],
  '3': [
    { time: '11:00', customer: 'Carla Souza', service: 'Coloração', duration: 120 },
  ],
};

export default function ProfessionalsSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - (view === 'day' ? 1 : 7));
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (view === 'day' ? 1 : 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = () => {
    return currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAppointmentForSlot = (professionalId: string, time: string) => {
    const profAppointments = appointments[professionalId] || [];
    return profAppointments.find(apt => apt.time === time);
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda dos Profissionais</h1>
          <p className="text-gray-500 mt-1">Visualize e gerencie a agenda da equipe</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/professionals">
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

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <h2 className="text-lg font-semibold capitalize">
                {formatDate()}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Headers */}
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(${professionals.length}, 1fr)` }}>
            <div className="p-4 bg-gray-50 border-b border-r flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="p-4 bg-gray-50 border-b border-r last:border-r-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${professional.color} text-white`}>
                      {professional.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{professional.name}</p>
                    <p className="text-sm text-gray-500">{professional.specialty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="grid"
                style={{ gridTemplateColumns: `100px repeat(${professionals.length}, 1fr)` }}
              >
                <div className="p-2 text-sm text-gray-500 bg-gray-50 border-b border-r text-center">
                  {time}
                </div>
                {professionals.map((professional) => {
                  const appointment = getAppointmentForSlot(professional.id, time);
                  return (
                    <div
                      key={professional.id}
                      className="p-1 border-b border-r last:border-r-0 min-h-[50px] hover:bg-gray-50 cursor-pointer"
                    >
                      {appointment && (
                        <div
                          className={`${professional.color} text-white text-xs p-2 rounded`}
                          style={{ minHeight: `${(appointment.duration / 30) * 25}px` }}
                        >
                          <p className="font-medium">{appointment.customer}</p>
                          <p className="opacity-80">{appointment.service}</p>
                          <p className="opacity-60">{appointment.duration}min</p>
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
          <CardTitle className="text-sm">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {professionals.map((professional) => (
              <div key={professional.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${professional.color} rounded`}></div>
                <span className="text-sm">{professional.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {professionals.map((professional) => {
          const profAppointments = appointments[professional.id] || [];
          return (
            <Card key={professional.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={`${professional.color} text-white`}>
                        {professional.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{professional.name}</p>
                      <p className="text-sm text-gray-500">
                        {profAppointments.length} agendamentos hoje
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {profAppointments.length > 0 ? 'Ocupado' : 'Livre'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
