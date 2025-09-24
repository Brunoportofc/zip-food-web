// src/middleware.ts
// Middleware para proteção de rotas e redirecionamento baseado no papel do usuário

import { NextRequest, NextResponse } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/api/auth/session', // API para criar sessão
  '/api/auth/verify', // API para verificar autenticação
];

// Rotas específicas por papel
const customerRoutes = ['/customer'];
const restaurantRoutes = ['/restaurant'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔄 [Middleware] Processando rota:', pathname);

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log('✅ [Middleware] Rota pública permitida:', pathname);
    return NextResponse.next();
  }

  // Permitir arquivos estáticos e API routes (exceto auth)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return NextResponse.next();
  }

  try {
    // Obter token de sessão do cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('❌ [Middleware] Sem token de sessão, redirecionando para login');
      return redirectToSignIn(request);
    }

    // Verificar autenticação via API route
    const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionCookie }),
    });

    if (!verifyResponse.ok) {
      console.log('❌ [Middleware] Falha na verificação de autenticação');
      return redirectToSignIn(request);
    }

    const { uid, role: userRole } = await verifyResponse.json();
    
    console.log('✅ [Middleware] Token válido para usuário:', uid);
    console.log('👤 [Middleware] Papel do usuário:', userRole);

    // Lógica de redirecionamento baseada no papel
    if (userRole === 'customer') {
      // Usuário é cliente
      if (restaurantRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Cliente tentando acessar área de restaurante, redirecionando');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
      
      // Se está na raiz, redirecionar para área do cliente
      if (pathname === '/') {
        console.log('🔄 [Middleware] Redirecionando cliente para sua área');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    } else if (userRole === 'restaurant') {
      // Usuário é restaurante
      if (customerRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Restaurante tentando acessar área de cliente, redirecionando');
        return NextResponse.redirect(new URL('/restaurant', request.url));
      }
      
      // Se está na raiz, redirecionar para área do restaurante
      if (pathname === '/') {
        console.log('🔄 [Middleware] Redirecionando restaurante para sua área');
        return NextResponse.redirect(new URL('/restaurant', request.url));
      }
    } else {
      console.log('❌ [Middleware] Papel de usuário inválido:', userRole);
      return redirectToSignIn(request);
    }

    // Permitir acesso se chegou até aqui
    console.log('✅ [Middleware] Acesso permitido à rota:', pathname);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ [Middleware] Erro ao verificar autenticação:', error);
    return redirectToSignIn(request);
  }
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const signInUrl = new URL('/auth/sign-in', request.url);
  
  // Adicionar parâmetro de redirecionamento se não for uma rota de auth
  if (!request.nextUrl.pathname.startsWith('/auth')) {
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
  }
  
  console.log('🔄 [Middleware] Redirecionando para login:', signInUrl.toString());
  return NextResponse.redirect(signInUrl);
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};