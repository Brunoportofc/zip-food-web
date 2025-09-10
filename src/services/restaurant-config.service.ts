import { RestaurantConfiguration, validateRestaurantConfig, defaultOperatingHours, PaymentMethod } from '../types/restaurant-config';
import { Menu, Product, MenuSection, validateProduct } from '../types/menu';

class RestaurantConfigService {
  private configs: RestaurantConfiguration[] = [];
  private menus: Menu[] = [];
  private products: Product[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Inicialização sem dados pré-definidos - restaurantes serão criados via formulário

    // Produtos e menus serão criados dinamicamente pelos restaurantes
  }

  // === CONFIGURAÇÃO DO RESTAURANTE ===
  
  async getRestaurantConfig(restaurantId: string): Promise<RestaurantConfiguration | null> {
    return this.configs.find(config => config.restaurantId === restaurantId) || null;
  }

  async createRestaurantConfig(config: Omit<RestaurantConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<RestaurantConfiguration> {
    const errors = validateRestaurantConfig(config);
    if (errors.length > 0) {
      throw new Error(`Erro de validação: ${errors.join(', ')}`);
    }

    const newConfig: RestaurantConfiguration = {
      ...config,
      id: `config-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.push(newConfig);
    
    // Integrar com o serviço de restaurantes
    try {
      const { restaurantService } = await import('./restaurant.service');
      
      const restaurantData = {
        name: config.businessName,
        description: config.displayName,
        category: 'restaurant',
        address: `${config.address?.street}, ${config.address?.number} - ${config.address?.neighborhood}`,
        phone: config.phone || '',
        email: config.email || '',
        deliveryFee: config.deliveryFee || 5.99,
        minimumOrder: config.minimumOrder || 20.00,
        estimatedDeliveryTime: '30-45 min',
        rating: 0,
        isPromoted: false
      };
      
      // Criar restaurante no sistema principal
      const restaurant = await restaurantService.createRestaurant(restaurantData, 'current_owner');
      
      // Marcar como aprovado automaticamente para desenvolvimento
      await restaurantService.approveRestaurant(restaurant.id);
      
      console.log('Restaurante criado e aprovado:', restaurant);
    } catch (error) {
      console.error('Erro ao integrar com serviço de restaurantes:', error);
    }
    
    return newConfig;
  }

  async updateRestaurantConfig(id: string, updates: Partial<RestaurantConfiguration>): Promise<RestaurantConfiguration> {
    const configIndex = this.configs.findIndex(config => config.id === id);
    if (configIndex === -1) {
      throw new Error('Configuração não encontrada');
    }

    const updatedConfig = {
      ...this.configs[configIndex],
      ...updates,
      updatedAt: new Date()
    };

    const errors = validateRestaurantConfig(updatedConfig);
    if (errors.length > 0) {
      throw new Error(`Erro de validação: ${errors.join(', ')}`);
    }

    this.configs[configIndex] = updatedConfig;
    return updatedConfig;
  }

  // === GERENCIAMENTO DE CARDÁPIO ===
  
  async getRestaurantMenu(restaurantId: string): Promise<Menu | null> {
    return this.menus.find(menu => menu.restaurantId === restaurantId) || null;
  }

  async createMenu(menu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<Menu> {
    const newMenu: Menu = {
      ...menu,
      id: `menu-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.menus.push(newMenu);
    return newMenu;
  }

  async updateRestaurantMenu(restaurantId: string, menuData: Menu): Promise<Menu> {
    const menuIndex = this.menus.findIndex(menu => menu.restaurantId === restaurantId);
    
    if (menuIndex === -1) {
      // Se não existe menu, cria um novo
      const newMenu = await this.createMenu({
        restaurantId,
        sections: menuData.sections || []
      });
      return newMenu;
    }

    // Atualiza o menu existente
    this.menus[menuIndex] = {
      ...this.menus[menuIndex],
      ...menuData,
      updatedAt: new Date()
    };

    return this.menus[menuIndex];
  }

  // === GERENCIAMENTO DE PRODUTOS ===
  
  async getProductsByRestaurant(restaurantId: string): Promise<Product[]> {
    const menu = await this.getRestaurantMenu(restaurantId);
    if (!menu) return [];
    
    const productIds = menu.sections.flatMap(section => 
      section.products.map(product => product.id)
    );
    
    return this.products.filter(product => productIds.includes(product.id));
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const errors = validateProduct(product);
    if (errors.length > 0) {
      throw new Error(`Erro de validação: ${errors.join(', ')}`);
    }

    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) {
      throw new Error('Produto não encontrado');
    }

    const updatedProduct = {
      ...this.products[productIndex],
      ...updates,
      updatedAt: new Date()
    };

    const errors = validateProduct(updatedProduct);
    if (errors.length > 0) {
      throw new Error(`Erro de validação: ${errors.join(', ')}`);
    }

    this.products[productIndex] = updatedProduct;
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) {
      return false;
    }

    this.products.splice(productIndex, 1);
    
    // Remove produto de todas as seções do menu
    this.menus.forEach(menu => {
      menu.sections.forEach(section => {
        section.products = section.products.filter(product => product.id !== id);
      });
    });

    return true;
  }

  // === SEÇÕES DO MENU ===
  
  async addProductToSection(menuId: string, sectionId: string, productId: string): Promise<boolean> {
    const menu = this.menus.find(m => m.id === menuId);
    const product = this.products.find(p => p.id === productId);
    
    if (!menu || !product) return false;
    
    const section = menu.sections.find(s => s.id === sectionId);
    if (!section) return false;
    
    if (!section.products.find(p => p.id === productId)) {
      section.products.push(product);
      menu.updatedAt = new Date();
    }
    
    return true;
  }

  async removeProductFromSection(menuId: string, sectionId: string, productId: string): Promise<boolean> {
    const menu = this.menus.find(m => m.id === menuId);
    if (!menu) return false;
    
    const section = menu.sections.find(s => s.id === sectionId);
    if (!section) return false;
    
    section.products = section.products.filter(p => p.id !== productId);
    menu.updatedAt = new Date();
    
    return true;
  }

  async createMenuSection(menuId: string, section: Omit<MenuSection, 'id'>): Promise<MenuSection | null> {
    const menu = this.menus.find(m => m.id === menuId);
    if (!menu) return null;
    
    const newSection: MenuSection = {
      ...section,
      id: `section-${Date.now()}`
    };
    
    menu.sections.push(newSection);
    menu.updatedAt = new Date();
    
    return newSection;
  }

  // === UTILITÁRIOS ===
  
  async isRestaurantConfigured(restaurantId: string): Promise<boolean> {
    const config = await this.getRestaurantConfig(restaurantId);
    return config?.isConfigured || false;
  }

  async getConfigurationProgress(restaurantId: string): Promise<{
    completed: number;
    total: number;
    steps: { name: string; completed: boolean }[];
  }> {
    const config = await this.getRestaurantConfig(restaurantId);
    const menu = await this.getRestaurantMenu(restaurantId);
    
    const steps = [
      { name: 'Dados básicos', completed: !!(config?.businessName && config?.displayName) },
      { name: 'Endereço', completed: !!(config?.address?.street) },
      { name: 'Contato', completed: !!(config?.phone && config?.email) },
      { name: 'Documentos', completed: !!(config?.documents?.cnpj) },
      { name: 'Horários', completed: !!(config?.operatingHours) },
      { name: 'Pagamentos', completed: !!(config?.paymentMethods?.length) },
      { name: 'Áreas de entrega', completed: !!(config?.deliveryAreas?.length) },
      { name: 'Cardápio', completed: !!(menu?.sections?.length) }
    ];
    
    const completed = steps.filter(step => step.completed).length;
    
    return {
      completed,
      total: steps.length,
      steps
    };
  }
}

export const restaurantConfigService = new RestaurantConfigService();
export default restaurantConfigService;