import { NextRequest, NextResponse } from 'next/server';

// Tipos de usuário permitidos
type UserType = 'customer' | 'restaurant' | 'delivery';

// Configuração de rotas protegidas e suas permissões
const ROUTE_PERMISSIONS: Record<string, UserType[]> = {
  // Rotas de autenticação - públicas
  '/api/auth/login': [],
  '/api/auth/register': [],
  '/api/auth/password-reset': [],
  '/api/auth/verify-code': [],
  '/api/auth/reset-password': [],
  '/api/auth/forgot-password': [],
  
  // Rotas de registro - públicas
  '/api/restaurants': [], // Permite registro de restaurantes sem autenticação
  
  // Rotas de cliente
  '/api/customer': ['customer'],
  '/api/orders/customer': ['customer'],
  '/api/profile/customer': ['customer'],
  
  // Rotas de restaurante
  '/api/restaurant': ['restaurant'],
  '/api/menu': ['restaurant'],
  '/api/orders/restaurant': ['restaurant'],
  '/api/profile/restaurant': ['restaurant'],
  
  // Rotas de entregador
  '/api/delivery': ['delivery'],
  '/api/orders/delivery': ['delivery'],
  '/api/profile/delivery': ['delivery'],
  
  // Rotas compartilhadas (todos os usuários autenticados)
  '/api/notifications': ['customer', 'restaurant', 'delivery'],
  '/api/orders': ['customer', 'restaurant', 'delivery'],
};

// Função para verificar se a rota é pública
function isPublicRoute(pathname: string): boolean {
  // Verifica rotas exatas
  if (ROUTE_PERMISSIONS[pathname] && ROUTE_PERMISSIONS[pathname].length === 0) {
    return true;
  }
  
  // Verifica padrões de rotas públicas
  const publicPatterns = ['/api/auth/', '/api/restaurants'];
  return publicPatterns.some(pattern => pathname.startsWith(pattern));
}

// Função para obter permissões necessárias para uma rota
function getRequiredPermissions(pathname: string): UserType[] {
  // Verifica rota exata primeiro
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  
  // Verifica padrões de rotas
  for (const route in ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route)) {
      return ROUTE_PERMISSIONS[route];
    }
  }
  
  // Por padrão, requer autenticação mas permite qualquer tipo de usuário
  return ['customer', 'restaurant', 'delivery'];
}

// Função para extrair token da requisição
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Função principal do middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Só processa rotas da API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Permite rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Extrai o token da requisição
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token de autenticação não fornecido'
      },
      { status: 401 }
    );
  }
  
  // Para o Edge Runtime, vamos apenas verificar se o token existe
  // A validação completa será feita nas rotas da API usando Firebase Admin SDK
  // que roda no Node.js runtime
  
  // Adiciona o token aos headers para as rotas da API
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-auth-token', token);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match only API routes to avoid interfering with page routing
     */
    '/api/(.*)',
  ],
};