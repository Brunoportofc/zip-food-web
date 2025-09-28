// src/app/api/restaurant/sync-claims/route.ts
// API para sincronizar custom claims de restaurantes

import { NextRequest, NextResponse } from 'next/server';
import { syncRestaurantClaims, syncUserRestaurantClaims } from '@/utils/sync-restaurant-claims';

// POST - Sincronizar claims para um usuário específico ou todos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, syncAll } = body;

    if (syncAll) {
      console.log('🔄 [API] Sincronizando claims para todos os restaurantes...');
      const result = await syncRestaurantClaims();
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `${result.updated} claims sincronizados com sucesso`
          : 'Erro durante sincronização',
        updated: result.updated,
        error: result.error
      });
    }
    
    if (userId) {
      console.log('🔄 [API] Sincronizando claims para usuário específico:', userId);
      const result = await syncUserRestaurantClaims(userId);
      
      return NextResponse.json({
        success: result.success,
        hasRestaurant: result.hasRestaurant,
        restaurantId: result.restaurantId,
        message: result.success 
          ? 'Claims sincronizados com sucesso'
          : 'Erro durante sincronização',
        error: result.error
      });
    }

    return NextResponse.json(
      { error: 'Parâmetro userId ou syncAll é obrigatório' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [API] Erro na sincronização de claims:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
