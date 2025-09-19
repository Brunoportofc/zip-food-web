// src/services/menu.service.ts

// REMOVA a importação do authService
// import { authService } from './auth.service';

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
  private listeners: ((items: MenuItem[]) => void)[] = [];
  private baseUrl = '/api/menu';

  // Método para fazer requisições (agora sem autenticação manual)
  private async makeRequest(url: string, options: RequestInit = {}) {
    // A lógica de token foi removida daqui
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  async getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    try {
      const url = restaurantId 
        ? `${this.baseUrl}?restaurantId=${restaurantId}`
        : this.baseUrl;
      
      const data = await this.makeRequest(url);
      return data.items || [];
    } catch (error) {
      console.error('Erro ao buscar itens do menu:', error);
      return this.getDevMenuData();
    }
  }

  async getMenuCategories(restaurantId?: string): Promise<MenuCategory[]> {
    try {
      const items = await this.getMenuItems(restaurantId);
      return this.generateCategoriesFromItems(items);
    } catch (error) {
      console.error('Erro ao buscar categorias do menu:', error);
      return [];
    }
  }

  private generateCategoriesFromItems(items: MenuItem[]): MenuCategory[] {
    const categoriesMap = new Map<string, MenuCategory>();
    
    items.forEach(item => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, {
          id: `category-${item.category.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.category,
          items: [],
          restaurantId: item.restaurantId
        });
      }
      categoriesMap.get(item.category)!.items.push(item);
    });
    
    return Array.from(categoriesMap.values());
  }

  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/${itemId}`);
      return data.item || null;
    } catch (error) {
      console.error('Erro ao buscar item do menu:', error);
      return null;
    }
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    try {
      const data = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      
      this.notifyListeners();
      return data.item;
    } catch (error) {
      console.error('Erro ao adicionar item ao menu:', error);
      throw error;
    }
  }

  async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      this.notifyListeners();
      return data.item || null;
    } catch (error) {
      console.error('Erro ao atualizar item do menu:', error);
      throw error;
    }
  }

  async deleteMenuItem(itemId: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/${itemId}`, {
        method: 'DELETE',
      });
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Erro ao deletar item do menu:', error);
      return false;
    }
  }

  async toggleItemAvailability(itemId: string): Promise<MenuItem | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/${itemId}/toggle`, {
        method: 'PATCH',
      });
      
      this.notifyListeners();
      return data.item || null;
    } catch (error) {
      console.error('Erro ao alterar disponibilidade do item:', error);
      return null;
    }
  }

  async getItemsByCategory(category: string, restaurantId?: string): Promise<MenuItem[]> {
    try {
      const items = await this.getMenuItems(restaurantId);
      return items.filter(item => item.category === category);
    } catch (error) {
      console.error('Erro ao buscar itens por categoria:', error);
      return [];
    }
  }

  async getAvailableItems(restaurantId?: string): Promise<MenuItem[]> {
    try {
      const items = await this.getMenuItems(restaurantId);
      return items.filter(item => item.available);
    } catch (error) {
      console.error('Erro ao buscar itens disponíveis:', error);
      return [];
    }
  }

  // Listeners para mudanças no menu
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

  private async notifyListeners() {
    try {
      const items = await this.getMenuItems();
      this.listeners.forEach(callback => callback(items));
    } catch (error) {
      console.error('Erro ao notificar listeners:', error);
    }
  }

  // Dados de desenvolvimento para fallback
  private getDevMenuData(): MenuItem[] {
    return [
      {
        id: 'dev-item-1',
        name: 'X-Burger Clássico',
        description: 'Hambúrguer artesanal 180g, queijo, alface, tomate, cebola e molho especial',
        price: 25.90,
        category: 'Hambúrgueres',
        available: true,
        preparationTime: 15,
        ingredients: ['Pão brioche', 'Hambúrguer 180g', 'Queijo cheddar', 'Alface', 'Tomate', 'Cebola', 'Molho especial'],
        allergens: ['Glúten', 'Lactose'],
        restaurantId: 'dev-restaurant-1'
      },
      // ... (outros dados de desenvolvimento)
    ];
  }
}

export const menuService = new MenuService();