import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import jwt from 'jsonwebtoken';

// Função para verificar token JWT
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  } catch {
    return null;
  }
}

// Tipos para validação
interface CreateRestaurantData {
  name: string;
  description?: string;
  address: string;
  city: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  cuisine_type: string;
  operating_hours?: Record<string, any>;
  phone?: string;
  email?: string;
  delivery_fee?: number;
  minimum_order?: number;
  delivery_radius_km?: number;
  user_id?: string;
  category?: string;
  status?: string;
  is_active?: boolean;
}

// Mensagens de erro internacionalizadas
const ERROR_MESSAGES = {
  en: {
    INVALID_DATA: 'Invalid data provided',
    NAME_REQUIRED: 'Restaurant name is required',
    NAME_TOO_SHORT: 'Restaurant name must be at least 2 characters',
    ADDRESS_REQUIRED: 'Address is required',
    CITY_REQUIRED: 'City is required',
    CUISINE_REQUIRED: 'Cuisine type is required',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone format',
    RESTAURANT_NOT_FOUND: 'Restaurant not found',
    UNAUTHORIZED: 'Unauthorized access',
    SERVER_ERROR: 'Internal server error'
  },
  he: {
    INVALID_DATA: 'נתונים לא תקינים',
    NAME_REQUIRED: 'שם המסעדה נדרש',
    NAME_TOO_SHORT: 'שם המסעדה חייב להכיל לפחות 2 תווים',
    ADDRESS_REQUIRED: 'כתובת נדרשת',
    CITY_REQUIRED: 'עיר נדרשת',
    CUISINE_REQUIRED: 'סוג המטבח נדרש',
    INVALID_EMAIL: 'פורמט אימייל לא תקין',
    INVALID_PHONE: 'פורמט טלפון לא תקין',
    RESTAURANT_NOT_FOUND: 'המסעדה לא נמצאה',
    UNAUTHORIZED: 'גישה לא מורשית',
    SERVER_ERROR: 'שגיאת שרת פנימית'
  }
};

// Função para obter mensagens de erro baseadas no idioma
function getErrorMessage(key: keyof typeof ERROR_MESSAGES.en, lang: string = 'en'): string {
  const messages = ERROR_MESSAGES[lang as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.en;
  return messages[key];
}

// Validação de dados de entrada
function validateRestaurantData(data: any, lang: string = 'en'): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Nome obrigatório
  if (!data.name || typeof data.name !== 'string') {
    errors.push(getErrorMessage('NAME_REQUIRED', lang));
  } else if (data.name.trim().length < 2) {
    errors.push(getErrorMessage('NAME_TOO_SHORT', lang));
  }

  // Endereço obrigatório
  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
    errors.push(getErrorMessage('ADDRESS_REQUIRED', lang));
  }

  // Tipo de cozinha obrigatório
  if (!data.cuisine_type || typeof data.cuisine_type !== 'string' || data.cuisine_type.trim().length === 0) {
    errors.push(getErrorMessage('CUISINE_REQUIRED', lang));
  }

  // Validação de email (se fornecido)
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push(getErrorMessage('INVALID_EMAIL', lang));
    }
  }

  // Validação de telefone (se fornecido) - formato internacional
  if (data.phone && typeof data.phone === 'string') {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push(getErrorMessage('INVALID_PHONE', lang));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET - Listar restaurantes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minRating = searchParams.get('minRating');
    const maxDeliveryFee = searchParams.get('maxDeliveryFee');
    const isPromoted = searchParams.get('isPromoted');

    let query = supabaseAdmin
      .from('restaurants')
      .select(`
        *,
        menu_items:menu_items(count)
      `)
      .eq('status', 'active')
      .eq('is_active', true);

    // Filtrar por categoria
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Filtrar por busca (nome ou descrição)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filtrar por avaliação mínima
    if (minRating) {
      const rating = parseFloat(minRating);
      if (!isNaN(rating)) {
        query = query.gte('rating', rating);
      }
    }

    // Filtrar por taxa de entrega máxima
    if (maxDeliveryFee) {
      const fee = parseFloat(maxDeliveryFee);
      if (!isNaN(fee)) {
        query = query.lte('delivery_fee', fee);
      }
    }

    // Filtrar por restaurantes promovidos
    if (isPromoted === 'true') {
      query = query.eq('is_promoted', true);
    }

    // Ordenar por: promovidos primeiro, depois por avaliação
    query = query.order('is_promoted', { ascending: false })
                 .order('rating', { ascending: false });

    const { data: restaurants, error } = await query;

    if (error) {
      console.error('Erro ao buscar restaurantes:', error);
      return serverErrorResponse('Erro ao buscar restaurantes');
    }

    // Processar dados para incluir informações calculadas
    const processedRestaurants = restaurants.map(restaurant => ({
      ...restaurant,
      hasMenu: restaurant.menu_items && restaurant.menu_items.length > 0,
      deliveryTime: restaurant.estimated_delivery_time || '30-45 min',
      isOpen: true // Por enquanto, todos estão abertos
    }));

    return successResponse(processedRestaurants, 'Restaurantes listados com sucesso');
  } catch (error) {
    console.error('Erro interno ao listar restaurantes:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// POST - Criar novo restaurante
export async function POST(request: NextRequest) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    
    // Verificar autenticação (opcional para cadastro inicial)
    const user = verifyToken(request);
    
    const body = await request.json();

    // Se há usuário autenticado, verificar se já possui restaurante
    if (user) {
      const { data: existingRestaurant } = await supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('user_id', user.userId)
        .single();

      if (existingRestaurant) {
        return errorResponse(
          lang === 'pt' ? 'Você já possui um restaurante cadastrado. Cada conta pode ter apenas um estabelecimento.' :
          lang === 'he' ? 'כבר יש לך מסעדה רשומה. כל חשבון יכול להיות רק מוסד אחד.' :
          'You already have a registered restaurant. Each account can have only one establishment.',
          409
        );
      }
    }

    // Validar dados de entrada
    const validation = validateRestaurantData(body, lang);
    if (!validation.isValid) {
      return errorResponse(
        getErrorMessage('INVALID_DATA', lang),
        400,
        validation.errors
      );
    }

    // Preparar dados para inserção com aprovação automática
    const restaurantData = {
      user_id: user?.userId || null,
      name: body.name.trim(),
      description: body.description?.trim() || '',
      category: body.cuisine_type.trim(),
      address: body.address.trim(),
      phone: body.phone?.trim(),
      opening_hours: body.operating_hours || body.opening_hours || {},
      delivery_fee: body.delivery_fee || 0,
      minimum_order: body.minimum_order || 0,
      is_active: true
    };

    // Inserir no banco de dados
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      
      // Verificar se é erro de constraint única
      if (error.code === '23505' && error.message.includes('restaurants_user_id_unique')) {
        return errorResponse(
          lang === 'pt' ? 'Você já possui um restaurante cadastrado. Cada conta pode ter apenas um estabelecimento.' :
          lang === 'he' ? 'כבר יש לך מסעדה רשומה. כל חשבון יכול להיות רק מוסד אחד.' :
          'You already have a registered restaurant. Each account can have only one establishment.',
          409
        );
      }
      
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    return successResponse(
      restaurant,
      lang === 'he' ? 'המסעדה נוצרה בהצלחה' : 'Restaurant created successfully',
      201
    );

  } catch (error) {
    console.error('POST /api/restaurants error:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}