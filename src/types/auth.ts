// Authentication types for the ZipFood application

/**
 * User types in the system
 */
export type UserType = 'customer' | 'restaurant' | 'delivery';

/**
 * User interface representing a user in the system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  phone?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sign in data interface
 */
export interface SignInData {
  email: string;
  password: string;
  userType?: UserType;
}

/**
 * Sign up data interface
 */
export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  userType: UserType;
}

/**
 * Auth response interface
 */
export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

/**
 * Auth error interface
 */
export interface AuthError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * User type display names
 */
export const userTypeDisplayNames: Record<UserType, string> = {
  customer: 'Cliente',
  restaurant: 'Restaurante',
  delivery: 'Entregador'
};

/**
 * Validates user type
 */
export function isValidUserType(type: string): type is UserType {
  return ['customer', 'restaurant', 'delivery'].includes(type);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validates phone number format (Brazilian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
}