// src/app/api/restaurant/check/route.ts
// API route para verificar se um restaurante já está cadastrado

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      console.log('❌ [API] ID do usuário não fornecido');
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Verificando se restaurante está cadastrado para usuário:', userId);

    // [DIAGNÓSTICO] Verificar na coleção de configurações de restaurante
    console.log('[API] 📋 Verificando na coleção restaurant_configs...');
    const configQuery = adminDb.collection('restaurant_configs')
      .where('restaurantId', '==', userId)
      .limit(1);
    
    const configSnapshot = await configQuery.get();
    
    if (!configSnapshot.empty) {
      const configData = configSnapshot.docs[0].data();
      console.log('✅ [API] Configuração de restaurante encontrada:', {
        configId: configSnapshot.docs[0].id,
        restaurantId: configData.restaurantId,
        businessName: configData.businessName,
        approvalStatus: configData.approvalStatus
      });
      return NextResponse.json({ hasRestaurant: true });
    }

    // [DIAGNÓSTICO] Verificar na coleção principal de restaurantes
    console.log('[API] 🏪 Verificando na coleção restaurants (owner_id)...');
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    
    if (!restaurantSnapshot.empty) {
      const restaurantData = restaurantSnapshot.docs[0].data();
      console.log('✅ [API] Restaurante encontrado na coleção principal:', {
        restaurantId: restaurantSnapshot.docs[0].id,
        name: restaurantData.name,
        owner_id: restaurantData.owner_id,
        status: restaurantData.status
      });
      return NextResponse.json({ hasRestaurant: true });
    }

    // [DIAGNÓSTICO] Verificar se existe documento direto com o userId
    console.log('[API] 📄 Verificando documento direto com userId...');
    const directDoc = await adminDb.collection('restaurants').doc(userId).get();
    
    if (directDoc.exists) {
      const directData = directDoc.data();
      console.log('✅ [API] Restaurante encontrado como documento direto:', {
        userId,
        name: directData?.name,
        status: directData?.status
      });
      return NextResponse.json({ hasRestaurant: true });
    }

    console.log('⚠️ [API] Nenhum restaurante encontrado para o usuário:', {
      userId,
      checkedCollections: ['restaurant_configs', 'restaurants (owner_id)', 'restaurants (direct doc)']
    });
    return NextResponse.json({ hasRestaurant: false });

  } catch (error) {
    console.error('❌ [API] Erro ao verificar restaurante:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}