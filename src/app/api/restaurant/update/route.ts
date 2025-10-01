// src/app/api/restaurant/update/route.ts
// API para atualizar dados do restaurante no Firestore

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionCookieFromRequest } from '@/utils/session-utils';

interface UpdateRestaurantRequest {
  restaurantData: {
    phone?: string;
    email?: string;
  };
}

export async function PUT(request: NextRequest) {
  try {
    const { restaurantData }: UpdateRestaurantRequest = await request.json();
    
    // Obter cookie de sessão usando função robusta
    const sessionCookie = await getSessionCookieFromRequest(request);
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Sessão não encontrada. Faça login novamente.' },
        { status: 401 }
      );
    }

    console.log('🔄 [API Update Restaurant] Cookie de sessão encontrado:', {
      cookieLength: sessionCookie.length,
      timestamp: new Date().toISOString()
    });

    // Verificar token de sessão
    const decodedClaims = await adminAuth.verifySessionCookie();
    const uid = decodedClaims.uid;

    console.log('🔄 [API Update Restaurant] Atualizando dados do restaurante:', {
      uid: uid.substring(0, 8) + '...',
      restaurantData,
      timestamp: new Date().toISOString()
    });

    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', uid)
      .limit(1);
    
    const snapshot = await restaurantQuery.get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantDoc = snapshot.docs[0];
    const restaurantId = restaurantDoc.id;

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date()
    };

    if (restaurantData.phone !== undefined) {
      updateData.phone = restaurantData.phone.trim();
    }

    if (restaurantData.email !== undefined) {
      updateData.email = restaurantData.email.trim();
    }

    // Atualizar no Firestore
    await adminDb.collection('restaurants').doc(restaurantId).update(updateData);

    console.log('✅ [API Update Restaurant] Dados atualizados com sucesso:', {
      restaurantId,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    // Buscar dados atualizados
    const updatedDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    const updatedRestaurantData = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({
      success: true,
      message: 'Dados do restaurante atualizados com sucesso',
      restaurantData: updatedRestaurantData
    });

  } catch (error) {
    console.error('❌ [API Update Restaurant] Erro ao atualizar restaurante:', error);
    
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
