// src/app/api/restaurant/toggle-status/route.ts
// API para alternar status aberto/fechado do restaurante

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie();
    const userId = decodedClaims.uid;

    const { is_active } = await request.json();

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Status deve ser verdadeiro ou falso' },
        { status: 400 }
      );
    }

    console.log('🔄 [Toggle Status] Alterando status do restaurante:', { userId, is_active });

    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    
    if (restaurantSnapshot.empty) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantDoc = restaurantSnapshot.docs[0];
    const restaurantId = restaurantDoc.id;

    // Atualizar apenas o status
    await adminDb.collection('restaurants').doc(restaurantId).update({
      is_active,
      updated_at: new Date()
    });

    console.log('✅ [Toggle Status] Status atualizado com sucesso:', { 
      restaurantId, 
      is_active,
      status: is_active ? 'ABERTO' : 'FECHADO'
    });

    return NextResponse.json({
      success: true,
      is_active,
      message: is_active 
        ? 'Restaurante aberto! Agora você pode receber pedidos.'
        : 'Restaurante fechado. Os clientes não verão sua loja.'
    });

  } catch (error) {
    console.error('❌ [Toggle Status] Erro ao alterar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
