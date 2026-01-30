'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { mockAppointments, mockCustomer } from '@/lib/mock-data';
import { formatPrice, formatDuration } from '@/lib/mock-data';

type AuthMode = 'login' | 'register';

export default function CustomerPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setIsLoggedIn(true);
  };

  // Logged in view
  if (isLoggedIn) {
    const upcomingAppointments = mockAppointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'pending'
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <div className="flex items-center gap-4">
                {mockCustomer.avatar ? (
                  <img
                    src={mockCustomer.avatar}
                    alt={mockCustomer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {mockCustomer.name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{mockCustomer.name}</h1>
                  <p className="text-gray-500">{mockCustomer.email}</p>
                </div>
                <Link
                  href="/customer/profile"
                  className="px-4 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
                >
                  Editar
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{mockCustomer.appointmentCount}</p>
                  <p className="text-sm text-gray-500">Agendamentos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {mockCustomer.favoriteEstablishments?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Favoritos</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link
                href="/search"
                className="flex items-center gap-3 p-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Calendar className="w-6 h-6" />
                <span className="font-medium">Novo Agendamento</span>
              </Link>
              <Link
                href="/customer/appointments"
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-6 h-6 text-primary" />
                <span className="font-medium text-gray-700">Ver Histórico</span>
              </Link>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-gray-900">Próximos Agendamentos</h2>
                <Link
                  href="/customer/appointments"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="divide-y">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/customer/appointments#${appointment.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-xs text-primary font-medium">
                          {new Date(appointment.date).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {new Date(appointment.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {appointment.services.map((s) => s.name).join(', ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.establishment.name} • {appointment.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Nenhum agendamento próximo</p>
                  <Link
                    href="/search"
                    className="text-primary font-medium hover:underline"
                  >
                    Agendar agora
                  </Link>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
              <Link
                href="/customer/profile"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
              >
                <span className="text-gray-700">Meu Perfil</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link
                href="/customer/appointments"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
              >
                <span className="text-gray-700">Meus Agendamentos</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-red-600"
              >
                <span>Sair da Conta</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/Register view
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {authMode === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
          </h1>
          <p className="text-gray-600 mt-2">
            {authMode === 'login'
              ? 'Acesse seus agendamentos e histórico'
              : 'Cadastre-se para agendar seus horários'}
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              authMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              authMode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail ou telefone
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="seu@email.com ou (11) 99999-9999"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Sua senha"
                required
              />
            </div>
          </div>

          {authMode === 'login' && (
            <div className="text-right">
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {authMode === 'login' ? 'Entrar' : 'Criar conta'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">ou continue com</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </button>
        </div>

        {/* Continue without account */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Não quer criar conta?{' '}
          <Link href="/search" className="text-primary font-medium hover:underline">
            Continue como visitante
          </Link>
        </p>
      </div>
    </div>
  );
}
