// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Configuração de rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  // Rotas de autenticação
  '/api/auth/signup',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/me',
  
  // Rotas públicas da aplicação
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  
  // Assets estáticos
  '/_next',
  '/favicon.ico',
  '/sw.js',
  '/manifest.json',
  
  // Arquivos públicos
  '/public',
  '/icons',
  '/images',
];

// Configuração de rotas protegidas (requerem autenticação)
const PROTECTED_ROUTES = [
  '/customer',
  '/restaurant', 
  '/delivery',
  '/api/profile',
  '/api/orders',
  '/api/notifications',
  '/api/menu',
  '/api/restaurants/update',
  '/api/delivery',
];

/**
 * Verificar se a rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Verificar se a rota é protegida
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Middleware principal - Edge Runtime compatível
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos e assets do Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    (pathname.includes('.') && !pathname.startsWith('/api/'))
  ) {
    return NextResponse.next();
  }

  // Permitir rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Para rotas protegidas, verificar se há token de autenticação
  if (isProtectedRoute(pathname)) {
    const authHeader = request.headers.get('authorization');
    const cookieAuth = request.cookies.get('auth-token');
    
    // Se não há token de autenticação, redirecionar para login
    if (!authHeader && !cookieAuth) {
      // Para rotas de API, retornar 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token de autenticação obrigatório',
            code: 'AUTH_TOKEN_MISSING',
          },
          { status: 401 }
        );
      }
      
      // Para rotas de página, redirecionar para login
      const loginUrl = new URL('/auth/sign-in', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continuar com a requisição
  return NextResponse.next();
}

// Configuração do matcher para definir quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|icons|images).*)',
  ],
};