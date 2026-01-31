import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

// Landing page - pública mas redireciona se autenticado
const landingPage = '/';

// Rotas de autenticação (redirecionar para dashboard se já autenticado)
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se há token nos cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // Verificar rotas estáticas e API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Arquivos estáticos
  ) {
    return NextResponse.next();
  }
  
  // Se está na landing page
  if (pathname === landingPage) {
    // Se está autenticado, redirecionar para o dashboard (usando header especial)
    if (accessToken) {
      // Adicionar header para indicar que o usuário está autenticado
      const response = NextResponse.next();
      response.headers.set('x-authenticated', 'true');
      return response;
    }
    // Se não está autenticado, mostrar landing page
    return NextResponse.next();
  }
  
  // Se está em rota de autenticação e já tem token, redirecionar para dashboard
  if (authRoutes.some(route => pathname.startsWith(route)) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Se está em rota protegida e não tem token, redirecionar para login
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  if (!isPublicRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
