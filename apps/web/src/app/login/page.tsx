'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock, 
  ArrowRight,
  Sparkles,
  Shield,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';
import { toast, ThemeToggle } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      setIsSuccess(true);
      toast.success('Login realizado com sucesso', 'Redirecionando...');

      // Pequeno delay para a animação
      await new Promise(resolve => setTimeout(resolve, 600));

      // Verificar se o usuário tem tenant (API retorna tenant como objeto separado)
      if (response.tenant && response.user.hasTenant) {
        setAuth(
          response.user,
          response.tenant,
          response.accessToken,
          response.refreshToken
        );
        
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      } else {
        // Usuário não tem empresa, precisa passar pelo onboarding
        authService.setTokens(response.accessToken, response.refreshToken);
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Credenciais inválidas');
      toast.error('Erro ao fazer login', err.response?.data?.message || 'Verifique suas credenciais');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Calendar, text: 'Agendamento inteligente' },
    { icon: TrendingUp, text: 'Relatórios em tempo real' },
    { icon: Shield, text: 'Dados protegidos' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Theme Toggle - Fixed */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      {/* Left Side - Form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12"
      >
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25 transition-shadow group-hover:shadow-xl group-hover:shadow-ruby-500/30"
            >
              <span className="text-white font-bold text-xl">G</span>
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-ruby-600 to-ruby-700 bg-clip-text text-transparent">
              Glamo
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-balance">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Entre na sua conta para continuar
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl text-sm flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors group-focus-within:bg-ruby-100 dark:group-focus-within:bg-ruby-900/30">
                  <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-ruby-500 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    "w-full pl-[68px] pr-4 py-4 border-2 border-gray-200 dark:border-gray-800 rounded-2xl",
                    "bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400",
                    "focus:ring-0 focus:border-ruby-500 dark:focus:border-ruby-500",
                    "transition-all duration-200 outline-none"
                  )}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors group-focus-within:bg-ruby-100 dark:group-focus-within:bg-ruby-900/30">
                  <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-ruby-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    "w-full pl-[68px] pr-14 py-4 border-2 border-gray-200 dark:border-gray-800 rounded-2xl",
                    "bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400",
                    "focus:ring-0 focus:border-ruby-500 dark:focus:border-ruby-500",
                    "transition-all duration-200 outline-none"
                  )}
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.remember}
                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 peer-checked:border-ruby-500 peer-checked:bg-ruby-500 transition-all flex items-center justify-center">
                    <motion.svg
                      initial={false}
                      animate={formData.remember ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Lembrar de mim
                </span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-ruby-600 hover:text-ruby-700 dark:text-ruby-400 dark:hover:text-ruby-300 font-medium transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              animate={isSuccess ? { scale: [1, 1.02, 1] } : {}}
              className={cn(
                "relative w-full py-4 rounded-2xl font-semibold text-white overflow-hidden",
                "bg-gradient-to-r from-ruby-600 to-ruby-700",
                "shadow-lg shadow-ruby-600/25",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                "transition-all duration-300",
                !isLoading && "hover:shadow-xl hover:shadow-ruby-600/30"
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </motion.span>
                ) : isSuccess ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Sucesso!
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2"
                  >
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.form>

          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className="text-gray-500 dark:text-gray-400">Não tem uma conta? </span>
            <Link 
              href="/register" 
              className="text-ruby-600 dark:text-ruby-400 font-semibold hover:text-ruby-700 dark:hover:text-ruby-300 transition-colors"
            >
              Criar conta grátis
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-ruby-600 via-ruby-700 to-ruby-800 items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full" />
        
        {/* Animated dots */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{ 
              x: Math.random() * 100 - 50 + '%', 
              y: Math.random() * 100 - 50 + '%',
              opacity: 0 
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
        
        <div className="max-w-md text-white text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl"
          >
            <span className="text-4xl font-bold">G</span>
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold mb-4 text-balance"
          >
            Gestão completa para seu negócio de beleza
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-ruby-100 text-lg leading-relaxed mb-8"
          >
            Agendamento, clientes, financeiro, marketing e muito mais em uma única plataforma elegante.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
