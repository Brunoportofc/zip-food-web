// src/utils/debug-cookies.ts
// Utilitário para debug de cookies

export function debugCookies() {
  if (typeof document === 'undefined') {
    console.log('🍪 [Debug Cookies] Executando no servidor - cookies não disponíveis');
    return;
  }

  console.log('🍪 [Debug Cookies] Todos os cookies disponíveis:');
  console.log('document.cookie:', document.cookie);
  
  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  console.log('🍪 [Debug Cookies] Cookies parseados:', cookies);
  
  if (cookies.session) {
    console.log('✅ [Debug Cookies] Cookie session encontrado:', {
      length: cookies.session.length,
      preview: cookies.session.substring(0, 50) + '...'
    });
  } else {
    console.log('❌ [Debug Cookies] Cookie session NÃO encontrado');
  }
  
  return cookies;
}

export function debugRequestCookies(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  console.log('🍪 [Debug Request Cookies] Cookie header:', cookieHeader);
  
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    console.log('🍪 [Debug Request Cookies] Cookies parseados:', Object.keys(cookies));
    
    if (cookies.session) {
      console.log('✅ [Debug Request Cookies] Cookie session encontrado:', {
        length: cookies.session.length,
        preview: cookies.session.substring(0, 50) + '...'
      });
    }
    
    return cookies;
  }
  
  return {};
}
