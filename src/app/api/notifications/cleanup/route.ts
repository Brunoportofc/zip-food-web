// src/app/api/notifications/cleanup/route.ts
// API para limpar notificações órfãs ou antigas

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
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

    const restaurantId = restaurantSnapshot.docs[0].id;

    // Buscar todas as notificações do restaurante
    const allNotificationsQuery = await adminDb
      .collection('notifications')
      .where('restaurantId', '==', restaurantId)
      .get();

    console.log('🔍 [Cleanup] Notificações encontradas:', allNotificationsQuery.size);

    let deletedCount = 0;
    let updatedCount = 0;
    const batch = adminDb.batch();

    allNotificationsQuery.docs.forEach((doc: any) => {
      const data = doc.data();
      
      // Verificar se a notificação tem dados válidos
      if (!data.title || !data.message || !data.type) {
        console.log('🗑️ [Cleanup] Deletando notificação inválida:', doc.id);
        batch.delete(doc.ref);
        deletedCount++;
      } else if (!data.timestamp) {
        // Adicionar timestamp se não existir
        console.log('🔧 [Cleanup] Adicionando timestamp:', doc.id);
        batch.update(doc.ref, { timestamp: new Date() });
        updatedCount++;
      } else if (typeof data.read !== 'boolean') {
        // Corrigir campo read se não for boolean
        console.log('🔧 [Cleanup] Corrigindo campo read:', doc.id);
        batch.update(doc.ref, { read: false });
        updatedCount++;
      }
    });

    // Executar batch se há operações
    if (deletedCount > 0 || updatedCount > 0) {
      await batch.commit();
    }

    // Contar notificações após limpeza
    const finalQuery = await adminDb
      .collection('notifications')
      .where('restaurantId', '==', restaurantId)
      .get();

    const unreadQuery = await adminDb
      .collection('notifications')
      .where('restaurantId', '==', restaurantId)
      .where('read', '==', false)
      .get();

    console.log('✅ [Cleanup] Limpeza concluída:', {
      deleted: deletedCount,
      updated: updatedCount,
      remaining: finalQuery.size,
      unread: unreadQuery.size
    });

    return NextResponse.json({
      success: true,
      message: 'Limpeza concluída com sucesso',
      data: {
        deleted: deletedCount,
        updated: updatedCount,
        remaining: finalQuery.size,
        unread: unreadQuery.size
      }
    });

  } catch (error) {
    console.error('❌ [Cleanup] Erro na limpeza:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
