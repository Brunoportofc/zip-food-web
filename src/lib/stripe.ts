// Placeholder para Stripe
export const stripe = {
  // Configurações do Stripe serão implementadas posteriormente
};

export const getBalance = async (...args: any[]) => {
  return { 
    available: [{ amount: 0, currency: 'brl' }],
    pending: [{ amount: 0, currency: 'brl' }]
  };
};

export const listTransactions = async (...args: any[]) => {
  return { data: [] };
};

export const verifyWebhookSignature = (payload: any, signature: string, secret: string) => {
  // Placeholder para verificação de webhook
  return {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_mock_123',
        amount: 2500,
        currency: 'brl',
        status: 'succeeded'
      }
    }
  };
};

export const stripeConnect = {
  // Configurações do Stripe Connect
};
