'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Recuperar email do sessionStorage
    const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      // Se não tiver email, redirecionar para registro
      router.push('/register');
    }
  }, [router]);

  useEffect(() => {
    // Cooldown timer para reenvio
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    // Aceitar apenas números
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Pegar apenas o último dígito
    setCode(newCode);

    // Auto-avançar para próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quando completar
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verifyEmail(verificationCode);

      // Se retornou tokens e usuário, salvar no store
      if (response.accessToken && response.user) {
        const { setAuth } = useAuthStore.getState();
        
        if (response.user.tenant) {
          setAuth(
            response.user,
            response.user.tenant,
            response.accessToken,
            response.refreshToken
          );
        } else {
          // Apenas salvar tokens para o onboarding
          authService.setTokens(response.accessToken, response.refreshToken);
        }
      }

      setSuccess(true);
      sessionStorage.removeItem('pendingVerificationEmail');

      // Redirecionar para onboarding após 2 segundos
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Código inválido');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao reenviar código');
      }

      setResendCooldown(60); // 60 segundos de cooldown
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Email Verificado!
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Sua conta foi verificada com sucesso. Redirecionando para a próxima etapa...
            </p>

            <div className="flex items-center justify-center gap-2 text-ruby-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Redirecionando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
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
          {/* Header */}
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-ruby-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Verifique seu email
            </h1>

            <p className="text-gray-500 leading-relaxed">
              Enviamos um código de 6 dígitos para{' '}
              <strong className="text-gray-900">{email}</strong>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          {/* Code Input */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl transition-all outline-none
                  ${digit 
                    ? 'border-ruby-500 bg-ruby-50/50 text-ruby-700' 
                    : 'border-gray-200 bg-white text-gray-900'
                  }
                  focus:ring-4 focus:ring-ruby-500/20 focus:border-ruby-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-ruby-600 mb-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Verificando...</span>
            </div>
          )}

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Não recebeu o código?
            </p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="inline-flex items-center gap-2 text-ruby-600 hover:text-ruby-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar em {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar código
                </>
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Verifique também sua pasta de spam. O código expira em 10 minutos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
