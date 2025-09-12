import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

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