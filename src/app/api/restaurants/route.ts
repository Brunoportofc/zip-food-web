import { NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

// Mensagens de erro internacionalizadas
const ERROR_MESSAGES = {
  en: {
    MISSING_REQUIRED_FIELDS: 'Required fields are missing',
    INVALID_DATA: 'Invalid data provided',
    SERVER_ERROR: 'Internal server error',
    RESTAURANT_CREATED: 'Restaurant created successfully'
  },
  pt: {
    MISSING_REQUIRED_FIELDS: 'Dados obrigatórios não fornecidos',
    INVALID_DATA: 'Dados inválidos fornecidos',
    SERVER_ERROR: 'Erro interno do servidor',
    RESTAURANT_CREATED: 'Restaurante criado com sucesso'
  }
};

function getErrorMessage(key: keyof typeof ERROR_MESSAGES.en, lang: string = 'pt'): string {
  const messages = ERROR_MESSAGES[lang as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.pt;
  return messages[key];
}

// POST - Criar novo restaurante
export async function POST(request: NextRequest) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'pt';
    const body = await request.json();

    console.log('📥 [POST /api/restaurants] Dados recebidos:', {
      ...body,
      ownerId: body.ownerId ? '***' : undefined // Mascarar o ownerId no log
    });

    // Validar campos obrigatórios
    const { name, address, city, ownerId, cuisine_type, ...rest } = body;

    if (!name || !address || !city || !ownerId || !cuisine_type) {
      console.log('❌ [POST /api/restaurants] Campos obrigatórios ausentes:', {
        name: !!name,
        address: !!address,
        city: !!city,
        ownerId: !!ownerId,
        cuisine_type: !!cuisine_type
      });
      return errorResponse(getErrorMessage('MISSING_REQUIRED_FIELDS', lang), 400);
    }

    // Preparar dados do restaurante
    const newRestaurant = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      cuisine_type: cuisine_type.trim(),
      owner_id: ownerId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      // Campos opcionais
      description: rest.description?.trim() || null,
      country: rest.country?.trim() || 'Brasil',
      latitude: rest.latitude ? parseFloat(rest.latitude) : null,
      longitude: rest.longitude ? parseFloat(rest.longitude) : null,
      operating_hours: rest.operating_hours || {},
      phone: rest.phone?.trim() || null,
      email: rest.email?.trim() || null,
      delivery_fee: rest.delivery_fee ? parseFloat(rest.delivery_fee) : 0.00,
      minimum_order: rest.minimum_order ? parseFloat(rest.minimum_order) : 0.00,
      delivery_radius_km: rest.delivery_radius_km ? parseInt(rest.delivery_radius_km) : 5,
      // Campos de imagem (se fornecidos)
      logo_url: rest.logo_url || null,
      cover_image_url: rest.cover_image_url || null,
      // Campos de configuração padrão
      has_delivery: true,
      has_pickup: false,
      estimated_delivery_time: '30-45 min',
      rating: 0,
      total_reviews: 0
    };

    console.log('💾 [POST /api/restaurants] Salvando restaurante no Firestore...');

    let createdRestaurant: any = null;

    try {
      // Salvar no Firestore e definir custom claim em uma transação
      const docRef = await adminDb.collection('restaurants').add(newRestaurant);
      const newDoc = await docRef.get();
      createdRestaurant = { id: newDoc.id, ...newDoc.data() };

      // ✨ CORREÇÃO CRÍTICA: Definir custom claim para indicar que o usuário tem restaurante
      try {
        await adminAuth.setCustomUserClaims(ownerId, { 
          hasRestaurant: true,
          restaurantId: docRef.id 
        });
        console.log('✅ [POST /api/restaurants] Custom claims definidos com sucesso:', {
          ownerId: '***',
          restaurantId: docRef.id,
          claims: { hasRestaurant: true, restaurantId: docRef.id }
        });
      } catch (claimsError) {
        console.error('❌ [POST /api/restaurants] Erro ao definir custom claims:', claimsError);
        // Não falhar a criação do restaurante se apenas os claims falharem
        // Mas logar o erro para investigação
      }

      console.log('✅ [POST /api/restaurants] Restaurante criado com sucesso:', {
        id: createdRestaurant.id,
        name: createdRestaurant.name,
        owner_id: createdRestaurant.owner_id ? '***' : undefined
      });
    } catch (firestoreError) {
      console.error('❌ [POST /api/restaurants] Erro no Firestore:', firestoreError);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

    return successResponse(
      createdRestaurant,
      getErrorMessage('RESTAURANT_CREATED', lang),
      201
    );

  } catch (error) {
    console.error('❌ [POST /api/restaurants] Erro interno:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'pt';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}

// GET - Listar restaurantes (com filtros opcionais)
export async function GET(request: NextRequest) {
  try {
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'pt';
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const status = searchParams.get('status') || 'active';
    const category = searchParams.get('category');
    const owner = searchParams.get('owner');
    const promoted = searchParams.get('promoted');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('📋 [GET /api/restaurants] Listando restaurantes com filtros:', {
      status,
      category,
      owner: owner ? '***' : undefined,
      promoted,
      limit
    });

    try {
      let query = adminDb.collection('restaurants') as any;

      // Aplicar filtros
      if (status === 'active') {
        query = query.where('is_active', '==', true);
      } else if (status === 'pending') {
        query = query.where('is_active', '==', false);
      }

      if (category) {
        query = query.where('cuisine_type', '==', category);
      }

      if (owner) {
        query = query.where('owner_id', '==', owner);
      }

      if (promoted === 'true') {
        query = query.where('is_promoted', '==', true);
      }

      // Aplicar limite (removido orderBy para evitar erro de índice)
      query = query.limit(limit);

      const snapshot = await query.get();
      let restaurants = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Mapear cuisine_type para category para compatibilidade com o frontend
          category: data.cuisine_type,
          deliveryFee: data.delivery_fee || 0,
          minimumOrder: data.minimum_order || 0,
          estimatedDeliveryTime: data.estimated_delivery_time || '30-45 min',
          rating: data.rating || 0,
          isPromoted: data.is_promoted || false,
          status: data.is_active ? 'active' : 'inactive',
          ownerId: data.owner_id,
          createdAt: data.created_at?.toDate() || new Date(),
          updatedAt: data.updated_at?.toDate() || new Date(),
          // Usar cover_image_url como imagem principal, com fallback para logo e depois padrão
          image: data.cover_image_url || data.logo_url || '/images/restaurants/default-cover.svg',
          // Incluir campos de imagem separados para compatibilidade
          cover_image_url: data.cover_image_url || '/images/restaurants/default-cover.svg',
          logo_url: data.logo_url || '/images/restaurants/default-logo.svg'
        };
      });

      // Ordenar no lado cliente por created_at (mais recentes primeiro)
      restaurants.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      console.log(`✅ [GET /api/restaurants] ${restaurants.length} restaurantes encontrados`);
      
      // Log detalhado para debug de imagens
      restaurants.forEach((restaurant: any) => {
        if (restaurant.id === 'VNw7DLSokSeECmRjkGzQ') { // ID do seu restaurante
          console.log('🖼️ [GET /api/restaurants] Dados de imagem do restaurante:', {
            id: restaurant.id,
            name: restaurant.name,
            cover_image_url: restaurant.cover_image_url,
            logo_url: restaurant.logo_url,
            image: restaurant.image,
            category: restaurant.category,
            delivery_fee: restaurant.deliveryFee,
            minimum_order: restaurant.minimumOrder,
            timestamp: new Date().toISOString()
          });
        }
      });

      return successResponse(
        restaurants,
        `${restaurants.length} restaurantes encontrados`
      );

    } catch (firestoreError) {
      console.error('❌ [GET /api/restaurants] Erro no Firestore:', firestoreError);
      return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
    }

  } catch (error) {
    console.error('❌ [GET /api/restaurants] Erro interno:', error);
    const lang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0] || 'pt';
    return serverErrorResponse(getErrorMessage('SERVER_ERROR', lang));
  }
}