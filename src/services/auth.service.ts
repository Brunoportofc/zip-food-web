// src/services/auth.service.ts
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// ... (Mantenha suas interfaces UserData, SignUpData, etc. aqui) ...
export type UserType = 'customer' | 'restaurant' | 'delivery_driver';

export interface UserData {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: any;
  updated_at: any;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  user_type: UserType;
  phone?: string;
}

// ... (outras interfaces) ...

class AuthService {
  // ... (código dos métodos do lado do cliente como signIn, signOutUser, etc. aqui) ...

  /**
   * CADASTRAR NOVO USUÁRIO (LÓGICA DE BACKEND)
   * Chamado pela API Route, usa o Admin SDK.
   */
  async signUp(data: SignUpData): Promise<any> { // Definir um tipo de retorno melhor
    try {
      console.log('🚀 [Admin SDK] Iniciando cadastro...');
      
      const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      });
      console.log('✅ [Admin SDK] Usuário criado no Auth:', userRecord.uid);

      const userData: UserData = {
        id: userRecord.uid,
        email: data.email,
        name: data.name,
        user_type: data.user_type,
        phone: data.phone || '',
        status: 'active',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      const batch = adminDb.batch();
      const userDocRef = adminDb.collection('users').doc(userRecord.uid);
      batch.set(userDocRef, userData);

      // Adicionar lógicas para criar documentos em 'customers', 'restaurants', etc.
      // ...

      await batch.commit();
      console.log('✅ [Admin SDK] Documentos criados no Firestore!');

      return { success: true, user: userData };
    } catch (error: any) {
      console.error('❌ [Admin SDK] Erro no cadastro:', error);
      // Retornar um objeto de erro padronizado
      return { success: false, error: error.message };
    }
  }

  // ... (Mantenha os outros métodos que são para o cliente aqui) ...
}

export const authService = new AuthService();