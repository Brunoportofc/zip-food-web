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

    // ✨ CORREÇÃO: Verificar se adminDb está disponível
    if (!adminDb) {
      console.error('❌ [API] Firebase Admin DB não disponível');
      return NextResponse.json(
        { hasRestaurant: false, error: 'Banco de dados não disponível' },
        { status: 503 }
      );
    }

    // ✨ CORREÇÃO: Usar a mesma lógica que a criação de restaurante
    // Verificar APENAS na coleção principal 'restaurants' com owner_id
    console.log('[API] 🏪 Verificando na coleção restaurants (owner_id)...');
    
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    console.log('[API] 🔍 Executando query para owner_id:', userId);
    const restaurantSnapshot = await restaurantQuery.get();
    
    console.log('[API] 📊 Resultado da query:', {
      empty: restaurantSnapshot.empty,
      size: restaurantSnapshot.size,
      docsLength: restaurantSnapshot.docs.length
    });
    
    if (!restaurantSnapshot.empty) {
      const restaurantData = restaurantSnapshot.docs[0].data();
      console.log('✅ [API] Restaurante encontrado:', {
        restaurantId: restaurantSnapshot.docs[0].id,
        name: restaurantData.name,
        owner_id: '***',
        is_active: restaurantData.is_active
      });
      
      return NextResponse.json({ 
        hasRestaurant: true,
        restaurantId: restaurantSnapshot.docs[0].id,
        restaurantData: {
          id: restaurantSnapshot.docs[0].id,
          name: restaurantData.name,
          is_active: restaurantData.is_active
        }
      });
    }

    console.log('⚠️ [API] Nenhum restaurante encontrado para o usuário:', userId);
    return NextResponse.json({ hasRestaurant: false });

  } catch (error) {
    console.error('❌ [API] Erro ao verificar restaurante:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor', hasRestaurant: false },
      { status: 500 }
    );
  }
}