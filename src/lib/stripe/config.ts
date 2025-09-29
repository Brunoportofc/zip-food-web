import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with Connect capabilities
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe Connect configuration
export const stripeConfig = {
  // Platform application fee (percentage)
  platformFeePercent: 5, // 5% platform fee
  
  // Currency
  currency: 'brl',
  
  // Connect account types
  accountType: 'express' as const, // Express accounts for easier onboarding
  
  // Webhook endpoints
  webhookEndpoints: {
    connect: '/api/stripe/webhook/connect',
    payments: '/api/stripe/webhook/payments',
  },
  
  // Return URLs for Connect onboarding
  returnUrls: {
    success: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/stripe/success`,
    failure: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/stripe/failure`,
    refresh: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/stripe/refresh`,
  },
  
  // Required capabilities for restaurant accounts
  capabilities: [
    'card_payments',
    'transfers',
  ] as Stripe.AccountCreateParams.Capabilities[],
  
  // Business type for restaurants
  businessType: 'company' as const,
  
  // Required information for Brazilian accounts
  requiredFields: {
    business_profile: {
      mcc: '5812', // Eating Places and Restaurants
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
    tos_acceptance: {
      service_agreement: 'recipient',
    },
  },
};

// Helper function to calculate platform fee
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * (stripeConfig.platformFeePercent / 100));
};

// Helper function to calculate restaurant amount after fees
export const calculateRestaurantAmount = (totalAmount: number): number => {
  const platformFee = calculatePlatformFee(totalAmount);
  return totalAmount - platformFee;
};

export default stripe;