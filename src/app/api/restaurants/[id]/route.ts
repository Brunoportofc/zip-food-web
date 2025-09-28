import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
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

    let restaurant: any = null;
    
    try {
      // Buscar restaurante
      const restaurantRef = adminDb.collection('restaurants').doc(restaurantId);
      const restaurantDoc = await restaurantRef.get();

      if (!restaurantDoc.exists) {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }

      const restaurantData = restaurantDoc.data();
      if (!restaurantData?.is_active) {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }

      restaurant = { id: restaurantDoc.id, ...restaurantData } as any;

      // Buscar itens do menu do restaurante
      const menuSnapshot = await adminDb.collection('menu_items')
        .where('restaurant_id', '==', restaurantId)
        .get();

      const menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      restaurant.menu_items = menuItems;
    } catch (firestoreError) {
      console.error('Erro ao buscar restaurante no Firestore:', firestoreError);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
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
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      city: restaurant.city,
      phone: restaurant.phone,
      email: restaurant.email,
      // Mapear cuisine_type para category para compatibilidade com o frontend
      category: restaurant.cuisine_type || restaurant.category,
      deliveryFee: restaurant.delivery_fee || 0,
      minimumOrder: restaurant.minimum_order || 0,
      estimatedDeliveryTime: restaurant.estimated_delivery_time || '30-45 min',
      rating: restaurant.rating || 0,
      isPromoted: restaurant.is_promoted || false,
      status: restaurant.is_active ? 'active' : 'inactive',
      ownerId: restaurant.owner_id,
      createdAt: restaurant.created_at?.toDate() || new Date(),
      updatedAt: restaurant.updated_at?.toDate() || new Date(),
      // Imagens atualizadas
      image: restaurant.cover_image_url || restaurant.logo_url || '/images/restaurants/default-cover.svg',
      logo: restaurant.logo_url || '/images/restaurants/default-logo.svg',
      coverImage: restaurant.cover_image_url || '/images/restaurants/default-cover.svg',
      // Horários de funcionamento atualizados
      operatingHours: restaurant.operating_hours || {},
      // Dados do menu
      menu: menuByCategory,
      menuStats,
      // Status operacional
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

    let restaurant: any = null;

    try {
      // Verificar se o restaurante existe
      const restaurantRef = adminDb.collection('restaurants').doc(restaurantId);
      const restaurantDoc = await restaurantRef.get();

      if (!restaurantDoc.exists) {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }

      const existingRestaurant = restaurantDoc.data();
      if (!existingRestaurant?.is_active) {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }

    // Log dos dados recebidos para debug
    console.log('🔄 [PUT /api/restaurants] Dados recebidos para atualização:', {
      restaurantId,
      body: { ...body, id: undefined }, // Remover ID do log
      timestamp: new Date().toISOString()
    });

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {};
    
    // Campos de texto - usar !== undefined para permitir strings vazias
    if (body.name !== undefined) updateData.name = body.name?.trim() || null;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || 'Brasil';
    
    // Campos numéricos
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;
    if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee !== null ? parseFloat(body.delivery_fee) || 0 : 0;
    if (body.minimum_order !== undefined) updateData.minimum_order = body.minimum_order !== null ? parseFloat(body.minimum_order) || 0 : 0;
    if (body.delivery_radius_km !== undefined) updateData.delivery_radius_km = body.delivery_radius_km ? parseInt(body.delivery_radius_km) : 5;
    
    // Campos de categoria e tipo
    if (body.cuisine_type !== undefined) updateData.cuisine_type = body.cuisine_type?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category?.trim() || null;
    
    // Campos de tempo e horários
    if (body.operating_hours !== undefined) updateData.operating_hours = body.operating_hours || {};
    if (body.estimated_delivery_time !== undefined) updateData.estimated_delivery_time = body.estimated_delivery_time?.trim() || '30-45 min';
    
    // Campos de contato
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    
    // Campos de imagem para "Minha Loja"
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url?.trim() || null;
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url?.trim() || null;
    
    // Campo de status
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);

    // Log dos dados que serão atualizados
    console.log('💾 [PUT /api/restaurants] Dados preparados para atualização:', {
      updateData,
      fieldsCount: Object.keys(updateData).length,
      timestamp: new Date().toISOString()
    });

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date();

      // Atualizar no Firestore
      await restaurantRef.update(updateData);
      
      console.log('✅ [PUT /api/restaurants] Restaurante atualizado com sucesso no Firestore:', {
        restaurantId,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });
      
      // Buscar dados atualizados
      const updatedDoc = await restaurantRef.get();
      restaurant = { id: updatedDoc.id, ...updatedDoc.data() };
      
      console.log('📤 [PUT /api/restaurants] Dados atualizados retornados:', {
        restaurantId,
        hasData: !!restaurant,
        updatedData: {
          name: restaurant.name,
          description: restaurant.description,
          logo_url: restaurant.logo_url,
          cover_image_url: restaurant.cover_image_url,
          category: restaurant.category,
          delivery_fee: restaurant.delivery_fee,
          minimum_order: restaurant.minimum_order,
          estimated_delivery_time: restaurant.estimated_delivery_time
        },
        timestamp: new Date().toISOString()
      });
    } catch (firestoreError) {
      console.error('Erro ao atualizar restaurante no Firestore:', firestoreError);
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

    try {
      // Verificar se o restaurante existe
      const restaurantRef = adminDb.collection('restaurants').doc(restaurantId);
      const restaurantDoc = await restaurantRef.get();

      if (!restaurantDoc.exists) {
        return errorResponse(getErrorMessage('RESTAURANT_NOT_FOUND', lang), 404);
      }

      // Soft delete - marcar como inativo
      await restaurantRef.update({ 
        is_active: false,
        updated_at: new Date()
      });
    } catch (firestoreError) {
      console.error('Erro ao deletar restaurante no Firestore:', firestoreError);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    return successResponse(
      null,
      lang === 'he' ? 'המסעדה הוסרה בהצלחה' : 'Restaurant deleted successfully'
    );

  } catch (error) {
    console.error('DELETE /api/restaurants/[id] error:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'en';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}