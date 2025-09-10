export type ProductCategory = 
  | 'entradas'
  | 'pratos-principais'
  | 'sobremesas'
  | 'bebidas'
  | 'lanches'
  | 'pizzas'
  | 'massas'
  | 'saladas'
  | 'vegetariano'
  | 'vegano';

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ProductCustomization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ProductOption[];
  maxSelections?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  isAvailable: boolean;
  preparationTime: number; // em minutos
  customizations?: ProductCustomization[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuSection {
  id: string;
  name: string;
  description?: string;
  products: Product[];
  isActive: boolean;
  order: number;
}

export interface Menu {
  id: string;
  restaurantId: string;
  sections: MenuSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mapeamento de categorias para exibição
export const productCategoryDisplayNames: Record<ProductCategory, string> = {
  'entradas': 'Entradas',
  'pratos-principais': 'Pratos Principais',
  'sobremesas': 'Sobremesas',
  'bebidas': 'Bebidas',
  'lanches': 'Lanches',
  'pizzas': 'Pizzas',
  'massas': 'Massas',
  'saladas': 'Saladas',
  'vegetariano': 'Vegetariano',
  'vegano': 'Vegano'
};

// Função utilitária para validar produto
export function validateProduct(product: Partial<Product>): string[] {
  const errors: string[] = [];
  
  if (!product.name?.trim()) {
    errors.push('Nome do produto é obrigatório');
  }
  
  if (!product.description?.trim()) {
    errors.push('Descrição do produto é obrigatória');
  }
  
  if (!product.price || product.price <= 0) {
    errors.push('Preço deve ser maior que zero');
  }
  
  if (!product.category) {
    errors.push('Categoria do produto é obrigatória');
  }
  
  if (!product.images || product.images.length === 0) {
    errors.push('Pelo menos uma imagem é obrigatória');
  }
  
  if (!product.preparationTime || product.preparationTime <= 0) {
    errors.push('Tempo de preparo deve ser maior que zero');
  }
  
  return errors;
}

// Função para calcular preço com customizações
export function calculateProductPrice(product: Product, selectedOptions: Record<string, string[]>): number {
  let totalPrice = product.price;
  
  if (product.customizations) {
    product.customizations.forEach(customization => {
      const selectedIds = selectedOptions[customization.id] || [];
      selectedIds.forEach(optionId => {
        const option = customization.options.find(opt => opt.id === optionId);
        if (option) {
          totalPrice += option.price;
        }
      });
    });
  }
  
  return totalPrice;
}