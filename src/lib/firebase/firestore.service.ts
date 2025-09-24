// src/lib/firebase/firestore.service.ts
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';
import { adminDb } from './admin';

export class FirestoreService {
  // Operações básicas de CRUD
  
  // CREATE - Adicionar documento
  async create<T>(collectionName: string, data: T): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  // CREATE com ID específico
  async createWithId<T>(collectionName: string, id: string, data: T): Promise<void> {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao criar documento com ID:', error);
      throw error;
    }
  }

  // READ - Buscar documento por ID
  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      throw error;
    }
  }

  // READ - Buscar todos os documentos
  async getAll<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw error;
    }
  }

  // READ - Buscar com filtros
  async getWhere<T>(
    collectionName: string, 
    field: string, 
    operator: any, 
    value: any
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Erro ao buscar com filtro:', error);
      throw error;
    }
  }

  // READ - Buscar com query complexa
  async getWithQuery<T>(
    collectionName: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Erro ao buscar com query:', error);
      throw error;
    }
  }

  // UPDATE - Atualizar documento
  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  // DELETE - Deletar documento
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  // REAL-TIME - Escutar mudanças em tempo real
  onSnapshot<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints?: QueryConstraint[]
  ): () => void {
    const q = constraints 
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }

  // ADMIN - Operações server-side
  async adminCreate<T>(collectionName: string, data: T): Promise<string> {
    try {
      const docRef = await adminDb.collection(collectionName).add({
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar documento (admin):', error);
      throw error;
    }
  }

  async adminGetById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const doc = await adminDb.collection(collectionName).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar documento (admin):', error);
      throw error;
    }
  }

  async adminUpdate<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      await adminDb.collection(collectionName).doc(id).update({
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar documento (admin):', error);
      throw error;
    }
  }
}

// Instância singleton
export const firestoreService = new FirestoreService();