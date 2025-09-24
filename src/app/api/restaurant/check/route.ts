// src/app/api/restaurant/check/route.ts
// API route para verificar se um restaurante já está cadastrado

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Verificando se restaurante está cadastrado para usuário:', userId);

    // Verificar na coleção de configurações de restaurante
    const configQuery = adminDb.collection('restaurant_configs')
      .where('restaurantId', '==', userId)
      .limit(1);
    
    const configSnapshot = await configQuery.get();
    
    if (!configSnapshot.empty) {
      console.log('✅ [API] Configuração de restaurante encontrada');
      return NextResponse.json({ hasRestaurant: true });
    }

    // Verificar na coleção principal de restaurantes
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    
    if (!restaurantSnapshot.empty) {
      console.log('✅ [API] Restaurante encontrado na coleção principal');
      return NextResponse.json({ hasRestaurant: true });
    }

    // Verificar se existe documento direto com o userId
    const directDoc = await adminDb.collection('restaurants').doc(userId).get();
    
    if (directDoc.exists) {
      console.log('✅ [API] Restaurante encontrado como documento direto');
      return NextResponse.json({ hasRestaurant: true });
    }

    console.log('⚠️ [API] Nenhum restaurante encontrado para o usuário');
    return NextResponse.json({ hasRestaurant: false });

  } catch (error) {
    console.error('❌ [API] Erro ao verificar restaurante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}