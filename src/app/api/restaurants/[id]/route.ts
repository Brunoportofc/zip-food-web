import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

// GET - Buscar detalhes de um restaurante específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;

    if (!restaurantId) {
      return errorResponse('ID do restaurante é obrigatório');
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
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Restaurante não encontrado');
      }
      console.error('Erro ao buscar restaurante:', error);
      return serverErrorResponse('Erro ao buscar restaurante');
    }

    if (!restaurant) {
      return notFoundResponse('Restaurante não encontrado');
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
    const recentReviews = [];

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
    return serverErrorResponse('Erro interno do servidor');
  }
}