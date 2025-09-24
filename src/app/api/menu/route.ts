import { NextRequest } from 'next/server';
import { db as adminDb } from '@/lib/api/firebase';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from '@/lib/api/response';

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

    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    try {
      let query: any = adminDb.collection('menu_items');

      // Se restaurantId for fornecido, filtrar por ele
      if (restaurantId) {
        query = query.where('restaurant_id', '==', restaurantId);
      } else if (userType === 'restaurant') {
        // Se for restaurante e não especificar ID, mostrar apenas seus itens
        query = query.where('restaurant_id', '==', userId);
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

      const snapshot = await query.orderBy('category').orderBy('name').get();
      const menuItems = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

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
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== 'restaurant') {
      return unauthorizedResponse('Apenas restaurantes podem criar itens do menu');
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
      // Criar item do menu
      const menuItemData = {
        restaurant_id: userId,
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
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== 'restaurant') {
      return unauthorizedResponse('Apenas restaurantes podem atualizar itens do menu');
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
      if (itemData?.restaurant_id !== userId) {
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
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== 'restaurant') {
      return unauthorizedResponse('Apenas restaurantes podem remover itens do menu');
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
      if (itemData?.restaurant_id !== userId) {
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