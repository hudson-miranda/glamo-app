'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao enviar email');
      }

      setIsSubmitted(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        {/* Theme Toggle - Fixed */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle variant="compact" />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-900/5 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Email Enviado!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Se existe uma conta associada a <strong className="text-gray-900 dark:text-white">{email}</strong>, você
              receberá um email com instruções para redefinir sua senha.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
              Não recebeu o email? Verifique sua pasta de spam ou tente
              novamente em alguns minutos.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full py-3.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              >
                Tentar outro email
              </button>

              <Link
                href="/login"
                className="block w-full py-3.5 px-4 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 text-center"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Theme Toggle - Fixed */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent">
              Glamo
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8">
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para login
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-ruby-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Não se preocupe! Digite seu email e enviaremos instruções para
              redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar instruções'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Lembrou sua senha?{' '}
            <Link href="/login" className="text-ruby-600 hover:text-ruby-700 font-semibold transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
