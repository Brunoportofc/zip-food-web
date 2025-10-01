import { stripe, stripeConfig } from './config';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

export interface RestaurantPayout {
  id: string;
  restaurantId: string;
  amount: number; // Amount in cents (agurot for ILS)
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  orderId?: string;
  paymentIntentId: string;
  scheduledDate: Date;
  processedDate?: Date;
  transferId?: string; // Stripe transfer ID
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantBankInfo {
  id: string;
  restaurantId: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  isActive: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PayoutSystemService {
  
  /**
   * Process a payment and schedule payout to restaurant
   */
  async processPaymentAndSchedulePayout(
    orderId: string,
    restaurantId: string,
    totalAmount: number,
    paymentIntentId: string
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      console.log('💰 [Payout System] Processando pagamento e agendando repasse:', {
        orderId,
        restaurantId,
        totalAmount,
        paymentIntentId
      });

      // Calculate restaurant amount (total - platform fee)
      const platformFee = Math.round(totalAmount * (stripeConfig.platformFeePercent / 100));
      const restaurantAmount = totalAmount - platformFee;

      console.log('💰 [Payout System] Cálculo de valores:', {
        totalAmount,
        platformFee,
        restaurantAmount,
        platformFeePercent: stripeConfig.platformFeePercent
      });

      // Create payout record
      const payoutData: Omit<RestaurantPayout, 'id'> = {
        restaurantId,
        amount: restaurantAmount,
        currency: stripeConfig.currency,
        status: 'pending',
        orderId,
        paymentIntentId,
        scheduledDate: this.calculateNextPayoutDate(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payoutDoc = await adminDb.collection('restaurant_payouts').add(payoutData);
      
      console.log('✅ [Payout System] Repasse agendado:', payoutDoc.id);

      // Check if we should process immediately or wait for schedule
      if (stripeConfig.payoutSettings.payoutSchedule === 'daily') {
        await this.processScheduledPayouts();
      }

      return { success: true, payoutId: payoutDoc.id };

    } catch (error) {
      console.error('❌ [Payout System] Erro ao processar pagamento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process all scheduled payouts
   */
  async processScheduledPayouts(): Promise<void> {
    try {
      console.log('🔄 [Payout System] Processando repasses agendados...');

      const now = new Date();
      
      // Get all pending payouts that are due
      const payoutsSnapshot = await adminDb
        .collection('restaurant_payouts')
        .where('status', '==', 'pending')
        .where('scheduledDate', '<=', now)
        .get();

      if (payoutsSnapshot.empty) {
        console.log('ℹ️ [Payout System] Nenhum repasse pendente encontrado');
        return;
      }

      console.log(`📊 [Payout System] Processando ${payoutsSnapshot.docs.length} repasses`);

      // Group payouts by restaurant for batch processing
      const payoutsByRestaurant = new Map<string, any[]>();
      
      payoutsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const restaurantId = data.restaurantId;
        
        if (!payoutsByRestaurant.has(restaurantId)) {
          payoutsByRestaurant.set(restaurantId, []);
        }
        
        payoutsByRestaurant.get(restaurantId)!.push({
          id: doc.id,
          ...data
        });
      });

      // Process payouts for each restaurant
      for (const [restaurantId, payouts] of payoutsByRestaurant) {
        await this.processRestaurantPayouts(restaurantId, payouts);
      }

    } catch (error) {
      console.error('❌ [Payout System] Erro ao processar repasses agendados:', error);
    }
  }

  /**
   * Process payouts for a specific restaurant
   */
  private async processRestaurantPayouts(restaurantId: string, payouts: any[]): Promise<void> {
    try {
      console.log(`🏪 [Payout System] Processando repasses para restaurante ${restaurantId}`);

      // Get restaurant bank info
      const bankInfo = await this.getRestaurantBankInfo(restaurantId);
      
      if (!bankInfo) {
        console.log(`⚠️ [Payout System] Informações bancárias não encontradas para ${restaurantId}`);
        await this.markPayoutsAsFailed(payouts, 'Bank information not configured');
        return;
      }

      // Calculate total amount
      const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Check minimum payout amount
      if (totalAmount < stripeConfig.payoutSettings.minimumPayoutAmount) {
        console.log(`💰 [Payout System] Valor abaixo do mínimo para ${restaurantId}: ${totalAmount}`);
        return; // Keep as pending, will be processed when minimum is reached
      }

      // Create Stripe transfer (simulate payout)
      const transferResult = await this.createStripeTransfer(restaurantId, totalAmount, bankInfo);
      
      if (transferResult.success) {
        // Mark payouts as completed
        await this.markPayoutsAsCompleted(payouts, transferResult.transferId!);
        console.log(`✅ [Payout System] Repasse concluído para ${restaurantId}: ${totalAmount} ${stripeConfig.currency.toUpperCase()}`);
      } else {
        // Mark payouts as failed
        await this.markPayoutsAsFailed(payouts, transferResult.error!);
        console.log(`❌ [Payout System] Repasse falhou para ${restaurantId}: ${transferResult.error}`);
      }

    } catch (error) {
      console.error(`❌ [Payout System] Erro ao processar repasses do restaurante ${restaurantId}:`, error);
      await this.markPayoutsAsFailed(payouts, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Create a simulated Stripe transfer (in real implementation, this would be actual bank transfer)
   */
  private async createStripeTransfer(
    restaurantId: string, 
    amount: number, 
    bankInfo: RestaurantBankInfo
  ): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      // In a real implementation, you would:
      // 1. Create a bank account object in Stripe
      // 2. Create a transfer to that bank account
      // 3. For now, we'll simulate this with a unique ID
      
      const transferId = `transfer_${Date.now()}_${restaurantId}`;
      
      console.log(`💸 [Payout System] Transferência simulada criada:`, {
        transferId,
        amount,
        currency: stripeConfig.currency,
        restaurantId,
        bankAccount: `***${bankInfo.accountNumber.slice(-4)}`
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, transferId };

    } catch (error) {
      console.error('❌ [Payout System] Erro ao criar transferência:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transfer failed' 
      };
    }
  }

  /**
   * Get restaurant bank information
   */
  async getRestaurantBankInfo(restaurantId: string): Promise<RestaurantBankInfo | null> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_bank_info')
        .where('restaurantId', '==', restaurantId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as RestaurantBankInfo;

    } catch (error) {
      console.error('❌ [Payout System] Erro ao buscar informações bancárias:', error);
      return null;
    }
  }

  /**
   * Save or update restaurant bank information
   */
  async saveRestaurantBankInfo(bankInfo: Omit<RestaurantBankInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Deactivate existing bank info
      const existingSnapshot = await adminDb
        .collection('restaurant_bank_info')
        .where('restaurantId', '==', bankInfo.restaurantId)
        .get();

      const batch = adminDb.batch();
      
      existingSnapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
      });

      // Add new bank info
      const newBankInfo = {
        ...bankInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newDoc = adminDb.collection('restaurant_bank_info').doc();
      batch.set(newDoc, newBankInfo);

      await batch.commit();

      console.log('✅ [Payout System] Informações bancárias salvas:', newDoc.id);
      return newDoc.id;

    } catch (error) {
      console.error('❌ [Payout System] Erro ao salvar informações bancárias:', error);
      throw error;
    }
  }

  /**
   * Mark payouts as completed
   */
  private async markPayoutsAsCompleted(payouts: any[], transferId: string): Promise<void> {
    const batch = adminDb.batch();
    const now = new Date();

    payouts.forEach(payout => {
      const docRef = adminDb.collection('restaurant_payouts').doc(payout.id);
      batch.update(docRef, {
        status: 'completed',
        transferId,
        processedDate: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  /**
   * Mark payouts as failed
   */
  private async markPayoutsAsFailed(payouts: any[], errorMessage: string): Promise<void> {
    const batch = adminDb.batch();
    const now = new Date();

    payouts.forEach(payout => {
      const docRef = adminDb.collection('restaurant_payouts').doc(payout.id);
      batch.update(docRef, {
        status: 'failed',
        errorMessage,
        processedDate: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  /**
   * Calculate next payout date based on schedule
   */
  private calculateNextPayoutDate(): Date {
    const now = new Date();
    
    switch (stripeConfig.payoutSettings.payoutSchedule) {
      case 'daily':
        // Next day at 9 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
        
      case 'weekly':
        // Next Friday at 9 AM
        const nextFriday = new Date(now);
        const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
        nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
        nextFriday.setHours(9, 0, 0, 0);
        return nextFriday;
        
      default:
        // Manual - set to far future
        const manual = new Date('2099-12-31');
        return manual;
    }
  }

  /**
   * Get restaurant payout history
   */
  async getRestaurantPayoutHistory(restaurantId: string, limit: number = 50): Promise<RestaurantPayout[]> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_payouts')
        .where('restaurantId', '==', restaurantId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as RestaurantPayout[];

    } catch (error) {
      console.error('❌ [Payout System] Erro ao buscar histórico de repasses:', error);
      return [];
    }
  }

  /**
   * Get restaurant pending earnings
   */
  async getRestaurantPendingEarnings(restaurantId: string): Promise<{ amount: number; count: number }> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_payouts')
        .where('restaurantId', '==', restaurantId)
        .where('status', '==', 'pending')
        .get();

      const amount = snapshot.docs.reduce((sum: number, doc: any) => sum + doc.data().amount, 0);
      const count = snapshot.docs.length;

      return { amount, count };

    } catch (error) {
      console.error('❌ [Payout System] Erro ao buscar ganhos pendentes:', error);
      return { amount: 0, count: 0 };
    }
  }
}

export const payoutSystemService = new PayoutSystemService();
