import { NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from '@/lib/api/response';
import { getSessionCookieFromRequest } from '@/utils/session-utils';

// Interface para criação/atualização de item do menu
interface MenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// GET - Listar itens do menu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const available = searchParams.get('available');

    // Verificar autenticação via cookie de sessão
    const sessionCookie = await getSessionCookieFromRequest(request);
    if (!sessionCookie) {
      return unauthorizedResponse('Sessão não encontrada. Faça login novamente.');
    }

    let userId: string;
    let userType: string;
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
      
      // Buscar tipo de usuário no Firestore
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return unauthorizedResponse('Usuário não encontrado');
      }
      
      userType = userDoc.data()?.user_type || userDoc.data()?.role;
      if (!userType) {
        return unauthorizedResponse('Tipo de usuário não definido');
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return unauthorizedResponse('Sessão inválida. Faça login novamente.');
    }

    try {
      let query: any = adminDb.collection('menu_items');

      // Se restaurantId for fornecido, filtrar por ele
      if (restaurantId) {
        query = query.where('restaurant_id', '==', restaurantId);
      } else if (userType === 'restaurant') {
        // Para restaurantes, usar o restaurantId dos custom claims ou buscar pelo owner_id
        const restaurantQuery = await adminDb.collection('restaurants')
          .where('owner_id', '==', userId)
          .get();
        
        if (restaurantQuery.empty) {
          return errorResponse('Restaurante não encontrado para este usuário');
        }
        
        const actualRestaurantId = restaurantQuery.docs[0].id;
        query = query.where('restaurant_id', '==', actualRestaurantId);
      } else {
        return errorResponse('ID do restaurante é obrigatório para este tipo de usuário');
      }

      // Filtrar por categoria se especificado
      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }

      // Filtrar por disponibilidade se especificado
      if (available !== null) {
        const isAvailable = available === 'true';
        query = query.where('is_available', '==', isAvailable);
      }

      const snapshot = await query.get();
      const menuItems = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar no lado cliente por categoria e nome
      menuItems.sort((a: any, b: any) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });

      // Organizar por categoria
      const menuByCategory: Record<string, any[]> = {};
      menuItems.forEach((item: any) => {
        if (!menuByCategory[item.category]) {
          menuByCategory[item.category] = [];
        }
        menuByCategory[item.category].push(item);
      });

      return successResponse({
        items: menuItems,
        byCategory: menuByCategory,
        totalItems: menuItems.length
      }, 'Itens do menu listados com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao buscar itens do menu no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao buscar itens do menu');
    }
  } catch (error) {
    console.error('Erro interno ao listar menu:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// POST - Criar novo item do menu
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via cookie de sessão
    const sessionCookie = await getSessionCookieFromRequest(request);
    if (!sessionCookie) {
      return unauthorizedResponse('Sessão não encontrada. Faça login novamente.');
    }

    let userId: string;
    let userType: string;
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
      
      // Buscar tipo de usuário no Firestore
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return unauthorizedResponse('Usuário não encontrado');
      }
      
      userType = userDoc.data()?.user_type || userDoc.data()?.role;
      if (userType !== 'restaurant') {
        return unauthorizedResponse('Apenas restaurantes podem criar itens do menu');
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return unauthorizedResponse('Sessão inválida. Faça login novamente.');
    }

    const body: MenuItemRequest = await request.json();

    // Validar dados obrigatórios
    const errors: string[] = [];
    if (!body.name || body.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }
    if (!body.description || body.description.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }
    if (!body.price || body.price <= 0) {
      errors.push('Preço deve ser maior que zero');
    }
    if (!body.category || body.category.trim().length === 0) {
      errors.push('Categoria é obrigatória');
    }

    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }

    try {
      // Buscar o restaurantId real
      const restaurantQuery = await adminDb.collection('restaurants')
        .where('owner_id', '==', userId)
        .get();
      
      if (restaurantQuery.empty) {
        return errorResponse('Restaurante não encontrado para este usuário');
      }
      
      const actualRestaurantId = restaurantQuery.docs[0].id;
      
      // Criar item do menu
      const menuItemData = {
        restaurant_id: actualRestaurantId,
        name: body.name.trim(),
        description: body.description.trim(),
        price: body.price,
        category: body.category.trim(),
        image_url: body.imageUrl,
        is_available: body.isAvailable ?? true,
        preparation_time: body.preparationTime || 15,
        ingredients: body.ingredients || [],
        allergens: body.allergens || [],
        nutritional_info: body.nutritionalInfo || {},
        created_at: new Date(),
        updated_at: new Date()
      };

      const docRef = await adminDb.collection('menu_items').add(menuItemData);
      const newMenuItem = await docRef.get();
      const menuItem = { id: newMenuItem.id, ...newMenuItem.data() };

      return successResponse(menuItem, 'Item do menu criado com sucesso', 201);
    } catch (firestoreError) {
      console.error('Erro ao criar item do menu no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao criar item do menu');
    }
  } catch (error) {
    console.error('Erro interno ao criar item do menu:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// PUT - Atualizar item do menu
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação via cookie de sessão
    const sessionCookie = await getSessionCookieFromRequest(request);
    if (!sessionCookie) {
      return unauthorizedResponse('Sessão não encontrada. Faça login novamente.');
    }

    let userId: string;
    let userType: string;
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
      
      // Buscar tipo de usuário no Firestore
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return unauthorizedResponse('Usuário não encontrado');
      }
      
      userType = userDoc.data()?.user_type || userDoc.data()?.role;
      if (userType !== 'restaurant') {
        return unauthorizedResponse('Apenas restaurantes podem atualizar itens do menu');
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return unauthorizedResponse('Sessão inválida. Faça login novamente.');
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return errorResponse('ID do item é obrigatório');
    }

    const body: Partial<MenuItemRequest> = await request.json();

    try {
      // Verificar se o item pertence ao restaurante
      const itemRef = adminDb.collection('menu_items').doc(itemId);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        return notFoundResponse('Item do menu não encontrado');
      }

      const itemData = itemDoc.data();
      
      // Para restaurantes, verificar se o item pertence ao seu restaurante
      const restaurantQuery = await adminDb.collection('restaurants')
        .where('owner_id', '==', userId)
        .get();
      
      if (restaurantQuery.empty) {
        return unauthorizedResponse('Restaurante não encontrado para este usuário');
      }
      
      const actualRestaurantId = restaurantQuery.docs[0].id;
      if (itemData?.restaurant_id !== actualRestaurantId) {
        return notFoundResponse('Item do menu não encontrado');
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: new Date()
      };

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.description !== undefined) updateData.description = body.description.trim();
      if (body.price !== undefined) updateData.price = body.price;
      if (body.category !== undefined) updateData.category = body.category.trim();
      if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
      if (body.isAvailable !== undefined) updateData.is_available = body.isAvailable;
      if (body.preparationTime !== undefined) updateData.preparation_time = body.preparationTime;
      if (body.ingredients !== undefined) updateData.ingredients = body.ingredients;
      if (body.allergens !== undefined) updateData.allergens = body.allergens;
      if (body.nutritionalInfo !== undefined) updateData.nutritional_info = body.nutritionalInfo;

      // Atualizar item
      await itemRef.update(updateData);
      
      // Buscar dados atualizados
      const updatedDoc = await itemRef.get();
      const updatedItem = { id: updatedDoc.id, ...updatedDoc.data() };

      return successResponse(updatedItem, 'Item do menu atualizado com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao atualizar item do menu no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao atualizar item do menu');
    }
  } catch (error) {
    console.error('Erro interno ao atualizar item do menu:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// DELETE - Remover item do menu
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação via cookie de sessão
    const sessionCookie = await getSessionCookieFromRequest(request);
    if (!sessionCookie) {
      return unauthorizedResponse('Sessão não encontrada. Faça login novamente.');
    }

    let userId: string;
    let userType: string;
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
      
      // Buscar tipo de usuário no Firestore
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return unauthorizedResponse('Usuário não encontrado');
      }
      
      userType = userDoc.data()?.user_type || userDoc.data()?.role;
      if (userType !== 'restaurant') {
        return unauthorizedResponse('Apenas restaurantes podem remover itens do menu');
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return unauthorizedResponse('Sessão inválida. Faça login novamente.');
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return errorResponse('ID do item é obrigatório');
    }

    try {
      // Verificar se o item pertence ao restaurante
      const itemRef = adminDb.collection('menu_items').doc(itemId);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        return notFoundResponse('Item do menu não encontrado');
      }

      const itemData = itemDoc.data();
      
      // Para restaurantes, verificar se o item pertence ao seu restaurante
      const restaurantQuery = await adminDb.collection('restaurants')
        .where('owner_id', '==', userId)
        .get();
      
      if (restaurantQuery.empty) {
        return unauthorizedResponse('Restaurante não encontrado para este usuário');
      }
      
      const actualRestaurantId = restaurantQuery.docs[0].id;
      if (itemData?.restaurant_id !== actualRestaurantId) {
        return notFoundResponse('Item do menu não encontrado');
      }

      // Remover item
      await itemRef.delete();

      return successResponse(null, 'Item do menu removido com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao remover item do menu no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao remover item do menu');
    }
  } catch (error) {
    console.error('Erro interno ao remover item do menu:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}