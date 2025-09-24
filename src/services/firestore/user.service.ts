// src/services/firestore/user.service.ts
import { firestoreService } from '@/lib/firebase/firestore.service';
import { User } from '@/types/firestore';
import { where } from 'firebase/firestore';

export class UserFirestoreService {
  private collection = 'users';

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    return await firestoreService.create(this.collection, userData);
  }

  async getUserById(id: string): Promise<User | null> {
    return await firestoreService.getById<User>(this.collection, id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await firestoreService.getWhere<User>(
      this.collection, 
      'email', 
      '==', 
      email
    );
    return users.length > 0 ? users[0] : null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await firestoreService.update(this.collection, id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await firestoreService.delete(this.collection, id);
  }

  async getUsersByType(userType: User['userType']): Promise<User[]> {
    return await firestoreService.getWhere<User>(
      this.collection,
      'userType',
      '==',
      userType
    );
  }

  async getActiveUsers(): Promise<User[]> {
    return await firestoreService.getWhere<User>(
      this.collection,
      'isActive',
      '==',
      true
    );
  }
}

export const userFirestoreService = new UserFirestoreService();