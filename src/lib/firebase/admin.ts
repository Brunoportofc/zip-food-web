// Placeholder para Firebase Admin
const createMockQuery = (): any => ({
  get: () => Promise.resolve({ 
    docs: [{ 
      id: 'mock-restaurant-id', 
      data: () => ({ 
        name: 'Mock Restaurant',
        title: 'Mock Title',
        message: 'Mock Message',
        type: 'info',
        timestamp: new Date(),
        read: false
      }),
      ref: { id: 'mock-restaurant-id' }
    }], 
    empty: false,
    size: 1
  }),
  where: (...args: any[]) => createMockQuery(),
  limit: (...args: any[]) => createMockQuery(),
  orderBy: (...args: any[]) => createMockQuery(),
});

const mockDb = {
  // Configurações do Firebase Admin serão implementadas posteriormente
  collection: (name: string) => ({
    get: () => Promise.resolve({
      docs: [{
        id: 'mock-doc-id',
        data: () => ({
          role: 'customer',
          name: 'Mock User',
          user_type: 'customer',
          displayName: 'Mock User',
          email: 'mock@example.com',
          restaurant_id: 'mock-restaurant-id',
          title: 'Mock Title',
          message: 'Mock Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          owner_id: 'mock-owner-id',
          customerId: 'mock-customer-id',
          restaurantId: 'mock-restaurant-id',
          paymentStatus: 'completed',
          paymentIntentId: 'mock-payment-intent-id',
          total: 25.99,
          paymentMethod: 'card',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          failureReason: null,
          paymentFailureReason: null,
          status: 'confirmed',
          delivery_driver_id: 'mock-driver-id',
          stripeAccountId: 'mock-stripe-account-id',
          order_id: 'mock-order-id',
          items: [],
          subtotal: 20.00,
          delivery_fee: 5.99,
          service_fee: 2.50,
          tax: 2.50,
          discount: 0,
          notes: 'Mock order notes',
          delivery_address: 'Mock delivery address',
          phone: '+55 11 99999-9999',
          estimated_delivery_time: 30,
          actual_delivery_time: null,
          rating: null,
          review: null,
          refund_amount: null,
          refund_reason: null,
          cancelled_by: null,
          cancelled_reason: null,
          prepared_at: null,
          picked_up_at: null,
          delivered_at: null,
          is_active: true
        }),
        ref: { id: 'mock-doc-id' }
      }],
      empty: false,
      size: 1
    }),
    doc: (id?: string) => ({
      id: id || 'mock-doc-id',
      get: () => Promise.resolve({ 
        exists: true,
        id: id || 'mock-doc-id',
        data: () => ({ 
          role: 'customer', 
          name: 'Mock User',
          user_type: 'customer',
          displayName: 'Mock User',
          email: 'mock@example.com',
          restaurant_id: 'mock-restaurant-id',
          title: 'Mock Title',
          message: 'Mock Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          owner_id: 'mock-owner-id',
          customerId: 'mock-customer-id',
          restaurantId: 'mock-restaurant-id',
          paymentStatus: 'completed',
          paymentIntentId: 'mock-payment-intent-id',
          total: 25.99,
          paymentMethod: 'card',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          failureReason: null,
          paymentFailureReason: null,
          status: 'confirmed',
          delivery_driver_id: 'mock-driver-id',
          stripeAccountId: 'mock-stripe-account-id',
          order_id: 'mock-order-id',
          items: [],
          subtotal: 20.00,
          delivery_fee: 5.99,
          service_fee: 2.50,
          tax: 2.50,
          discount: 0,
          notes: 'Mock order notes',
          delivery_address: 'Mock delivery address',
          phone: '+55 11 99999-9999',
          estimated_delivery_time: 30,
          actual_delivery_time: null,
          rating: null,
          review: null,
          refund_amount: null,
          refund_reason: null,
          cancelled_by: null,
          cancelled_reason: null,
          prepared_at: null,
          picked_up_at: null,
          delivered_at: null,
          is_active: true
        })
      }),
      set: () => Promise.resolve(),
      update: (...args: any[]) => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
    add: (...args: any[]) => Promise.resolve({ 
      id: 'placeholder',
      get: () => Promise.resolve({ 
        id: 'placeholder', 
        data: () => ({ name: 'Mock Item' })
      })
    }),
    where: (...args: any[]) => createMockQuery(),
  }),
  batch: () => ({
    delete: (...args: any[]) => {},
    update: (...args: any[]) => {},
    set: (...args: any[]) => {},
    commit: () => Promise.resolve(),
  }),
};

export const db = mockDb;
export const adminDb = mockDb;
export const adminAuth = {
  verifyIdToken: () => Promise.resolve({ uid: 'placeholder' }),
  createCustomToken: () => Promise.resolve('placeholder-token'),
  setCustomUserClaims: (...args: any[]) => Promise.resolve(),
  createSessionCookie: () => Promise.resolve('placeholder-session-cookie'),
  verifySessionCookie: () => Promise.resolve({
    uid: 'placeholder',
    iss: 'placeholder',
    aud: 'placeholder',
    exp: Date.now() / 1000 + 3600,
    isRestaurant: false,
    hasRestaurant: false,
    restaurantId: null,
    email: 'mock@example.com'
  }),
  getUser: (...args: any[]) => Promise.resolve({
    uid: 'mock-user-id',
    customClaims: {
      hasRestaurant: true,
      restaurantId: 'mock-restaurant-id'
    }
  }),
};

export const verifySessionCookie = () => Promise.resolve({ uid: 'placeholder' });

export default mockDb;