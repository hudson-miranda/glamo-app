'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronRight,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { mockAppointments } from '@/lib/mock-data';
import { formatPrice, formatDuration } from '@/lib/mock-data';
import type { Appointment } from '@/types';

type TabType = 'upcoming' | 'history';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const upcomingAppointments = mockAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );

  const historyAppointments = mockAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show'
  );

  const getStatusBadge = (status: Appointment['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmado' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Concluído' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
      no_show: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Não compareceu' },
    };
    const badge = badges[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusIcon = (status: Appointment['status']) => {
    const icons = {
      pending: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      confirmed: <CheckCircle className="w-5 h-5 text-green-500" />,
      completed: <CheckCircle className="w-5 h-5 text-blue-500" />,
      cancelled: <XCircle className="w-5 h-5 text-red-500" />,
      no_show: <XCircle className="w-5 h-5 text-gray-500" />,
    };
    return icons[status];
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = () => {
    // In real app, would call API to cancel
    console.log('Cancelling appointment:', selectedAppointment?.id, 'Reason:', cancelReason);
    setCancelModalOpen(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
            <Link
              href="/search"
              className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Novo Agendamento
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Próximos ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Histórico ({historyAppointments.length})
            </button>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            {displayAppointments.length > 0 ? (
              displayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  id={appointment.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(appointment.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(appointment.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">às {appointment.time}</p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Establishment */}
                    <Link
                      href={`/${appointment.establishment.slug}`}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appointment.establishment.name}</p>
                        <p className="text-sm text-gray-500">{appointment.establishment.address}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    {/* Professional */}
                    <div className="flex items-center gap-3">
                      {appointment.professional.avatar ? (
                        <img
                          src={appointment.professional.avatar}
                          alt={appointment.professional.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Profissional</p>
                        <p className="font-medium text-gray-900">{appointment.professional.name}</p>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Serviços</p>
                      {appointment.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">{service.name}</span>
                          <span className="text-gray-500">{formatPrice(service.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDuration(appointment.totalDuration)}
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(appointment.totalPrice)}
                      </p>
                    </div>

                    {/* Actions */}
                    {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                      <div className="flex gap-3 pt-3 border-t">
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          className="flex-1 py-2 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <Link
                          href={`/${appointment.establishment.slug}/booking`}
                          className="flex-1 py-2 text-primary font-medium border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors text-center flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Remarcar
                        </Link>
                      </div>
                    )}

                    {/* Cancellation reason */}
                    {appointment.status === 'cancelled' && appointment.cancellationReason && (
                      <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-sm text-red-600">
                          <strong>Motivo do cancelamento:</strong> {appointment.cancellationReason}
                        </p>
                      </div>
                    )}

                    {/* Re-book for history */}
                    {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                      <div className="pt-3 border-t">
                        <Link
                          href={`/${appointment.establishment.slug}/booking`}
                          className="w-full py-2 text-primary font-medium border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors text-center block"
                        >
                          Agendar Novamente
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'upcoming'
                    ? 'Nenhum agendamento próximo'
                    : 'Nenhum agendamento no histórico'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'upcoming'
                    ? 'Que tal agendar seu próximo horário?'
                    : 'Seus agendamentos concluídos aparecerão aqui.'}
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Explorar Estabelecimentos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cancelar Agendamento</h2>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar o agendamento em{' '}
              <strong>{selectedAppointment.establishment.name}</strong> no dia{' '}
              <strong>
                {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')} às{' '}
                {selectedAppointment.time}
              </strong>
              ?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do cancelamento (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Por que está cancelando?"
                rows={3}
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p className="text-sm text-amber-700">
                <strong>Atenção:</strong> Cancelamentos com menos de 2 horas de antecedência podem
                estar sujeitos a cobrança.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-3 text-gray-700 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
