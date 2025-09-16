import { Restaurant, RestaurantStatus, RestaurantCategory } from '@/types/restaurant';
import { authService } from './auth.service';

// Interface para dados de criação de restaurante (simplificada)
export interface CreateRestaurantData {
  name: string;
  description?: string;
  address: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  cuisine_type: string;
  operating_hours?: Record<string, any>;
  phone?: string;
  email?: string;
  delivery_fee?: number;
  minimum_order?: number;
  delivery_radius_km?: number;
}

// Interface para atualização de restaurante
export interface UpdateRestaurantData extends Partial<CreateRestaurantData> {
  is_active?: boolean;
}

// Mensagens de erro internacionalizadas
const ERROR_MESSAGES = {
  en: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_DATA: 'Invalid data provided',
    RESTAURANT_NOT_FOUND: 'Restaurant not found',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Validation error'
  },
  he: {
    NETWORK_ERROR: 'שגיאת רשת. אנא בדוק את החיבור שלך.',
    INVALID_DATA: 'נתונים לא תקינים',
    RESTAURANT_NOT_FOUND: 'המסעדה לא נמצאה',
    UNAUTHORIZED: 'אין לך הרשאה לבצע פעולה זו',
    SERVER_ERROR: 'שגיאת שרת. אנא נסה שוב מאוחר יותר.',
    VALIDATION_ERROR: 'שגיאת אימות'
  }
};

// Função para obter mensagens de erro baseadas no idioma
function getErrorMessage(key: keyof typeof ERROR_MESSAGES.en, lang: string = 'en'): string {
  const messages = ERROR_MESSAGES[lang as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.en;
  return messages[key];
}

// Função para obter idioma do navegador
function getBrowserLanguage(): string {
  if (typeof window !== 'undefined') {
    return navigator.language.split('-')[0] || 'en';
  }
  return 'en';
}

class RestaurantService {
  private baseUrl = '/api/restaurants';
  private lang = getBrowserLanguage();

  // Definir idioma
  setLanguage(language: string) {
    this.lang = language;
  }

  // Validar dados de restaurante no frontend
  validateRestaurantData(data: CreateRestaurantData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Nome obrigatório
    if (!data.name || data.name.trim().length < 2) {
      errors.push(this.lang === 'he' ? 'שם המסעדה חייב להכיל לפחות 2 תווים' : 'Restaurant name must be at least 2 characters');
    }

    // Endereço obrigatório
    if (!data.address || data.address.trim().length === 0) {
      errors.push(this.lang === 'he' ? 'כתובת נדרשת' : 'Address is required');
    }

    // Cidade obrigatória
    if (!data.city || data.city.trim().length === 0) {
      errors.push(this.lang === 'he' ? 'עיר נדרשת' : 'City is required');
    }

    // Tipo de cozinha obrigatório
    if (!data.cuisine_type || data.cuisine_type.trim().length === 0) {
      errors.push(this.lang === 'he' ? 'סוג המטבח נדרש' : 'Cuisine type is required');
    }

    // Validação de email (se fornecido)
    if (data.email && data.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push(this.lang === 'he' ? 'פורמט אימייל לא תקין' : 'Invalid email format');
      }
    }

    // Validação de telefone (se fornecido)
    if (data.phone && data.phone.trim().length > 0) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push(this.lang === 'he' ? 'פורמט טלפון לא תקין' : 'Invalid phone format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Obter tipos de cozinha disponíveis
  getCuisineTypes(): Array<{ value: string; label: string; labelHe: string }> {
    return [
      { value: 'italian', label: 'Italian', labelHe: 'איטלקי' },
      { value: 'chinese', label: 'Chinese', labelHe: 'סיני' },
      { value: 'japanese', label: 'Japanese', labelHe: 'יפני' },
      { value: 'indian', label: 'Indian', labelHe: 'הודי' },
      { value: 'mexican', label: 'Mexican', labelHe: 'מקסיקני' },
      { value: 'american', label: 'American', labelHe: 'אמריקאי' },
      { value: 'mediterranean', label: 'Mediterranean', labelHe: 'ים תיכוני' },
      { value: 'thai', label: 'Thai', labelHe: 'תאילנדי' },
      { value: 'french', label: 'French', labelHe: 'צרפתי' },
      { value: 'middle_eastern', label: 'Middle Eastern', labelHe: 'מזרח תיכוני' },
      { value: 'fast_food', label: 'Fast Food', labelHe: 'מזון מהיר' },
      { value: 'other', label: 'Other', labelHe: 'אחר' }
    ];
  }

  // Headers com idioma e autenticação
  private getHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept-Language': this.lang,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Método auxiliar para fazer requisições com tratamento de erros internacionalizados
  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error(getErrorMessage('RESTAURANT_NOT_FOUND', this.lang));
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error(getErrorMessage('UNAUTHORIZED', this.lang));
        }
        if (response.status === 400) {
          throw new Error(errorData.error || getErrorMessage('VALIDATION_ERROR', this.lang));
        }
        
        throw new Error(errorData.error || getErrorMessage('SERVER_ERROR', this.lang));
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(getErrorMessage('NETWORK_ERROR', this.lang));
      }
      throw error;
    }
  }

  // Criar novo restaurante
  async createRestaurant(data: CreateRestaurantData): Promise<any> {
    try {
      const response = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar restaurante:', error);
      throw error;
    }
  }

  // Buscar restaurante por ID
  async getRestaurantById(id: string): Promise<any | null> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar restaurante:', error);
      throw error;
    }
  }

  // Atualizar restaurante
  async updateRestaurant(id: string, data: UpdateRestaurantData): Promise<any> {
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

  // Excluir restaurante
  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir restaurante:', error);
      return false;
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



  // Aprovar restaurante
  async approveRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { is_active: true });
  }

  // Rejeitar restaurante
  async rejectRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { is_active: false });
  }

  // Suspender restaurante
  async suspendRestaurant(id: string): Promise<Restaurant | null> {
    return this.updateRestaurant(id, { is_active: false });
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