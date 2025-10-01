import { stripe } from './config';
import { adminDb } from '@/lib/firebase-admin';

export interface PayoutSchedule {
  interval: 'daily' | 'weekly' | 'monthly' | 'manual';
  weeklyAnchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  monthlyAnchor?: number; // Day of month (1-31)
  minimumAmount?: number; // Minimum amount in BRL before payout
}

export interface PayoutSettings {
  restaurantId: string;
  stripeAccountId: string;
  schedule: PayoutSchedule;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configure automatic payout schedule for a restaurant
 */
export async function configurePayoutSchedule(
  restaurantId: string,
  stripeAccountId: string,
  schedule: PayoutSchedule
): Promise<void> {
  try {
    // Update Stripe account payout schedule
    await stripe.accounts.update(stripeAccountId, {
      settings: {
        payouts: {
          schedule: {
            interval: schedule.interval === 'manual' ? 'manual' : schedule.interval,
            weekly_anchor: schedule.weeklyAnchor,
            monthly_anchor: schedule.monthlyAnchor,
          },
        },
      },
    });

    // Save settings to database
    const payoutSettings: PayoutSettings = {
      restaurantId,
      stripeAccountId,
      schedule,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb
      .collection('payoutSettings')
      .doc(restaurantId)
      .set(payoutSettings);

    console.log(`Payout schedule configured for restaurant: ${restaurantId}`);
  } catch (error) {
    console.error('Error configuring payout schedule:', error);
    throw error;
  }
}

/**
 * Get payout settings for a restaurant
 */
export async function getPayoutSettings(restaurantId: string): Promise<PayoutSettings | null> {
  try {
    const doc = await adminDb
      .collection('payoutSettings')
      .doc(restaurantId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as PayoutSettings;
    return {
      ...data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error getting payout settings:', error);
    return null;
  }
}

/**
 * Create manual payout for a restaurant
 */
export async function createManualPayout(
  restaurantId: string,
  stripeAccountId: string,
  amount?: number
): Promise<any> {
  try {
    // Get current balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    const availableAmount = balance.available.find(b => b.currency === 'brl')?.amount || 0;
    
    if (availableAmount === 0) {
      throw new Error('No available balance for payout');
    }

    const payoutAmount = amount ? Math.round(amount * 100) : availableAmount;

    if (payoutAmount > availableAmount) {
      throw new Error('Insufficient balance for requested payout amount');
    }

    // Create payout
    const payout = await stripe.payouts.create({
      amount: payoutAmount,
      currency: 'brl',
      method: 'standard',
    }, {
      stripeAccount: stripeAccountId,
    });

    // Log payout in database
    await adminDb.collection('payouts').add({
      restaurantId,
      stripeAccountId,
      stripePayoutId: payout.id,
      amount: payoutAmount / 100,
      currency: 'brl',
      status: payout.status,
      method: payout.method,
      type: 'manual',
      arrivalDate: new Date(payout.arrival_date * 1000),
      createdAt: new Date(),
    });

    // Create notification
    await adminDb.collection('notifications').add({
      type: 'payout.created',
      recipientId: restaurantId,
      recipientType: 'restaurant',
      title: 'Saque Criado',
      message: `Saque de R$ ${(payoutAmount / 100).toFixed(2)} foi processado`,
      data: {
        payoutId: payout.id,
        amount: payoutAmount / 100,
        currency: 'brl',
        method: payout.method,
        arrivalDate: payout.arrival_date,
      },
      read: false,
      createdAt: new Date(),
    });

    return payout;
  } catch (error) {
    console.error('Error creating manual payout:', error);
    throw error;
  }
}

/**
 * Get payout history for a restaurant
 */
export async function getPayoutHistory(
  restaurantId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const payoutsSnapshot = await adminDb
      .collection('payouts')
      .where('restaurantId', '==', restaurantId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return payoutsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      arrivalDate: doc.data().arrivalDate?.toDate?.()?.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting payout history:', error);
    return [];
  }
}

/**
 * Check if restaurant can receive payouts
 */
export async function canReceivePayouts(stripeAccountId: string): Promise<boolean> {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    return account.payouts_enabled === true;
  } catch (error) {
    console.error('Error checking payout capability:', error);
    return false;
  }
}

/**
 * Get estimated payout date based on schedule
 */
export function getEstimatedPayoutDate(schedule: PayoutSchedule): Date {
  const now = new Date();
  const estimatedDate = new Date(now);

  switch (schedule.interval) {
    case 'daily':
      estimatedDate.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      const daysUntilAnchor = getDaysUntilWeeklyAnchor(now, schedule.weeklyAnchor || 'monday');
      estimatedDate.setDate(now.getDate() + daysUntilAnchor);
      break;
    case 'monthly':
      const anchor = schedule.monthlyAnchor || 1;
      estimatedDate.setMonth(now.getMonth() + 1);
      estimatedDate.setDate(anchor);
      break;
    case 'manual':
      // No automatic payout
      return now;
  }

  return estimatedDate;
}

function getDaysUntilWeeklyAnchor(date: Date, anchor: string): number {
  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const currentDay = date.getDay();
  const targetDay = dayMap[anchor as keyof typeof dayMap];
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }
  
  return daysUntil;
}
