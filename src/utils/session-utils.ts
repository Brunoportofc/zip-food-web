// src/utils/session-utils.ts
// Utilitários para gerenciar sessão

import { cookies } from 'next/headers';

export async function getSessionCookieFromRequest(request: Request): Promise<string | null> {
  try {
    // Método 1: Tentar obter via NextRequest cookies
    if ('cookies' in request && typeof (request as any).cookies.get === 'function') {
      const cookie = (request as any).cookies.get('session')?.value;
      if (cookie) {
        console.log('✅ [Session Utils] Cookie obtido via NextRequest.cookies');
        return cookie;
      }
    }

    // Método 2: Tentar obter via header Cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      if (cookies.session) {
        console.log('✅ [Session Utils] Cookie obtido via Cookie header');
        return cookies.session;
      }
    }

    // Método 3: Tentar via cookies() do Next.js (server-side)
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      if (sessionCookie?.value) {
        console.log('✅ [Session Utils] Cookie obtido via cookies() store');
        return sessionCookie.value;
      }
    } catch (error) {
      console.log('⚠️ [Session Utils] cookies() store não disponível');
    }

    console.log('❌ [Session Utils] Cookie de sessão não encontrado em nenhum método');
    return null;

  } catch (error) {
    console.error('❌ [Session Utils] Erro ao obter cookie de sessão:', error);
    return null;
  }
}

export function getCurrentUserToken(): string | null {
  if (typeof window === 'undefined') {
    console.log('⚠️ [Session Utils] getCurrentUserToken chamado no servidor');
    return null;
  }

  try {
    // Tentar obter o token do Firebase Auth no cliente
    const auth = (window as any).firebase?.auth?.();
    if (auth?.currentUser) {
      return auth.currentUser.accessToken || null;
    }

    console.log('❌ [Session Utils] Usuário não autenticado no cliente');
    return null;
  } catch (error) {
    console.error('❌ [Session Utils] Erro ao obter token do usuário:', error);
    return null;
  }
}
