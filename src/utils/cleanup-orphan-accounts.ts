// src/utils/cleanup-orphan-accounts.ts
// Utilitário para limpar contas órfãs do Firebase Authentication

import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface CleanupResult {
  success: boolean;
  message: string;
  accountDeleted?: boolean;
}

/**
 * Tenta limpar uma conta órfã (existe no Auth mas não no Firestore)
 */
export async function cleanupOrphanAccount(email: string, password: string): Promise<CleanupResult> {
  try {
    console.log('🧹 Tentando limpar conta órfã:', email);

    // Salvar o usuário atual (se houver)
    const currentUser = auth.currentUser;

    // Tentar fazer login com as credenciais da conta órfã
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Login realizado para verificação:', user.uid);

    try {
      // Verificar se os dados existem no Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('⚠️ Conta órfã detectada. Removendo...');
        
        // Deletar a conta órfã
        await deleteUser(user);
        console.log('🗑️ Conta órfã removida com sucesso');
        
        // Fazer logout para limpar o estado
        await signOut(auth);
        
        return {
          success: true,
          message: 'Conta órfã removida. Agora você pode criar uma nova conta com este email.',
          accountDeleted: true
        };
      } else {
        console.log('✅ Conta válida encontrada no Firestore');
        
        // Fazer logout da conta verificada
        await signOut(auth);
        
        return {
          success: true,
          message: 'Esta conta já existe e está válida. Use o login normal.',
          accountDeleted: false
        };
      }
    } catch (firestoreError: any) {
      console.error('❌ Erro ao verificar Firestore:', firestoreError);
      
      // Se der erro de permissão no Firestore, assumir que é conta órfã
      if (firestoreError.code === 'permission-denied' || 
          firestoreError.message?.includes('Missing or insufficient permissions')) {
        
        console.log('⚠️ Erro de permissão detectado - assumindo conta órfã. Removendo...');
        
        try {
          await deleteUser(user);
          console.log('🗑️ Conta órfã removida com sucesso');
          
          // Fazer logout para limpar o estado
          await signOut(auth);
          
          return {
            success: true,
            message: 'Conta órfã removida. Agora você pode criar uma nova conta com este email.',
            accountDeleted: true
          };
        } catch (deleteError: any) {
          console.error('❌ Erro ao deletar conta órfã:', deleteError);
          await signOut(auth);
          return {
            success: false,
            message: 'Erro ao remover conta órfã. Tente novamente.'
          };
        }
      }
      
      // Fazer logout em caso de erro
      await signOut(auth);
      throw firestoreError;
    }

  } catch (error: any) {
    console.error('❌ Erro ao limpar conta órfã:', error);
    
    if (error.code === 'auth/user-not-found') {
      return {
        success: true,
        message: 'Email não encontrado. Você pode criar uma nova conta.',
        accountDeleted: false
      };
    }
    
    if (error.code === 'auth/wrong-password') {
      return {
        success: false,
        message: 'Senha incorreta. Não foi possível verificar a conta.'
      };
    }
    
    if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        message: 'Email inválido.'
      };
    }

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      };
    }

    return {
      success: false,
      message: `Erro ao verificar conta: ${error.message}`
    };
  }
}

/**
 * Verifica se uma conta é órfã sem fazer login
 */
export async function checkIfOrphanAccount(email: string): Promise<boolean> {
  try {
    // Esta função seria mais complexa de implementar sem fazer login
    // Por enquanto, retornamos false para não assumir que é órfã
    return false;
  } catch (error) {
    console.error('Erro ao verificar conta órfã:', error);
    return false;
  }
}
