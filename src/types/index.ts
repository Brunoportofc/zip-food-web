// Centralized type exports for the ZipFood application

// Authentication types
export type {
  UserType,
  User,
  SignInData,
  SignUpData,
  AuthResponse,
  AuthError
} from './auth';

export {
  userTypeDisplayNames,
  isValidUserType,
  isValidEmail,
  isValidPassword,
  isValidPhone
} from './auth';

// Menu types
export type {
  ProductCategory,
  ProductOption,
  ProductCustomization,
  Product,
  MenuSection,
  Menu
} from './menu';

export {
  productCategoryDisplayNames,
  validateProduct,
  calculateProductPrice
} from './menu';

// Restaurant types
export type {
  RestaurantStatus,
  RestaurantCategory,
  Restaurant,
  RestaurantCard,
  RestaurantFilters
} from './restaurant';

export {
  categoryDisplayNames,
  statusDisplayNames,
  statusColors,
  categoryToSlug,
  slugToCategory,
  getSlugToCategory,
  validateRestaurantData,
  formatPrice,
  formatRating
} from './restaurant';

// Restaurant configuration types
export type {
  PaymentMethod,
  DayOfWeek,
  TimeSlot,
  OperatingHours,
  DeliveryArea,
  RestaurantConfiguration
} from './restaurant-config';

export {
  paymentMethodDisplayNames,
  dayOfWeekDisplayNames,
  defaultOperatingHours,
  validateRestaurantConfig,
  isRestaurantOpen
} from './restaurant-config';