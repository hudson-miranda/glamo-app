'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    setStatus('loading');
    // TODO: Implement email verification logic
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    // TODO: Implement resend email logic
    setTimeout(() => {
      setIsResending(false);
    }, 2000);
  };

  // Verification in progress
  if (status === 'loading') {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificando Email...</CardTitle>
          <CardDescription>
            Aguarde enquanto confirmamos seu endereço de email
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Verification successful
  if (status === 'success') {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verificado!</CardTitle>
          <CardDescription>
            Seu email foi confirmado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Sua conta está ativa e pronta para uso. Você já pode acessar todos os recursos do Glamo.
          </p>
          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Acessar Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Verification error
  if (status === 'error') {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Erro na Verificação</CardTitle>
          <CardDescription>
            Não foi possível verificar seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            O link pode ter expirado ou já foi utilizado. Solicite um novo email de verificação.
          </p>
          <Button
            onClick={handleResendEmail}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pending verification (no token)
  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Verifique seu Email</CardTitle>
        <CardDescription>
          Enviamos um link de verificação para seu email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Clique no link enviado para seu email para ativar sua conta.
          Se não receber em alguns minutos, verifique sua pasta de spam.
        </p>
        
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 text-center mb-3">
            Não recebeu o email?
          </p>
          <Button
            variant="outline"
            onClick={handleResendEmail}
            className="w-full"
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar Email de Verificação
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
