// src/utils/auth-cache-cleaner.ts
/**
 * Utilitário para limpeza de cache de autenticação no navegador
 * Resolve problemas de "email já em uso" causados por cache persistente
 */

export class AuthCacheCleaner {
  /**
   * Limpa todos os dados relacionados à autenticação do localStorage
   */
  static clearLocalStorage(): void {
    try {
      // Limpar dados específicos do Firebase
      const firebaseKeys = [
        'firebase:authUser',
        'firebase:host',
        'firebase:persistence',
        'firebase:previous_websocket_failure'
      ];

      firebaseKeys.forEach(key => {
        Object.keys(localStorage).forEach(storageKey => {
          if (storageKey.includes(key) || storageKey.includes('firebase')) {
            localStorage.removeItem(storageKey);
          }
        });
      });

      // Limpar dados específicos da aplicação
      const appKeys = [
        'auth-store',
        'user-data',
        'auth-token',
        'user-profile',
        'auth-state'
      ];

      appKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('✅ localStorage limpo com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Limpa todos os dados relacionados à autenticação do sessionStorage
   */
  static clearSessionStorage(): void {
    try {
      // Limpar dados específicos do Firebase
      const firebaseKeys = [
        'firebase:authUser',
        'firebase:host',
        'firebase:persistence'
      ];

      firebaseKeys.forEach(key => {
        Object.keys(sessionStorage).forEach(storageKey => {
          if (storageKey.includes(key) || storageKey.includes('firebase')) {
            sessionStorage.removeItem(storageKey);
          }
        });
      });

      // Limpar dados específicos da aplicação
      const appKeys = [
        'auth-store',
        'user-data',
        'auth-token',
        'user-profile',
        'auth-state'
      ];

      appKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      console.log('✅ sessionStorage limpo com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', error);
    }
  }

  /**
   * Limpa cookies relacionados à autenticação
   */
  static clearAuthCookies(): void {
    try {
      // Lista de cookies relacionados ao Firebase e autenticação
      const cookiesToClear = [
        '__session',
        'firebase-heartbeat-database',
        'firebase-heartbeat-store',
        'auth-token',
        'user-session'
      ];

      cookiesToClear.forEach(cookieName => {
        // Limpar cookie para o domínio atual
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // Limpar cookie para subdomínios
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      });

      console.log('✅ Cookies de autenticação limpos com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cookies:', error);
    }
  }

  /**
   * Limpa o cache do IndexedDB relacionado ao Firebase
   */
  static async clearIndexedDB(): Promise<void> {
    try {
      if ('indexedDB' in window) {
        // Tentar limpar databases do Firebase
        const firebaseDBNames = [
          'firebase-heartbeat-database',
          'firebase-installations-database',
          'fcm_token_details_db'
        ];

        for (const dbName of firebaseDBNames) {
          try {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            await new Promise((resolve, reject) => {
              deleteReq.onsuccess = () => resolve(true);
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => {
                console.warn(`Database ${dbName} está bloqueado`);
                resolve(true);
              };
            });
          } catch (error) {
            console.warn(`Erro ao limpar database ${dbName}:`, error);
          }
        }

        console.log('✅ IndexedDB limpo com sucesso');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar IndexedDB:', error);
    }
  }

  /**
   * Executa uma limpeza completa de todos os caches de autenticação
   */
  static async clearAllAuthCache(): Promise<void> {
    console.log('🧹 Iniciando limpeza completa do cache de autenticação...');
    
    // Limpar localStorage
    this.clearLocalStorage();
    
    // Limpar sessionStorage
    this.clearSessionStorage();
    
    // Limpar cookies
    this.clearAuthCookies();
    
    // Limpar IndexedDB
    await this.clearIndexedDB();
    
    console.log('✅ Limpeza completa do cache concluída!');
    console.log('💡 Recomendação: Recarregue a página para garantir que todas as mudanças tenham efeito.');
  }

  /**
   * Mostra instruções para o usuário sobre como limpar o cache manualmente
   */
  static showClearCacheInstructions(): void {
    const instructions = `
🧹 INSTRUÇÕES PARA LIMPAR CACHE MANUALMENTE:

1. 🌐 Chrome/Edge:
   - Pressione Ctrl+Shift+Delete
   - Selecione "Cookies e outros dados do site"
   - Selecione "Imagens e arquivos armazenados em cache"
   - Clique em "Limpar dados"

2. 🦊 Firefox:
   - Pressione Ctrl+Shift+Delete
   - Selecione "Cookies" e "Cache"
   - Clique em "Limpar agora"

3. 🔧 Ferramentas de Desenvolvedor:
   - Pressione F12
   - Vá para Application/Storage
   - Limpe localStorage, sessionStorage e cookies
   - Ou clique com botão direito no ícone de recarregar e selecione "Esvaziar cache e recarregar"

4. 🕵️ Modo Incógnito:
   - Teste em uma janela incógnita/privada
   - Isso ignora todo o cache existente
    `;

    console.log(instructions);
    
    // Se estiver em desenvolvimento, mostrar um alert também
    if (process.env.NODE_ENV === 'development') {
      alert('Verifique o console para instruções de limpeza de cache');
    }
  }
}

// Função de conveniência para uso rápido
export const clearAuthCache = () => AuthCacheCleaner.clearAllAuthCache();

// Função para mostrar instruções
export const showCacheInstructions = () => AuthCacheCleaner.showClearCacheInstructions();