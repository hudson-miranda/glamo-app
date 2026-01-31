'use client';

import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import LandingPage from './landing-page';

// Página pública - Landing Page
// Usuários autenticados são redirecionados pelo middleware ou aqui
export default function HomePage() {
  const router = useRouter();

  // Verificação síncrona imediata para evitar flash
  useLayoutEffect(() => {
    const token = authService.getAccessToken();
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Verificação inicial síncrona (SSR-safe)
  if (typeof window !== 'undefined' && authService.getAccessToken()) {
    return null;
  }

  return <LandingPage />;
}
