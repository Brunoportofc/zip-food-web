// src/store/cart.store.ts
// Store Zustand para gerenciar estado global do carrinho

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  quantity: number;
  restaurantId: string;
  category?: string;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode: string;
}

export type PaymentMethod = 'cash' | 'card';

interface CartState {
  // Estado
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  isOpen: boolean;
  
  // Endereço e pagamento
  deliveryAddress: DeliveryAddress | null;
  paymentMethod: PaymentMethod;
  
  // Ações do carrinho
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  
  // Ações do menu lateral
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Configurações
  setRestaurantInfo: (restaurantId: string, restaurantName: string, deliveryFee: number) => void;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  
  // Getters
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  hasItems: () => boolean;
  canCheckout: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      isOpen: false,
      deliveryAddress: null,
      paymentMethod: 'card',

      // Ações do carrinho
      addItem: (newItem) => {
        const state = get();
        
        // Se for de um restaurante diferente, limpar carrinho primeiro
        if (state.restaurantId && state.restaurantId !== newItem.restaurantId) {
          set({
            items: [],
            restaurantId: newItem.restaurantId,
          });
        }

        set((state) => {
          const existingItem = state.items.find(item => item.id === newItem.id);
          
          if (existingItem) {
            // Incrementar quantidade do item existente
            return {
              items: state.items.map(item =>
                item.id === newItem.id 
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              restaurantId: newItem.restaurantId,
            };
          } else {
            // Adicionar novo item
            return {
              items: [...state.items, { ...newItem, quantity: 1 }],
              restaurantId: newItem.restaurantId,
            };
          }
        });

        console.log('🛒 [Cart Store] Item adicionado:', newItem.name);
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
        console.log('🛒 [Cart Store] Item removido:', itemId);
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId 
              ? { ...item, quantity }
              : item
          )
        }));
        console.log('🛒 [Cart Store] Quantidade atualizada:', itemId, quantity);
      },

      clearCart: () => {
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          deliveryFee: 0,
          isOpen: false,
        });
        console.log('🛒 [Cart Store] Carrinho limpo');
      },

      // Ações do menu lateral
      openCart: () => {
        set({ isOpen: true });
        console.log('🛒 [Cart Store] Carrinho aberto');
      },

      closeCart: () => {
        set({ isOpen: false });
        console.log('🛒 [Cart Store] Carrinho fechado');
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
        console.log('🛒 [Cart Store] Carrinho alternado');
      },

      // Configurações
      setRestaurantInfo: (restaurantId, restaurantName, deliveryFee) => {
        set({ restaurantId, restaurantName, deliveryFee });
        console.log('🛒 [Cart Store] Info do restaurante definida:', restaurantName);
      },

      setDeliveryAddress: (address) => {
        set({ deliveryAddress: address });
        console.log('🛒 [Cart Store] Endereço definido:', address.street);
      },

      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
        console.log('🛒 [Cart Store] Método de pagamento definido:', method);
      },

      // Getters
      getItemQuantity: (itemId) => {
        const state = get();
        return state.items.find(item => item.id === itemId)?.quantity || 0;
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.deliveryFee;
      },

      hasItems: () => {
        const state = get();
        return state.items.length > 0;
      },

      canCheckout: () => {
        const state = get();
        return state.hasItems() && state.deliveryAddress !== null;
      },
    }),
    {
      name: 'cart-storage',
      // Não persistir o estado de abertura do menu
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        deliveryFee: state.deliveryFee,
        deliveryAddress: state.deliveryAddress,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);
