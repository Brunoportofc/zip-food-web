import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with Connect support
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe Connect configuration
export const stripeConnect = {
  // Create Connect account for restaurant
  createConnectAccount: async (restaurantData: {
    email: string;
    businessName: string;
    country?: string;
    type?: 'express' | 'standard' | 'custom';
  }) => {
    try {
      const account = await stripe.accounts.create({
        type: restaurantData.type || 'express',
        country: restaurantData.country || 'BR',
        email: restaurantData.email,
        business_type: 'company',
        company: {
          name: restaurantData.businessName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  },

  // Create account link for onboarding
  createAccountLink: async (accountId: string, refreshUrl: string, returnUrl: string) => {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  },

  // Get account status
  getAccountStatus: async (accountId: string) => {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  },

  // Create payment intent with Connect
  createPaymentIntent: async (params: {
    amount: number; // in cents
    currency?: string;
    connectedAccountId: string;
    applicationFeeAmount?: number; // platform fee in cents
    metadata?: Record<string, string>;
  }) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'brl',
        application_fee_amount: params.applicationFeeAmount,
        metadata: params.metadata,
        transfer_data: {
          destination: params.connectedAccountId,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Create direct charge (alternative to payment intent)
  createDirectCharge: async (params: {
    amount: number;
    currency?: string;
    connectedAccountId: string;
    applicationFeeAmount?: number;
    source: string; // payment method
    metadata?: Record<string, string>;
  }) => {
    try {
      const charge = await stripe.charges.create({
        amount: params.amount,
        currency: params.currency || 'brl',
        source: params.source,
        application_fee_amount: params.applicationFeeAmount,
        metadata: params.metadata,
      }, {
        stripeAccount: params.connectedAccountId,
      });

      return charge;
    } catch (error) {
      console.error('Error creating direct charge:', error);
      throw error;
    }
  },

  // Create transfer to connected account
  createTransfer: async (params: {
    amount: number;
    currency?: string;
    destination: string;
    metadata?: Record<string, string>;
  }) => {
    try {
      const transfer = await stripe.transfers.create({
        amount: params.amount,
        currency: params.currency || 'brl',
        destination: params.destination,
        metadata: params.metadata,
      });

      return transfer;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  },

  // Get balance for connected account
  getBalance: async (connectedAccountId: string) => {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: connectedAccountId,
      });

      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  },

  // List transactions for connected account
  getTransactions: async (connectedAccountId: string, limit = 10) => {
    try {
      const transactions = await stripe.balanceTransactions.list({
        limit,
      }, {
        stripeAccount: connectedAccountId,
      });

      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },
};

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

// Helper functions
export const formatCurrency = (amount: number, currency = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Stripe uses cents
};

export const convertToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const convertFromCents = (amount: number): number => {
  return amount / 100;
};

export default stripe;