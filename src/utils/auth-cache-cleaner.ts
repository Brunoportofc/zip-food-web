// src/utils/auth-cache-cleaner.ts
/**
 * Utilitário para limpeza de cache de autenticação
 * Compatível com Edge Runtime
 */

export class AuthCacheCleaner {
  /**
   * Limpar dados de autenticação do localStorage
   */
  static clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove = [
        'firebase:authUser',
        'firebase:host',
        'firebase:persistence',
        'user-profile',
        'auth-token',
        'user-type',
        'user-data',
      ];

      // Remover chaves específicas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Remover chaves que começam com firebase
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.startsWith('auth:')) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ localStorage limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Limpar dados de autenticação do sessionStorage
   */
  static clearSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove = [
        'firebase:authUser',
        'firebase:host',
        'firebase:persistence',
        'user-profile',
        'auth-token',
        'user-type',
        'user-data',
      ];

      // Remover chaves específicas
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });

      // Remover chaves que começam com firebase
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.startsWith('auth:')) {
          sessionStorage.removeItem(key);
        }
      });

      console.log('✅ sessionStorage limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', error);
    }
  }

  /**
   * Limpar cookies de autenticação
   */
  static clearAuthCookies(): void {
    if (typeof document === 'undefined') return;

    try {
      const cookiesToClear = [
        'auth-token',
        'user-type',
        'firebase-auth',
        'session-token',
      ];

      cookiesToClear.forEach(cookieName => {
        // Limpar cookie no domínio atual
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // Limpar cookie no subdomínio
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });

      console.log('✅ Cookies de autenticação limpos');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cookies:', error);
    }
  }

  /**
   * Limpar todo o cache de autenticação
   */
  static clearAll(): void {
    console.log('🧹 Iniciando limpeza completa do cache de autenticação...');
    
    this.clearLocalStorage();
    this.clearSessionStorage();
    this.clearAuthCookies();
    
    console.log('✅ Limpeza completa do cache concluída');
  }

  /**
   * Aguardar um tempo para garantir que a limpeza foi processada
   */
  static async waitForClearance(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpar cache e aguardar processamento
   */
  static async clearAllAndWait(waitTime: number = 500): Promise<void> {
    this.clearAll();
    await this.waitForClearance(waitTime);
  }
}

// Exportar função de conveniência
export const clearAuthCache = () => AuthCacheCleaner.clearAll();

export default AuthCacheCleaner;
