import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

// Mensagens de erro internacionalizadas
const ERROR_MESSAGES = {
  en: {
    RESTAURANT_NOT_FOUND: 'Restaurant not found',
    INVALID_ID: 'Invalid restaurant ID',
    UNAUTHORIZED: 'Unauthorized access',
    SERVER_ERROR: 'Internal server error',
    INVALID_DATA: 'Invalid data provided'
  },
  he: {
    RESTAURANT_NOT_FOUND: 'המסעדה לא נמצאה',
    INVALID_ID: 'מזהה מסעדה לא תקין',
    UNAUTHORIZED: 'גישה לא מורשית',
    SERVER_ERROR: 'שגיאת שרת פנימית',
    INVALID_DATA: 'נתונים לא תקינים'
  }
};

function getErrorMessage(key: keyof typeof ERROR_MESSAGES.en, lang: string = 'en'): string {
  const messages = ERROR_MESSAGES[lang as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.en;
  return messages[key];
}

// GET - Buscar detalhes de um restaurante específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    const { id: restaurantId } = await params;

    if (!restaurantId) {
      return errorResponse(getErrorMessage('INVALID_ID', lang), 400);
    }

    // Buscar restaurante com menu completo
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .select(`
        *,
        menu_items:menu_items(
          id,
          name,
          description,
          price,
          category,
          image_url,
          is_available,
          preparation_time,
          ingredients,
          allergens,
          nutritional_info,
          created_at,
          updated_at
        )
      `)
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }
      console.error('Erro ao buscar restaurante:', error);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    if (!restaurant) {
      return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
    }

    // Organizar menu por categorias
    const menuByCategory: Record<string, any[]> = {};
    const availableCategories = new Set<string>();

    if (restaurant.menu_items) {
      restaurant.menu_items.forEach((item: any) => {
        if (item.is_available) {
          if (!menuByCategory[item.category]) {
            menuByCategory[item.category] = [];
          }
          menuByCategory[item.category].push(item);
          availableCategories.add(item.category);
        }
      });
    }

    // Calcular estatísticas do menu
    const menuStats = {
      totalItems: restaurant.menu_items?.length || 0,
      availableItems: restaurant.menu_items?.filter((item: any) => item.is_available).length || 0,
      categories: Array.from(availableCategories),
      priceRange: {
        min: Math.min(...(restaurant.menu_items?.map((item: any) => item.price) || [0])),
        max: Math.max(...(restaurant.menu_items?.map((item: any) => item.price) || [0]))
      }
    };

    // Verificar se está aberto (por enquanto, sempre aberto)
    const isOpen = true;
    const nextOpenTime = null;

    // Buscar avaliações recentes (se existir tabela de reviews)
    // Por enquanto, usar dados mock
    const recentReviews: any[] = [];

    const restaurantDetails = {
      ...restaurant,
      menu: menuByCategory,
      menuStats,
      isOpen,
      nextOpenTime,
      recentReviews,
      deliveryTime: restaurant.estimated_delivery_time || '30-45 min',
      hasDelivery: restaurant.has_delivery ?? true,
      hasPickup: restaurant.has_pickup ?? false
    };

    return successResponse(restaurantDetails, 'Detalhes do restaurante obtidos com sucesso');
  } catch (error) {
    console.error('Erro interno ao buscar detalhes do restaurante:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}

// PUT - Atualizar restaurante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    const { id: restaurantId } = await params;
    const body = await request.json();

    if (!restaurantId) {
      return errorResponse(getErrorMessage('INVALID_ID', lang), 400);
    }

    // Verificar se o restaurante existe
    const { data: existingRestaurant, error: fetchError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single();

    if (fetchError || !existingRestaurant) {
      return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {};
    
    if (body.name) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.address) updateData.address = body.address.trim();
    if (body.city) updateData.city = body.city.trim();
    if (body.country !== undefined) updateData.country = body.country?.trim() || 'Israel';
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;
    if (body.cuisine_type) updateData.cuisine_type = body.cuisine_type.trim();
    if (body.operating_hours !== undefined) updateData.operating_hours = body.operating_hours || {};
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee ? parseFloat(body.delivery_fee) : 0.00;
    if (body.minimum_order !== undefined) updateData.minimum_order = body.minimum_order ? parseFloat(body.minimum_order) : 0.00;
    if (body.delivery_radius_km !== undefined) updateData.delivery_radius_km = body.delivery_radius_km ? parseInt(body.delivery_radius_km) : 5;
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString();

    // Atualizar no banco de dados
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating restaurant:', error);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    return successResponse(
      restaurant,
      lang === 'he' ? 'המסעדה עודכנה בהצלחה' : 'Restaurant updated successfully'
    );

  } catch (error) {
    console.error('PUT /api/restaurants/[id] error:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}

// DELETE - Excluir restaurante (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    const { id: restaurantId } = await params;

    if (!restaurantId) {
      return errorResponse(getErrorMessage('INVALID_ID', lang), 400);
    }

    // Verificar se o restaurante existe
    const { data: existingRestaurant, error: fetchError } = await supabaseAdmin
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurantId)
      .single();

    if (fetchError || !existingRestaurant) {
      return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
    }

    // Soft delete - marcar como inativo
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting restaurant:', error);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    return successResponse(
      { id: restaurantId, is_active: false },
      lang === 'he' ? 'המסעדה הוסרה בהצלחה' : 'Restaurant deleted successfully'
    );

  } catch (error) {
    console.error('DELETE /api/restaurants/[id] error:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}