'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, XCircle, ArrowLeft } from 'lucide-react';

// Password Strength Component
function PasswordStrength({ password }: { password: string }) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  const getStrengthLabel = () => {
    if (strength === 0) return { label: '', color: 'bg-gray-200' };
    if (strength <= 2) return { label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 3) return { label: 'Média', color: 'bg-yellow-500' };
    if (strength <= 4) return { label: 'Boa', color: 'bg-blue-500' };
    return { label: 'Forte', color: 'bg-emerald-500' };
  };

  const { label, color } = getStrengthLabel();

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Força da senha:</span>
        <span className={`font-medium ${
          strength <= 2 ? 'text-red-500' : 
          strength <= 3 ? 'text-yellow-600' : 
          strength <= 4 ? 'text-blue-600' : 'text-emerald-600'
        }`}>{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className={`flex items-center gap-1 ${checks.length ? 'text-emerald-600' : 'text-gray-400'}`}>
          {checks.length ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
          <span>8+ caracteres</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-emerald-600' : 'text-gray-400'}`}>
          {checks.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
          <span>Letra maiúscula</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-emerald-600' : 'text-gray-400'}`}>
          {checks.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
          <span>Letra minúscula</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.number ? 'text-emerald-600' : 'text-gray-400'}`}>
          {checks.number ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
          <span>Número</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.special ? 'text-emerald-600' : 'text-gray-400'}`}>
          {checks.special ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
          <span>Caractere especial</span>
        </div>
      </div>
    </div>
  );
}

function isPasswordStrong(password: string): boolean {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  return Object.values(checks).filter(Boolean).length >= 4;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = password && confirmPassword && passwordsMatch && isPasswordStrong(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao redefinir senha');
      }

      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Link Inválido
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Este link de redefinição de senha é inválido ou expirou. Por favor,
              solicite um novo link.
            </p>

            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full py-3.5 px-4 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 text-center"
              >
                Solicitar novo link
              </Link>
              <Link
                href="/login"
                className="block w-full py-3.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Senha Redefinida!
            </h1>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Sua senha foi redefinida com sucesso. Você será redirecionado para
              a página de login em instantes...
            </p>

            <div className="flex items-center justify-center gap-2 text-ruby-600">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Redirecionando...</span>
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
              <Lock className="h-8 w-8 text-ruby-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Redefinir Senha
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Digite sua nova senha. Certifique-se de que ela seja forte e segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 transition-all outline-none ${
                    confirmPassword
                      ? passwordsMatch
                        ? 'border-emerald-500'
                        : 'border-red-400'
                      : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-500 mt-2">As senhas não coincidem</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-ruby-600">
            <Loader2 className="animate-spin h-6 w-6" />
            <span className="font-medium">Carregando...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
