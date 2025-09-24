// src/types/firestore.ts
import { Timestamp } from 'firebase/firestore';

export interface BaseDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface User extends BaseDocument {
  email: string;
  name: string;
  userType: 'customer' | 'restaurant_owner' | 'delivery_driver' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface Customer extends BaseDocument {
  userId: string;
  addresses: Address[];
  preferences: {
    notifications: boolean;
    marketing: boolean;
  };
}

export interface Restaurant extends BaseDocument {
  ownerId: string;
  name: string;
  description: string;
  address: Address;
  phone: string;
  email: string;
  cuisine: string[];
  rating: number;
  isActive: boolean;
  openingHours: OpeningHours;
  deliveryRadius: number; // em km
  minimumOrder: number;
  deliveryFee: number;
  images: string[];
}

export interface DeliveryDriver extends BaseDocument {
  userId: string;
  vehicleType: 'bike' | 'motorcycle' | 'car';
  licensePlate: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  };
  rating: number;
  totalDeliveries: number;
}

export interface Order extends BaseDocument {
  customerId: string;
  restaurantId: string;
  driverId?: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryAddress: Address;
  estimatedDeliveryTime?: Timestamp;
  actualDeliveryTime?: Timestamp;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: {
    name: string;
    price: number;
  }[];
}

export interface MenuItem extends BaseDocument {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isAvailable: boolean;
  preparationTime: number; // em minutos
  ingredients: string[];
  allergens: string[];
  modifiers?: MenuModifier[];
}

export interface MenuModifier {
  name: string;
  options: {
    name: string;
    price: number;
  }[];
  required: boolean;
  maxSelections: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // "HH:mm"
  closeTime?: string; // "HH:mm"
}