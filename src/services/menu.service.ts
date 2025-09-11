import { restaurantConfigService } from './restaurant-config.service';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  preparationTime: number; // em minutos
  ingredients?: string[];
  allergens?: string[];
  restaurantId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  restaurantId: string;
}

class MenuService {
  private menuItems: MenuItem[] = [];
  private categories: MenuCategory[] = [];
  private listeners: ((items: MenuItem[]) => void)[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Dados mock baseados no tipo de restaurante
    const mockItems: MenuItem[] = [
      {
        id: 'item-1',
        name: 'X-Burger Clássico',
        description: 'Hambúrguer artesanal 180g, queijo, alface, tomate, cebola e molho especial',
        price: 25.90,
        category: 'Hambúrgueres',
        available: true,
        preparationTime: 15,
        ingredients: ['Pão brioche', 'Hambúrguer 180g', 'Queijo cheddar', 'Alface', 'Tomate', 'Cebola', 'Molho especial'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId: 'restaurant-1'
      },
      {
        id: 'item-2',
        name: 'X-Bacon Duplo',
        description: 'Dois hambúrgueres 120g, bacon crocante, queijo, alface e molho barbecue',
        price: 32.90,
        category: 'Hambúrgueres',
        available: true,
        preparationTime: 18,
        ingredients: ['Pão brioche', '2x Hambúrguer 120g', 'Bacon', 'Queijo cheddar', 'Alface', 'Molho barbecue'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId: 'restaurant-1'
      },
      {
        id: 'item-3',
        name: 'Batata Frita Especial',
        description: 'Batatas rústicas com tempero da casa e molho de queijo',
        price: 15.90,
        category: 'Acompanhamentos',
        available: true,
        preparationTime: 10,
        ingredients: ['Batata rústica', 'Tempero da casa', 'Molho de queijo'],
        allergens: ['Lactose'],
        restaurantId: 'restaurant-1'
      },
      {
        id: 'item-4',
        name: 'Refrigerante Lata',
        description: 'Coca-Cola, Guaraná ou Fanta - 350ml',
        price: 5.90,
        category: 'Bebidas',
        available: true,
        preparationTime: 2,
        ingredients: ['Refrigerante 350ml'],
        restaurantId: 'restaurant-1'
      },
      {
        id: 'item-5',
        name: 'Milkshake de Chocolate',
        description: 'Cremoso milkshake com sorvete de baunilha e calda de chocolate',
        price: 12.90,
        category: 'Sobremesas',
        available: true,
        preparationTime: 5,
        ingredients: ['Sorvete de baunilha', 'Leite', 'Calda de chocolate', 'Chantilly'],
        allergens: ['Lactose'],
        restaurantId: 'restaurant-1'
      }
    ];

    this.menuItems = mockItems;
    this.generateCategories();
  }

  private generateCategories() {
    const categoryMap = new Map<string, MenuItem[]>();
    
    this.menuItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category)!.push(item);
    });

    this.categories = Array.from(categoryMap.entries()).map(([name, items]) => ({
      id: `category-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      items,
      restaurantId: 'restaurant-1' // Em produção, viria do contexto do restaurante
    }));
  }

  // Sincronizar menu com dados do restaurante
  async syncWithRestaurantData(restaurantId: string) {
    try {
      const config = await restaurantConfigService.getRestaurantConfig(restaurantId);
      
      if (config) {
        // Atualizar itens do menu baseado no tipo de restaurante
        this.updateMenuByRestaurantType(config.category, restaurantId);
        
        // Notificar listeners sobre a atualização
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Erro ao sincronizar menu com dados do restaurante:', error);
    }
  }

  private updateMenuByRestaurantType(businessType: string, restaurantId: string) {
    // Atualizar restaurantId de todos os itens
    this.menuItems = this.menuItems.map(item => ({
      ...item,
      restaurantId
    }));

    // Personalizar menu baseado no tipo de negócio
    switch (businessType.toLowerCase()) {
      case 'hamburgueria':
        this.addHamburgueriaItems(restaurantId);
        break;
      case 'pizzaria':
        this.addPizzeriaItems(restaurantId);
        break;
      case 'lanchonete':
        this.addLanchoneteItems(restaurantId);
        break;
      case 'restaurante':
        this.addRestauranteItems(restaurantId);
        break;
      default:
        // Manter itens padrão
        break;
    }

    this.generateCategories();
  }

  private addHamburgueriaItems(restaurantId: string) {
    // Itens já estão configurados para hamburgueria
  }

  private addPizzeriaItems(restaurantId: string) {
    this.menuItems = [
      {
        id: 'pizza-1',
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
        price: 35.90,
        category: 'Pizzas Tradicionais',
        available: true,
        preparationTime: 25,
        ingredients: ['Massa artesanal', 'Molho de tomate', 'Mussarela', 'Manjericão', 'Azeite'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId
      },
      {
        id: 'pizza-2',
        name: 'Pizza Calabresa',
        description: 'Molho de tomate, mussarela, calabresa e cebola',
        price: 38.90,
        category: 'Pizzas Tradicionais',
        available: true,
        preparationTime: 25,
        ingredients: ['Massa artesanal', 'Molho de tomate', 'Mussarela', 'Calabresa', 'Cebola'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId
      },
      {
        id: 'pizza-3',
        name: 'Pizza Portuguesa',
        description: 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitona',
        price: 42.90,
        category: 'Pizzas Especiais',
        available: true,
        preparationTime: 28,
        ingredients: ['Massa artesanal', 'Molho de tomate', 'Mussarela', 'Presunto', 'Ovos', 'Cebola', 'Azeitona'],
        allergens: ['Glúten', 'Lactose', 'Ovos'],
        restaurantId
      }
    ];
  }

  private addLanchoneteItems(restaurantId: string) {
    this.menuItems = [
      {
        id: 'lanche-1',
        name: 'Misto Quente',
        description: 'Pão de forma, presunto e queijo na chapa',
        price: 8.90,
        category: 'Lanches',
        available: true,
        preparationTime: 8,
        ingredients: ['Pão de forma', 'Presunto', 'Queijo'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId
      },
      {
        id: 'lanche-2',
        name: 'Sanduíche Natural',
        description: 'Pão integral, peito de peru, queijo branco, alface e tomate',
        price: 12.90,
        category: 'Lanches',
        available: true,
        preparationTime: 10,
        ingredients: ['Pão integral', 'Peito de peru', 'Queijo branco', 'Alface', 'Tomate'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId
      }
    ];
  }

  private addRestauranteItems(restaurantId: string) {
    this.menuItems = [
      {
        id: 'prato-1',
        name: 'Filé à Parmegiana',
        description: 'Filé de frango empanado com molho de tomate e queijo, acompanha arroz e batata frita',
        price: 28.90,
        category: 'Pratos Principais',
        available: true,
        preparationTime: 30,
        ingredients: ['Filé de frango', 'Molho de tomate', 'Queijo', 'Arroz', 'Batata frita'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId
      },
      {
        id: 'prato-2',
        name: 'Feijoada Completa',
        description: 'Feijoada tradicional com acompanhamentos: arroz, farofa, couve e laranja',
        price: 32.90,
        category: 'Pratos Principais',
        available: true,
        preparationTime: 35,
        ingredients: ['Feijão preto', 'Carnes variadas', 'Arroz', 'Farofa', 'Couve', 'Laranja'],
        restaurantId
      }
    ];
  }

  // Métodos públicos
  async getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    if (restaurantId) {
      return this.menuItems.filter(item => item.restaurantId === restaurantId);
    }
    return this.menuItems;
  }

  async getMenuCategories(restaurantId?: string): Promise<MenuCategory[]> {
    if (restaurantId) {
      return this.categories.filter(category => category.restaurantId === restaurantId);
    }
    return this.categories;
  }

  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    return this.menuItems.find(item => item.id === itemId) || null;
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    // Validação centralizada
    if (!item.name?.trim()) {
      throw new Error('Nome do item é obrigatório');
    }
    if (!item.description?.trim()) {
      throw new Error('Descrição do item é obrigatória');
    }
    if (!item.price || item.price <= 0) {
      throw new Error('Preço deve ser maior que zero');
    }
    if (!item.category?.trim()) {
      throw new Error('Categoria é obrigatória');
    }

    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      image: item.image || '/images/default-food.jpg',
      preparationTime: item.preparationTime || 15
    };
    
    this.menuItems.push(newItem);
    this.generateCategories();
    this.notifyListeners();
    
    return newItem;
  }

  async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const itemIndex = this.menuItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item não encontrado');
    }
    
    // Validação centralizada para updates
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new Error('Nome do item é obrigatório');
    }
    if (updates.description !== undefined && !updates.description?.trim()) {
      throw new Error('Descrição do item é obrigatória');
    }
    if (updates.price !== undefined && (!updates.price || updates.price <= 0)) {
      throw new Error('Preço deve ser maior que zero');
    }
    if (updates.category !== undefined && !updates.category?.trim()) {
      throw new Error('Categoria é obrigatória');
    }
    
    this.menuItems[itemIndex] = {
      ...this.menuItems[itemIndex],
      ...updates
    };
    
    this.generateCategories();
    this.notifyListeners();
    
    return this.menuItems[itemIndex];
  }

  async deleteMenuItem(itemId: string): Promise<boolean> {
    const itemIndex = this.menuItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }
    
    this.menuItems.splice(itemIndex, 1);
    this.generateCategories();
    this.notifyListeners();
    
    return true;
  }

  async toggleItemAvailability(itemId: string): Promise<MenuItem | null> {
    const item = this.menuItems.find(item => item.id === itemId);
    
    if (!item) {
      return null;
    }
    
    item.available = !item.available;
    this.notifyListeners();
    
    return item;
  }

  // Sistema de listeners para atualizações em tempo real
  addListener(callback: (items: MenuItem[]) => void): () => void {
    this.listeners.push(callback);
    
    // Retorna função para remover o listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.menuItems);
      } catch (error) {
        console.error('Erro ao notificar listener do menu:', error);
      }
    });
  }

  // Método para buscar itens por categoria
  async getItemsByCategory(category: string, restaurantId?: string): Promise<MenuItem[]> {
    let items = this.menuItems.filter(item => item.category === category);
    
    if (restaurantId) {
      items = items.filter(item => item.restaurantId === restaurantId);
    }
    
    return items;
  }

  // Método para buscar itens disponíveis
  async getAvailableItems(restaurantId?: string): Promise<MenuItem[]> {
    let items = this.menuItems.filter(item => item.available);
    
    if (restaurantId) {
      items = items.filter(item => item.restaurantId === restaurantId);
    }
    
    return items;
  }
}

export const menuService = new MenuService();