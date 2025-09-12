import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Tipos de usuário permitidos
type UserType = 'customer' | 'restaurant' | 'delivery';

// Interface para o payload do JWT
interface JWTPayload {
  userId: string;
  email: string;
  userType: UserType;
  name: string;
  iat?: number;
  exp?: number;
}

// Configuração de rotas protegidas e suas permissões
const ROUTE_PERMISSIONS: Record<string, UserType[]> = {
  // Rotas de autenticação - públicas
  '/api/auth/login': [],
  '/api/auth/register': [],
  
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
  const publicRoutes = ['/api/auth/login', '/api/auth/register'];
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Função para obter as permissões necessárias para uma rota
function getRequiredPermissions(pathname: string): UserType[] {
  // Busca exata primeiro
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  
  // Busca por padrão (ex: /api/menu/123 -> /api/menu)
  for (const route in ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route)) {
      return ROUTE_PERMISSIONS[route];
    }
  }
  
  // Se não encontrou, assume que precisa estar autenticado
  return ['customer', 'restaurant', 'delivery'];
}

// Função para extrair o token do header Authorization
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer '
}

// Função para verificar e decodificar o JWT
async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Erro ao verificar JWT:', error);
    return null;
  }
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
  
  // Verifica e decodifica o JWT
  const payload = await verifyJWT(token);
  if (!payload) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token de autenticação inválido'
      },
      { status: 401 }
    );
  }
  
  // Verifica se o token não expirou
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token de autenticação expirado'
      },
      { status: 401 }
    );
  }
  
  // Obtém as permissões necessárias para a rota
  const requiredPermissions = getRequiredPermissions(pathname);
  
  // Verifica se o usuário tem permissão para acessar a rota
  if (requiredPermissions.length > 0 && !requiredPermissions.includes(payload.userType)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Acesso negado: permissões insuficientes'
      },
      { status: 403 }
    );
  }
  
  // Adiciona informações do usuário aos headers da requisição
  // para que as rotas da API possam acessá-las
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-type', payload.userType);
  requestHeaders.set('x-user-name', payload.name);
  
  // Permite que a requisição prossiga com as informações do usuário
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};