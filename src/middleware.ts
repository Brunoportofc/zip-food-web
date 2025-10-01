// src/middleware.ts
// Middleware para proteção de rotas e redirecionamento baseado no papel do usuário

import { NextRequest, NextResponse } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/api/auth/session', // API para criar sessão
  '/api/auth/verify', // API para verificar autenticação
];

// Rotas protegidas que precisam de autenticação mas não verificam papel específico
const protectedRoutes = [
  '/restaurant/cadastro',
  '/customer/cadastro', 
  '/delivery/cadastro'
];

// Rotas específicas por papel (PROTEGIDAS)
const customerRoutes = ['/customer'];
const restaurantRoutes = ['/restaurant'];
const deliveryRoutes = ['/delivery'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for HEAD requests (prefetch)
  if (request.method === 'HEAD') {
    return NextResponse.next();
  }
  
  // [FASE 1 - LOG 1] Registrar todas as requisições que chegam ao middleware
  console.log(`[MIDDLEWARE] 🚀 Requisição recebida para: ${pathname}`, {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  });

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log('✅ [MIDDLEWARE] Rota pública permitida:', pathname);
    return NextResponse.next();
  }

  // Permitir arquivos estáticos e API routes (exceto algumas auth APIs específicas)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/@vite') || // Vite development files
    pathname.includes('.') || // arquivos com extensão
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/verify') && !pathname.startsWith('/api/auth/session'))
  ) {
    return NextResponse.next();
  }

  // ✨ CORREÇÃO: Permitir acesso à página inicial para todos os usuários
  if (pathname === '/') {
    console.log('[MIDDLEWARE] 🏠 Rota raiz acessada - permitindo acesso à página inicial');
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida (cadastro) - precisa de autenticação mas não verifica papel
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    console.log('[MIDDLEWARE] 🔐 Rota protegida de cadastro detectada:', pathname);
    
    // Verificar apenas se tem sessão válida, sem verificar papel específico
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('[MIDDLEWARE] ❌ Sem sessão para rota protegida, redirecionando para login');
      return redirectToSignIn(request);
    }
    
    // Verificar se a sessão é válida
    try {
      const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionCookie }),
      });

      if (verifyResponse.ok) {
        console.log('[MIDDLEWARE] ✅ Sessão válida para rota protegida, permitindo acesso');
        return NextResponse.next();
      } else {
        console.log('[MIDDLEWARE] ❌ Sessão inválida para rota protegida, redirecionando para login');
        return redirectToSignIn(request);
      }
    } catch (error) {
      console.error('[MIDDLEWARE] ❌ Erro ao verificar sessão para rota protegida:', error);
      return redirectToSignIn(request);
    }
  }

  // [FASE 1 - LOG 2] Confirmar que entramos na lógica de proteção de rota
  console.log('[MIDDLEWARE] 🔒 Acessando rota protegida. Verificando sessão...', {
    pathname,
    isRestaurantRoute: restaurantRoutes.some(route => pathname.startsWith(route)),
    isCustomerRoute: customerRoutes.some(route => pathname.startsWith(route)),
    isDeliveryRoute: deliveryRoutes.some(route => pathname.startsWith(route))
  });

  try {
    // [FASE 1 - LOG 3] Obter e logar detalhes do cookie de sessão
    const sessionCookie = request.cookies.get('session')?.value;
    console.log('[MIDDLEWARE] 🍪 Cookie de sessão encontrado:', sessionCookie ? 'Sim' : 'Não', {
      cookieExists: !!sessionCookie,
      cookieLength: sessionCookie?.length || 0,
      cookiePreview: sessionCookie ? sessionCookie.substring(0, 20) + '...' : 'N/A',
      allCookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...'])),
      pathname,
      method: request.method,
      timestamp: new Date().toISOString()
    });

    // ✨ CORREÇÃO: Para rotas protegidas específicas, sempre exigir cookie de sessão
    if (!sessionCookie) {
      console.log('[MIDDLEWARE] ❌ ERRO: Sem cookie de sessão para rota protegida! Redirecionando para /auth/sign-in', {
        originalUrl: request.url,
        pathname,
        reason: 'NO_SESSION_COOKIE',
        timestamp: new Date().toISOString()
      });
      return redirectToSignIn(request);
    }

    // [FASE 1 - LOG 5] Verificar autenticação via API route
    console.log('[MIDDLEWARE] 🔍 Iniciando verificação de autenticação via API...', {
      apiUrl: '/api/auth/verify',
      cookieLength: sessionCookie.length,
      timestamp: new Date().toISOString()
    });

    const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionCookie }),
    });

    // [FASE 1 - LOG 6] Resultado da verificação da API
    console.log('[MIDDLEWARE] 📡 Resposta da API de verificação:', {
      status: verifyResponse.status,
      statusText: verifyResponse.statusText,
      ok: verifyResponse.ok,
      headers: Object.fromEntries(verifyResponse.headers.entries())
    });

    if (!verifyResponse.ok) {
      console.error('[MIDDLEWARE] ❌ FALHA na verificação de autenticação', {
        status: verifyResponse.status,
        statusText: verifyResponse.statusText,
        reason: 'API_VERIFY_FAILED',
        redirectingTo: '/auth/sign-in',
        timestamp: new Date().toISOString()
      });
      return redirectToSignIn(request);
    }

    const { uid, role: userRole, customClaims } = await verifyResponse.json();
    
    // [FASE 1 - LOG 7] Sessão validada com sucesso - incluindo custom claims
    console.log('[MIDDLEWARE] ✅ SESSÃO VÁLIDA! Dados do usuário:', {
      uid,
      userRole,
      customClaims,
      pathname,
      timestamp: new Date().toISOString()
    });

    // [FASE 1 - LOG 8] Lógica de redirecionamento baseada no papel
    console.log('[MIDDLEWARE] 🎭 Verificando permissões de acesso por papel...', {
      userRole,
      pathname,
      isRestaurantRoute: restaurantRoutes.some(route => pathname.startsWith(route)),
      isCustomerRoute: customerRoutes.some(route => pathname.startsWith(route)),
      isDeliveryRoute: deliveryRoutes.some(route => pathname.startsWith(route))
    });

    // Lógica de proteção de rotas baseada no papel (sem redirecionamentos automáticos da raiz)
    if (userRole === 'customer') {
      // Usuário é cliente - só bloquear acesso a áreas restritas
      if (restaurantRoutes.some(route => pathname.startsWith(route)) || 
          deliveryRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Cliente tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    } else if (userRole === 'delivery') {
      // Usuário é entregador - só bloquear acesso a áreas restritas
      if (customerRoutes.some(route => pathname.startsWith(route)) || 
          restaurantRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Entregador tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/delivery', request.url));
      }
    } else if (userRole === 'restaurant') {
      // Usuário é restaurante - só bloquear acesso a áreas restritas e verificar cadastro quando necessário
      if (customerRoutes.some(route => pathname.startsWith(route)) || 
          deliveryRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔄 [Middleware] Restaurante tentando acessar área restrita, redirecionando');
        return NextResponse.redirect(new URL('/restaurant/cadastro', request.url));
      }
      
      // Se está tentando acessar /restaurant diretamente, verificar se tem restaurante cadastrado
      if (pathname === '/restaurant') {
        console.log('🔄 [Middleware] Acesso direto a /restaurant, verificando cadastro');
        
        // ✨ CORREÇÃO: SEMPRE verificar via API para garantir que a informação está atualizada
        try {
          console.log('🔄 [Middleware] Verificando via API se usuário tem restaurante...');
          
          const checkRestaurantResponse = await fetch(new URL('/api/restaurant/check', request.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: uid }),
          });

          console.log('📡 [Middleware] Resposta da API restaurant/check:', {
            status: checkRestaurantResponse.status,
            ok: checkRestaurantResponse.ok
          });

          if (checkRestaurantResponse.ok) {
            const responseData = await checkRestaurantResponse.json();
            console.log('📋 [Middleware] Dados da resposta:', responseData);
            
            if (responseData.hasRestaurant) {
              console.log('✅ [Middleware] Restaurante encontrado, permitindo acesso ao dashboard');
              // Se tem restaurante cadastrado, permite acesso à página principal
              return NextResponse.next();
            } else {
              console.log('⚠️ [Middleware] Restaurante não cadastrado, redirecionando para cadastro');
              return NextResponse.redirect(new URL('/restaurant/cadastro', request.url));
            }
          } else {
            // Se a API falhar, permitir acesso e deixar a página decidir
            console.log('⚠️ [Middleware] API falhou, permitindo acesso (página decidirá)');
            return NextResponse.next();
          }
        } catch (error) {
          console.error('❌ [Middleware] Erro ao verificar restaurante cadastrado:', error);
          // Em caso de erro, permitir acesso e deixar a página decidir
          console.log('⚠️ [Middleware] Erro na verificação, permitindo acesso (página decidirá)');
          return NextResponse.next();
        }
      }
    } else {
      console.log('❌ [Middleware] Papel de usuário inválido:', userRole);
      return redirectToSignIn(request);
    }

    // [FASE 1 - LOG 9] Permitir acesso se chegou até aqui
    console.log('[MIDDLEWARE] ✅ ACESSO PERMITIDO! Continuando para a rota:', {
      pathname,
      userRole,
      uid,
      reason: 'ALL_CHECKS_PASSED',
      timestamp: new Date().toISOString()
    });
    return NextResponse.next();

  } catch (error) {
    // [FASE 1 - LOG 10] Erro durante verificação
    console.error('[MIDDLEWARE] 💥 ERRO DURANTE VERIFICAÇÃO:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname,
      timestamp: new Date().toISOString(),
      redirectingTo: '/auth/sign-in'
    });
    return redirectToSignIn(request);
  }
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const signInUrl = new URL('/auth/sign-in', request.url);
  
  // Adicionar parâmetro de redirecionamento se não for uma rota de auth
  if (!request.nextUrl.pathname.startsWith('/auth')) {
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
  }
  
  console.log('🔄 [Middleware] Redirecionando para login:', {
    from: request.nextUrl.pathname,
    to: signInUrl.toString(),
    reason: 'Não autenticado',
    timestamp: new Date().toISOString()
  });
  
  const response = NextResponse.redirect(signInUrl);
  
  // Adicionar headers de debug
  response.headers.set('X-Redirect-Reason', 'Authentication Required');
  response.headers.set('X-Original-Path', request.nextUrl.pathname);
  
  return response;
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - api (except auth APIs which are handled differently)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\..*).*)',
  ],
};
