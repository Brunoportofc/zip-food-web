import { stripe, stripeConfig } from './config';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

export interface RestaurantStripeAccount {
  id: string;
  restaurantId: string;
  stripeAccountId: string;
  accountStatus: 'pending' | 'active' | 'restricted' | 'rejected';
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StripeConnectService {
  
  /**
   * Create a new Stripe Connect account for a restaurant
   */
  async createConnectAccount(restaurantId: string, restaurantData: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }): Promise<{ accountId: string; onboardingUrl: string }> {
    try {
      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: restaurantData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: restaurantData.name,
          phone: restaurantData.phone,
          address: {
            line1: restaurantData.address.street,
            city: restaurantData.address.city,
            state: restaurantData.address.state,
            postal_code: restaurantData.address.zipCode,
            country: 'BR',
          },
        },
        business_profile: {
          mcc: '5812', // Eating Places and Restaurants
          name: restaurantData.name,
          url: process.env.NEXT_PUBLIC_APP_URL,
        },
        tos_acceptance: {
          service_agreement: 'recipient',
        },
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: stripeConfig.returnUrls.refresh,
        return_url: stripeConfig.returnUrls.success,
        type: 'account_onboarding',
      });

      // Save account info to database
      const stripeAccountData: Omit<RestaurantStripeAccount, 'id'> = {
        restaurantId,
        stripeAccountId: account.id,
        accountStatus: 'pending',
        onboardingComplete: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await adminDb.collection('restaurant_stripe_accounts').add(stripeAccountData);

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw new Error('Failed to create Stripe Connect account');
    }
  }

  /**
   * Get restaurant's Stripe account information
   */
  async getRestaurantAccount(restaurantId: string): Promise<RestaurantStripeAccount | null> {
    try {
      const snapshot = await adminDb
        .collection('restaurant_stripe_accounts')
        .where('restaurantId', '==', restaurantId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as RestaurantStripeAccount;
    } catch (error) {
      console.error('Error getting restaurant account:', error);
      return null;
    }
  }

  /**
   * Update restaurant account status from Stripe webhook
   */
  async updateAccountStatus(stripeAccountId: string): Promise<void> {
    try {
      // Get account details from Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId);

      // Find the account in our database
      const snapshot = await adminDb
        .collection('restaurant_stripe_accounts')
        .where('stripeAccountId', '==', stripeAccountId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.error('Restaurant account not found for Stripe account:', stripeAccountId);
        return;
      }

      const doc = snapshot.docs[0];
      
      // Update account status
      await doc.ref.update({
        accountStatus: this.getAccountStatus(account),
        onboardingComplete: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }

  /**
   * Create a new onboarding link for existing account
   */
  async createOnboardingLink(restaurantId: string): Promise<string> {
    try {
      const account = await this.getRestaurantAccount(restaurantId);
      
      if (!account) {
        throw new Error('Restaurant account not found');
      }

      const accountLink = await stripe.accountLinks.create({
        account: account.stripeAccountId,
        refresh_url: stripeConfig.returnUrls.refresh,
        return_url: stripeConfig.returnUrls.success,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw new Error('Failed to create onboarding link');
    }
  }

  /**
   * Create login link for existing account dashboard
   */
  async createLoginLink(restaurantId: string): Promise<string> {
    try {
      const account = await this.getRestaurantAccount(restaurantId);
      
      if (!account) {
        throw new Error('Restaurant account not found');
      }

      const loginLink = await stripe.accounts.createLoginLink(account.stripeAccountId);
      return loginLink.url;
    } catch (error) {
      console.error('Error creating login link:', error);
      throw new Error('Failed to create login link');
    }
  }

  /**
   * Check if restaurant can receive payments
   */
  async canReceivePayments(restaurantId: string): Promise<boolean> {
    try {
      const account = await this.getRestaurantAccount(restaurantId);
      
      if (!account) {
        return false;
      }

      return account.chargesEnabled && account.onboardingComplete;
    } catch (error) {
      console.error('Error checking payment capability:', error);
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(restaurantId: string): Promise<Stripe.Balance | null> {
    try {
      const account = await this.getRestaurantAccount(restaurantId);
      
      if (!account) {
        return null;
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: account.stripeAccountId,
      });

      return balance;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return null;
    }
  }

  /**
   * Helper method to determine account status
   */
  private getAccountStatus(account: Stripe.Account): 'pending' | 'active' | 'restricted' | 'rejected' {
    if (account.charges_enabled && account.payouts_enabled) {
      return 'active';
    }
    
    if (account.requirements?.currently_due?.length > 0) {
      return 'pending';
    }
    
    if (account.requirements?.disabled_reason) {
      return 'restricted';
    }
    
    return 'pending';
  }
}

export const stripeConnectService = new StripeConnectService();