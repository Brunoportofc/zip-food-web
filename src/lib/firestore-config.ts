import { db } from './firebase';
import { disableNetwork, enableNetwork } from 'firebase/firestore';

/**
 * Configurações específicas do Firestore para otimizar performance
 * e evitar erros WebChannel em desenvolvimento
 */
class FirestoreConfig {
  private static instance: FirestoreConfig;
  private networkEnabled = true;
  private isInitialized = false;

  static getInstance(): FirestoreConfig {
    if (!FirestoreConfig.instance) {
      FirestoreConfig.instance = new FirestoreConfig();
    }
    return FirestoreConfig.instance;
  }

  /**
   * Inicializa configurações específicas para desenvolvimento
   */
  async initializeForDevelopment(): Promise<void> {
    if (this.isInitialized || process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      // Em desenvolvimento, desabilita temporariamente a rede para evitar listeners automáticos
      console.log('🔧 Configurando Firestore para desenvolvimento...');
      
      // Aguarda um momento para garantir que o Firebase foi inicializado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reabilita a rede de forma controlada
      await this.enableNetworkSafely();
      
      this.isInitialized = true;
      console.log('✅ Firestore configurado com sucesso para desenvolvimento');
    } catch (error) {
      console.warn('⚠️ Erro ao configurar Firestore para desenvolvimento:', error);
    }
  }

  /**
   * Habilita a rede de forma segura
   */
  async enableNetworkSafely(): Promise<void> {
    try {
      if (!this.networkEnabled) {
        await enableNetwork(db);
        this.networkEnabled = true;
        console.log('🌐 Rede Firestore habilitada');
      }
    } catch (error) {
      console.warn('Erro ao habilitar rede Firestore:', error);
    }
  }

  /**
   * Desabilita a rede temporariamente
   */
  async disableNetworkTemporarily(): Promise<void> {
    try {
      if (this.networkEnabled) {
        await disableNetwork(db);
        this.networkEnabled = false;
        console.log('🚫 Rede Firestore desabilitada temporariamente');
      }
    } catch (error) {
      console.warn('Erro ao desabilitar rede Firestore:', error);
    }
  }

  /**
   * Executa uma operação com rede habilitada
   */
  async withNetwork<T>(operation: () => Promise<T>): Promise<T> {
    await this.enableNetworkSafely();
    try {
      return await operation();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica se a rede está habilitada
   */
  isNetworkEnabled(): boolean {
    return this.networkEnabled;
  }
}

export const firestoreConfig = FirestoreConfig.getInstance();

/**
 * Hook para inicializar configurações do Firestore
 */
export const initializeFirestoreConfig = async (): Promise<void> => {
  await firestoreConfig.initializeForDevelopment();
};

/**
 * Wrapper para operações do Firestore que garante conectividade
 */
export const withFirestoreNetwork = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  return firestoreConfig.withNetwork(operation);
};