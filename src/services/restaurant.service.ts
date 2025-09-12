import { Restaurant, RestaurantStatus, RestaurantCategory } from '@/types/restaurant';
import { authService } from './auth.service';

// Interface para dados de criação de restaurante
export interface CreateRestaurantData {
  name: string;
  description: string;
  category: RestaurantCategory;
  address: string;
  phone: string;
  email: string;
  image?: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  rating?: number;
  isPromoted?: boolean;
}

// Interface para atualização de restaurante
export interface UpdateRestaurantData extends Partial<CreateRestaurantData> {
  status?: RestaurantStatus;
}

class RestaurantService {
  private baseUrl = '/api/restaurants';

  // Método auxiliar para fazer requisições autenticadas
  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Criar novo restaurante
  async createRestaurant(data: CreateRestaurantData, ownerId: string): Promise<Restaurant> {
    try {
      const response = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify({ ...data, ownerId }),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar restaurante:', error);
      throw error;
    }
  }

  // Buscar restaurante por ID
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar restaurante:', error);
      return null;
    }
  }

  // Buscar restaurantes por proprietário
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}?owner=${ownerId}`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar restaurantes do proprietário:', error);
      return [];
    }
  }

  // Buscar todos os restaurantes ativos (para área do cliente)
  async getActiveRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}?status=active`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar restaurantes ativos:', error);
      return this.getDevRestaurantData();
    }
  }

  // Buscar todos os restaurantes (alias para getActiveRestaurants)
  async getAll(): Promise<Restaurant[]> {
    return this.getActiveRestaurants();
  }

  // Buscar restaurantes ativos por categoria
  async getActiveRestaurantsByCategory(category: RestaurantCategory): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}?status=active&category=${category}`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar restaurantes por categoria:', error);
      return [];
    }
  }

  // Alias para getActiveRestaurantsByCategory
  async getRestaurantsByCategory(category: RestaurantCategory): Promise<Restaurant[]> {
    return this.getActiveRestaurantsByCategory(category);
  }

  // Buscar restaurantes promovidos e ativos
  async getPromotedRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}?status=active&promoted=true`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar restaurantes promovidos:', error);
      return [];
    }
  }

  // Buscar restaurantes por termo de pesquisa
  async searchRestaurants(searchTerm: string): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao pesquisar restaurantes:', error);
      return [];
    }
  }

  // Atualizar restaurante
  async updateRestaurant(id: string, data: UpdateRestaurantData): Promise<Restaurant | null> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar restaurante:', error);
      throw error;
    }
  }

  // Aprovar restaurante
  async approveRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { status: 'active' });
  }

  // Rejeitar restaurante
  async rejectRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { status: 'rejected' });
  }

  // Suspender restaurante
  async suspendRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { status: 'suspended' });
  }

  // Deletar restaurante
  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar restaurante:', error);
      return false;
    }
  }

  // Buscar restaurantes pendentes
  async getPendingRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}?status=pending`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar restaurantes pendentes:', error);
      return [];
    }
  }

  // Verificar se restaurante está ativo
  async isRestaurantActive(id: string): Promise<boolean> {
    const restaurant = await this.getRestaurantById(id);
    return restaurant?.status === 'active';
  }

  // Obter estatísticas de restaurantes
  async getRestaurantStats() {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
        rejected: 0
      };
    }
  }

  // Dados de desenvolvimento como fallback
  private getDevRestaurantData(): Restaurant[] {
    if (process.env.NODE_ENV !== 'development') return [];
    
    return [
      {
        id: '1',
        name: 'Burger King',
        description: 'Os melhores hambúrgueres da cidade',
        category: 'fast-food' as RestaurantCategory,
        address: 'Rua das Flores, 123',
        phone: '(11) 99999-9999',
        email: 'contato@burgerking.com',
        image: '/images/restaurants/burger-king.jpg',
        deliveryFee: 5.99,
        minimumOrder: 20.00,
        estimatedDeliveryTime: '30-45 min',
        rating: 4.5,
        isPromoted: true,
        status: 'active' as RestaurantStatus,
        ownerId: 'dev-owner-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export const restaurantService = new RestaurantService();
export default restaurantService;