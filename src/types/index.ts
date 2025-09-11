// Centralized type exports for the ZipFood application

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