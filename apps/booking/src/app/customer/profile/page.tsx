'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Camera,
  Check,
} from 'lucide-react';
import { mockCustomer } from '@/lib/mock-data';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: mockCustomer.name,
    email: mockCustomer.email,
    phone: mockCustomer.phone,
  });
  const [notifications, setNotifications] = useState(
    mockCustomer.notificationPreferences || {
      email: true,
      sms: true,
      push: true,
      reminders: true,
      promotions: false,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <Check className="w-5 h-5" />
              Alterações salvas com sucesso!
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="relative">
                {mockCustomer.avatar ? (
                  <img
                    src={mockCustomer.avatar}
                    alt={mockCustomer.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {mockCustomer.name[0]}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
                <p className="text-gray-500">Cliente desde {new Date(mockCustomer.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>{mockCustomer.appointmentCount} agendamentos</span>
                  <span>•</span>
                  <span>{mockCustomer.favoriteEstablishments?.length || 0} favoritos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Dados Pessoais</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary font-medium hover:underline"
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 font-medium hover:underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nome completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formData.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  E-mail
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formData.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formData.phone}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Notificações</h2>
            </div>

            <div className="p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Lembretes de agendamento</p>
                  <p className="text-sm text-gray-500">Receba lembretes antes dos seus horários</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.reminders}
                  onChange={(e) =>
                    setNotifications({ ...notifications, reminders: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Notificações por e-mail</p>
                  <p className="text-sm text-gray-500">Confirmações e atualizações por e-mail</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Notificações por SMS</p>
                  <p className="text-sm text-gray-500">Confirmações e lembretes por SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) =>
                    setNotifications({ ...notifications, sms: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Promoções e novidades</p>
                  <p className="text-sm text-gray-500">Ofertas especiais dos estabelecimentos</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.promotions}
                  onChange={(e) =>
                    setNotifications({ ...notifications, promotions: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </label>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Segurança</h2>
            </div>

            <div className="divide-y">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">Alterar senha</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">Sessões ativas</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">Privacidade de dados</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Histórico de Visitas</h2>
              <Link href="/customer/appointments" className="text-primary font-medium hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">{mockCustomer.appointmentCount}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">10</p>
                  <p className="text-sm text-gray-500">Concluídos</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-sm text-gray-500">Cancelados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Link
            href="/customer"
            className="flex items-center justify-center gap-2 w-full py-3 text-red-600 font-medium bg-white rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </Link>

          {/* Delete Account */}
          <button className="w-full text-center text-sm text-gray-400 hover:text-red-500 transition-colors">
            Excluir minha conta
          </button>
        </div>
      </div>
    </div>
  );
}
