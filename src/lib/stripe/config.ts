import Stripe from 'stripe';

// Mock para deploy - usar chave fake se não estiver definida
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ [Stripe Config] STRIPE_SECRET_KEY não está definida - usando mock para build');
}

console.log('🔍 [Stripe Config] Inicializando Stripe para Israel:', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  keyPrefix: STRIPE_SECRET_KEY?.substring(0, 7),
  apiVersion: '2025-08-27.basil'
});

// Initialize Stripe for normal payments (without Connect)
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

console.log('✅ [Stripe Config] Stripe inicializado com sucesso para Israel');

// Stripe configuration for Israel-based platform
export const stripeConfig = {
  // Platform fee percentage that goes to the main account
  platformFeePercent: 5, // 5% platform fee
  
  // Currency for Israel
  currency: 'ils', // Israeli Shekel
  
  // Webhook endpoints
  webhookEndpoints: {
    payments: '/api/stripe/webhook/payments',
  },
  
  // Payment success/failure URLs
  returnUrls: {
    success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
  },
  
  // Payment settings
  paymentMethods: ['card'] as Stripe.PaymentMethodCreateParams.Type[],
  
  // Automatic payout settings for restaurants
  payoutSettings: {
    // When to automatically pay restaurants
    payoutSchedule: 'weekly', // weekly, daily, or manual
    // Minimum amount to trigger payout
    minimumPayoutAmount: 100, // 100 ILS minimum
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
