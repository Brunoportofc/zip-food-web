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
const deliveryRoutes = ['/delivery'];

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
      if (restaurantRoutes.some(route => pathname.startsWith(route)) || 
          deliveryRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Cliente tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
      
      // Se está na raiz, redirecionar para área do cliente
      if (pathname === '/') {
        console.log('🔄 [Middleware] Redirecionando cliente para sua área');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    } else if (userRole === 'delivery') {
      // Usuário é entregador
      if (customerRoutes.some(route => pathname.startsWith(route)) || 
          restaurantRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Entregador tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/delivery', request.url));
      }
      
      // Se está na raiz, redirecionar para área do entregador
      if (pathname === '/') {
        console.log('🔄 [Middleware] Redirecionando entregador para sua área');
        return NextResponse.redirect(new URL('/delivery', request.url));
      }
    } else if (userRole === 'restaurant') {
      // Usuário é restaurante
      if (customerRoutes.some(route => pathname.startsWith(route)) || 
          deliveryRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Restaurante tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/restaurant/register', request.url));
      }
      
      // Se está na raiz, verificar se tem restaurante cadastrado
      if (pathname === '/') {
        console.log('🔄 [Middleware] Verificando se restaurante está cadastrado');
        
        try {
          // Verificar se o restaurante já está cadastrado
          const checkRestaurantResponse = await fetch(new URL('/api/restaurant/check', request.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: uid }),
          });

          if (checkRestaurantResponse.ok) {
            const { hasRestaurant } = await checkRestaurantResponse.json();
            
            if (hasRestaurant) {
              console.log('✅ [Middleware] Restaurante cadastrado, redirecionando para dashboard');
              return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
            } else {
              console.log('⚠️ [Middleware] Restaurante não cadastrado, redirecionando para registro');
              return NextResponse.redirect(new URL('/restaurant/register', request.url));
            }
          } else {
            // Se a API falhar, assumir que não está cadastrado
            console.log('⚠️ [Middleware] Erro ao verificar restaurante, redirecionando para registro');
            return NextResponse.redirect(new URL('/restaurant/register', request.url));
          }
        } catch (error) {
          console.error('❌ [Middleware] Erro ao verificar restaurante cadastrado:', error);
          // Em caso de erro, redirecionar para registro
          return NextResponse.redirect(new URL('/restaurant/register', request.url));
        }
      }
      
      // Se está tentando acessar /restaurant diretamente, verificar se tem restaurante cadastrado
      if (pathname === '/restaurant') {
        console.log('🔄 [Middleware] Acesso direto a /restaurant, verificando cadastro');
        
        try {
          // Verificar se o restaurante já está cadastrado
          const checkRestaurantResponse = await fetch(new URL('/api/restaurant/check', request.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: uid }),
          });

          if (checkRestaurantResponse.ok) {
            const { hasRestaurant } = await checkRestaurantResponse.json();
            
            if (hasRestaurant) {
              console.log('✅ [Middleware] Restaurante cadastrado, redirecionando para dashboard');
              return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
            } else {
              console.log('⚠️ [Middleware] Restaurante não cadastrado, redirecionando para registro');
              return NextResponse.redirect(new URL('/restaurant/register', request.url));
            }
          } else {
            // Se a API falhar, assumir que não está cadastrado
            console.log('⚠️ [Middleware] Erro ao verificar restaurante, redirecionando para registro');
            return NextResponse.redirect(new URL('/restaurant/register', request.url));
          }
        } catch (error) {
          console.error('❌ [Middleware] Erro ao verificar restaurante cadastrado:', error);
          // Em caso de erro, redirecionar para registro
          return NextResponse.redirect(new URL('/restaurant/register', request.url));
        }
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