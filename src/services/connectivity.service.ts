import { db } from '@/lib/firebase';
import { enableNetwork, disableNetwork, onSnapshotsInSync, collection, getDocs } from 'firebase/firestore';

class ConnectivityService {
  private _isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private _isForceOffline: boolean = false;
  private _isFirebaseConnected: boolean = true;
  private _onFirebaseConnectionChange: ((isConnected: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Configura listener para sincronização do Firestore
      this._setupFirestoreConnectionListener();
    }
  }

  /**
   * Configura um listener para monitorar a conectividade do Firestore
   */
  private _setupFirestoreConnectionListener(): void {
    // Usa onSnapshotsInSync para detectar quando o Firestore está sincronizado
    const unsubscribe = onSnapshotsInSync(db, () => {
      if (!this._isFirebaseConnected) {
        this._isFirebaseConnected = true;
        this._notifyFirebaseConnectionChange(true);
      }
    });

    // Testa a conectividade periodicamente
    setInterval(async () => {
      if (this._isOnline && !this._isForceOffline) {
        try {
          // Tenta fazer uma operação simples no Firestore
          await this._testFirestoreConnection();
          
          if (!this._isFirebaseConnected) {
            this._isFirebaseConnected = true;
            this._notifyFirebaseConnectionChange(true);
          }
        } catch (error) {
          if (this._isFirebaseConnected) {
            this._isFirebaseConnected = false;
            this._notifyFirebaseConnectionChange(false);
          }
        }
      }
    }, 30000); // Verifica a cada 30 segundos
  }

  /**
   * Testa a conexão com o Firestore fazendo uma operação simples
   */
  private async _testFirestoreConnection(): Promise<void> {
    try {
      // Tenta acessar uma coleção (não importa se existe ou não)
      const testCollection = collection(db, '_connectivity_test');
      await getDocs(testCollection);
      return Promise.resolve();
    } catch (error: any) {
      // Se o erro for relacionado à conectividade, rejeita a promessa
      if (error.code === 'failed-precondition' || 
          error.code === 'unavailable' || 
          error.message?.includes('offline')) {
        return Promise.reject(error);
      }
      // Outros erros (como permissão) não são considerados problemas de conectividade
      return Promise.resolve();
    }
  }

  /**
   * Notifica os listeners sobre mudanças na conexão do Firebase
   */
  private _notifyFirebaseConnectionChange(isConnected: boolean): void {
    this._onFirebaseConnectionChange.forEach(callback => callback(isConnected));
  }

  /**
   * Verifica se o dispositivo está online
   */
  isOnline(): boolean {
    return this._isOnline && !this._isForceOffline;
  }

  /**
   * Verifica se o Firebase está conectado
   */
  isFirebaseConnected(): boolean {
    return this._isFirebaseConnected && this.isOnline();
  }

  /**
   * Habilita o modo offline forçado para o Firestore
   * Útil para testes ou para economizar dados do usuário
   */
  async enableOfflineMode(): Promise<void> {
    try {
      this._isForceOffline = true;
      await disableNetwork(db);
      this._isFirebaseConnected = false;
      this._notifyFirebaseConnectionChange(false);
      console.log('Modo offline habilitado manualmente');
    } catch (error) {
      console.error('Erro ao habilitar modo offline:', error);
      throw error;
    }
  }

  /**
   * Desabilita o modo offline forçado e reconecta ao Firestore
   */
  async disableOfflineMode(): Promise<void> {
    try {
      this._isForceOffline = false;
      await enableNetwork(db);
      // Testa a conexão após habilitar a rede
      try {
        await this._testFirestoreConnection();
        this._isFirebaseConnected = true;
        this._notifyFirebaseConnectionChange(true);
      } catch (error) {
        this._isFirebaseConnected = false;
        this._notifyFirebaseConnectionChange(false);
      }
      console.log('Modo offline desabilitado, reconectando...');
    } catch (error) {
      console.error('Erro ao desabilitar modo offline:', error);
      throw error;
    }
  }

  /**
   * Registra callbacks para mudanças no estado de conectividade
   */
  registerConnectivityListeners(onOnline: () => void, onOffline: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      this._isOnline = true;
      console.log('Dispositivo online');
      this.disableOfflineMode().then(onOnline).catch(console.error);
    };

    const handleOffline = () => {
      this._isOnline = false;
      console.log('Dispositivo offline');
      this.enableOfflineMode().then(onOffline).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Retorna função para remover os listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Registra um callback para mudanças na conexão do Firebase
   * @param callback Função a ser chamada quando o estado da conexão mudar
   * @returns Função para remover o listener
   */
  registerFirebaseConnectionListener(callback: (isConnected: boolean) => void): () => void {
    this._onFirebaseConnectionChange.push(callback);
    
    // Notifica imediatamente com o estado atual
    callback(this._isFirebaseConnected);
    
    return () => {
      this._onFirebaseConnectionChange = this._onFirebaseConnectionChange.filter(cb => cb !== callback);
    };
  }
}

export const connectivityService = new ConnectivityService();