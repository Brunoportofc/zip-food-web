// src/services/firestore/restaurant.service.ts
import { firestoreService } from '@/lib/firebase/firestore.service';
import { Restaurant } from '@/types/firestore';
import { where, orderBy, limit as limitQuery } from 'firebase/firestore';

export class RestaurantFirestoreService {
  private collection = 'restaurants';

  async createRestaurant(restaurantData: Omit<Restaurant, 'id'>): Promise<string> {
    return await firestoreService.create(this.collection, restaurantData);
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    return await firestoreService.getById<Restaurant>(this.collection, id);
  }

  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return await firestoreService.getWhere<Restaurant>(
      this.collection,
      'ownerId',
      '==',
      ownerId
    );
  }

  async getActiveRestaurants(): Promise<Restaurant[]> {
    return await firestoreService.getWhere<Restaurant>(
      this.collection,
      'isActive',
      '==',
      true
    );
  }

  async getRestaurantsByCuisine(cuisine: string): Promise<Restaurant[]> {
    return await firestoreService.getWhere<Restaurant>(
      this.collection,
      'cuisine',
      'array-contains',
      cuisine
    );
  }

  async getTopRatedRestaurants(limit: number = 10): Promise<Restaurant[]> {
    return await firestoreService.getWithQuery<Restaurant>(
      this.collection,
      [
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        limitQuery(limit)
      ]
    );
  }

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
    await firestoreService.update(this.collection, id, data);
  }

  async deleteRestaurant(id: string): Promise<void> {
    await firestoreService.delete(this.collection, id);
  }

  // Real-time listener para restaurantes ativos
  onActiveRestaurantsChange(callback: (restaurants: Restaurant[]) => void): () => void {
    return firestoreService.onSnapshot<Restaurant>(
      this.collection,
      callback,
      [where('isActive', '==', true)]
    );
  }
}

export const restaurantFirestoreService = new RestaurantFirestoreService();