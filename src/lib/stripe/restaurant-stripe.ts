import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

export interface RestaurantStripeKeys {
  id: string;
  restaurantId: string;
  stripePublishableKey: string;
  stripeSecretKey: string; // Encrypted
  isActive: boolean;
  isVerified: boolean;
  accountId?: string; // Stripe Account ID
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
}

export class RestaurantStripeService {
  
  /**
   * Save restaurant Stripe keys
   */
  async saveStripeKeys(
    restaurantId: string,
    publishableKey: string,
    secretKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔑 [Restaurant Stripe] Salvando chaves para restaurante:', restaurantId);

      // Validate keys format
      if (!publishableKey.startsWith('pk_')) {
        return { success: false, error: 'Chave pública inválida. Deve começar com pk_' };
      }

      if (!secretKey.startsWith('sk_')) {
        return { success: false, error: 'Chave secreta inválida. Deve começar com sk_' };
      }

      // Test keys by creating a Stripe instance
      const testStripe = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
        typescript: true,
      });

      // Verify keys work by retrieving account
      const account = await testStripe.accounts.retrieve();
      console.log('✅ [Restaurant Stripe] Chaves verificadas para conta:', account.id);

      // Encrypt secret key (simple base64 for now - use proper encryption in production)
      const encryptedSecretKey = Buffer.from(secretKey).toString('base64');

      // Check if keys already exist
      const existingSnapshot = await adminDb
        .collection('restaurant_stripe_keys')
        .where('restaurantId', '==', restaurantId)
        .get();

      const keysData: Omit<RestaurantStripeKeys, 'id'> = {
        restaurantId,
        stripePublishableKey: publishableKey,
        stripeSecretKey: encryptedSecretKey,
        isActive: true,
        isVerified: true,
        accountId: account.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastVerifiedAt: new Date(),
      };

      if (!existingSnapshot.empty) {
        // Update existing
        const docRef = existingSnapshot.docs[0].ref;
        await docRef.update({
          ...keysData,
          createdAt: existingSnapshot.docs[0].data().createdAt, // Keep original creation date
        });
        console.log('✅ [Restaurant Stripe] Chaves atualizadas');
      } else {
        // Create new
        await adminDb.collection('restaurant_stripe_keys').add(keysData);
        console.log('✅ [Restaurant Stripe] Novas chaves salvas');
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao salvar chaves:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        if (error.message.includes('Invalid API Key')) {
          errorMessage = 'Chaves Stripe inválidas. Verifique se estão corretas.';
        } else if (error.message.includes('No such account')) {
          errorMessage = 'Conta Stripe não encontrada. Verifique as chaves.';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get restaurant Stripe keys
   */
  async getRestaurantStripeKeys(restaurantId: string): Promise<RestaurantStripeKeys | null> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_stripe_keys')
        .where('restaurantId', '==', restaurantId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        // Don't return the actual secret key for security
        stripeSecretKey: '***hidden***',
      } as RestaurantStripeKeys;

    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao buscar chaves:', error);
      return null;
    }
  }

  /**
   * Get decrypted secret key (for internal use only)
   */
  async getDecryptedSecretKey(restaurantId: string): Promise<string | null> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_stripe_keys')
        .where('restaurantId', '==', restaurantId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const data = snapshot.docs[0].data();
      
      // Decrypt secret key (simple base64 for now)
      const decryptedKey = Buffer.from(data.stripeSecretKey, 'base64').toString('utf-8');
      
      return decryptedKey;

    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao descriptografar chave:', error);
      return null;
    }
  }

  /**
   * Create Stripe instance for restaurant
   */
  async createStripeInstance(restaurantId: string): Promise<Stripe | null> {
    try {
      const secretKey = await this.getDecryptedSecretKey(restaurantId);
      
      if (!secretKey) {
        console.log('⚠️ [Restaurant Stripe] Chaves não encontradas para:', restaurantId);
        return null;
      }

      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
        typescript: true,
      });

      return stripe;

    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao criar instância Stripe:', error);
      return null;
    }
  }

  /**
   * Verify restaurant can receive payments
   */
  async canReceivePayments(restaurantId: string): Promise<boolean> {
    try {
      const stripeKeys = await this.getRestaurantStripeKeys(restaurantId);
      return stripeKeys?.isActive && stripeKeys?.isVerified || false;
    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao verificar pagamentos:', error);
      return false;
    }
  }

  /**
   * Delete restaurant Stripe keys
   */
  async deleteStripeKeys(restaurantId: string): Promise<boolean> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_stripe_keys')
        .where('restaurantId', '==', restaurantId)
        .get();

      const batch = adminDb.batch();
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          isActive: false, 
          updatedAt: new Date() 
        });
      });

      await batch.commit();

      console.log('✅ [Restaurant Stripe] Chaves desativadas para:', restaurantId);
      return true;

    } catch (error) {
      console.error('❌ [Restaurant Stripe] Erro ao deletar chaves:', error);
      return false;
    }
  }
}

export const restaurantStripeService = new RestaurantStripeService();
