// Authentication types and utilities for the ZipFood application

// User types
export type UserType = 'customer' | 'restaurant' | 'delivery';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  user_type: UserType;
  role?: UserType; // For backward compatibility
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: any;
  updated_at: any;
  last_login?: any;
  
  // Restaurant-specific fields
  restaurant_id?: string;
  restaurant_name?: string;
  restaurant_status?: 'pending_approval' | 'approved' | 'rejected';
  
  // Delivery-specific fields
  delivery_status?: 'available' | 'busy' | 'offline';
  vehicle_type?: 'bike' | 'motorcycle' | 'car';
  
  // Permissions
  permissions?: string[];
}

// Authentication data interfaces
export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  role: UserType;
  user_type?: UserType; // For compatibility
}

// Response interfaces
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface AuthError {
  code: string;
  message: string;
}

// Display names for user types
export const userTypeDisplayNames: Record<UserType, string> = {
  customer: 'Cliente',
  restaurant: 'Restaurante',
  delivery: 'Entregador'
};

// Validation functions
export function isValidUserType(type: string): type is UserType {
  return ['customer', 'restaurant', 'delivery'].includes(type);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Brazilian phone number (10 or 11 digits)
  return cleaned.length >= 10 && cleaned.length <= 11;
}
