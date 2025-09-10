import { Restaurant, RestaurantStatus, RestaurantCategory } from '@/types/restaurant';

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
  private restaurants: Restaurant[] = [];
  private nextId = 1;

  // Criar novo restaurante
  async createRestaurant(data: CreateRestaurantData, ownerId: string): Promise<Restaurant> {
    const restaurant: Restaurant = {
      id: this.nextId.toString(),
      ...data,
      ownerId,
      status: 'pending', // Novo restaurante sempre começa como pendente
      rating: data.rating || 0,
      isPromoted: data.isPromoted || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.restaurants.push(restaurant);
    this.nextId++;

    return restaurant;
  }

  // Buscar restaurante por ID
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find(r => r.id === id) || null;
  }

  // Buscar restaurantes por proprietário
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurants.filter(r => r.ownerId === ownerId);
  }

  // Buscar todos os restaurantes ativos (para área do cliente)
  async getActiveRestaurants(): Promise<Restaurant[]> {
    return this.restaurants.filter(r => r.status === 'active');
  }

  // Buscar todos os restaurantes (alias para getActiveRestaurants)
  async getAll(): Promise<Restaurant[]> {
    return this.getActiveRestaurants();
  }

  // Buscar restaurantes ativos por categoria
  async getActiveRestaurantsByCategory(category: RestaurantCategory): Promise<Restaurant[]> {
    return this.restaurants.filter(r => 
      r.status === 'active' && r.category === category
    );
  }

  // Alias para getActiveRestaurantsByCategory
  async getRestaurantsByCategory(category: RestaurantCategory): Promise<Restaurant[]> {
    return this.getActiveRestaurantsByCategory(category);
  }

  // Buscar restaurantes promovidos e ativos
  async getPromotedRestaurants(): Promise<Restaurant[]> {
    return this.restaurants.filter(r => 
      r.status === 'active' && r.isPromoted === true
    );
  }

  // Buscar restaurantes por termo de pesquisa
  async searchRestaurants(searchTerm: string): Promise<Restaurant[]> {
    const term = searchTerm.toLowerCase();
    return this.restaurants.filter(r => 
      r.status === 'active' && (
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term)
      )
    );
  }

  // Atualizar restaurante
  async updateRestaurant(id: string, data: UpdateRestaurantData): Promise<Restaurant | null> {
    const index = this.restaurants.findIndex(r => r.id === id);
    if (index === -1) return null;

    this.restaurants[index] = {
      ...this.restaurants[index],
      ...data,
      updatedAt: new Date()
    };

    return this.restaurants[index];
  }

  // Aprovar restaurante (mudar status para ativo)
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
    const index = this.restaurants.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.restaurants.splice(index, 1);
    return true;
  }

  // Buscar restaurantes pendentes de aprovação (para admin)
  async getPendingRestaurants(): Promise<Restaurant[]> {
    return this.restaurants.filter(r => r.status === 'pending');
  }

  // Verificar se restaurante está ativo
  async isRestaurantActive(id: string): Promise<boolean> {
    const restaurant = await this.getRestaurantById(id);
    return restaurant?.status === 'active' || false;
  }

  // Estatísticas de restaurantes
  async getRestaurantStats() {
    const total = this.restaurants.length;
    const active = this.restaurants.filter(r => r.status === 'active').length;
    const pending = this.restaurants.filter(r => r.status === 'pending').length;
    const suspended = this.restaurants.filter(r => r.status === 'suspended').length;
    const rejected = this.restaurants.filter(r => r.status === 'rejected').length;

    return {
      total,
      active,
      pending,
      suspended,
      rejected
    };
  }

  // Inicializar sem dados de exemplo - sistema limpo para novos cadastros
  initializeWithSampleData() {
    // Sistema iniciado sem restaurantes pré-cadastrados
    // Os restaurantes serão adicionados através do sistema de cadastro
    console.log('Sistema de restaurantes inicializado - pronto para novos cadastros');
  }
}

// Instância singleton do serviço
export const restaurantService = new RestaurantService();

// Inicializar com dados de exemplo (apenas para desenvolvimento)
if (typeof window !== 'undefined') {
  restaurantService.initializeWithSampleData();
}

export default restaurantService;