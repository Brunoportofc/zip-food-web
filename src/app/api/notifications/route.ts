// src/app/api/notifications/route.ts
// API para gerenciar notificações reais

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// GET - Buscar notificações do restaurante
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [Notifications API] Iniciando busca de notificações...');
    
    // Verificar autenticação
    const sessionCookie = request.cookies.get('session')?.value;
    console.log('🔄 [Notifications API] Session cookie presente:', !!sessionCookie);
    
    if (!sessionCookie) {
      console.log('❌ [Notifications API] Sem cookie de sessão');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;
    console.log('🔄 [Notifications API] UserId:', userId);

    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    console.log('🔄 [Notifications API] Restaurantes encontrados:', restaurantSnapshot.size);
    
    if (restaurantSnapshot.empty) {
      console.log('❌ [Notifications API] Nenhum restaurante encontrado para o usuário');
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantId = restaurantSnapshot.docs[0].id;
    console.log('🔄 [Notifications API] RestaurantId:', restaurantId);

    // Buscar notificações do restaurante
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter') || 'all';

    let query = adminDb.collection('notifications')
      .where('restaurantId', '==', restaurantId);

    // Aplicar filtros primeiro, depois ordenação
    if (filter === 'unread') {
      query = query.where('read', '==', false);
    } else if (filter === 'order') {
      query = query.where('type', '==', 'order');
    } else if (filter === 'system') {
      query = query.where('type', '==', 'system');
    }

    let notifications = [];
    let snapshot;

    try {
      // Tentar query com ordenação
      query = query.orderBy('timestamp', 'desc').limit(limit);
      snapshot = await query.get();
    } catch (orderError) {
      console.log('⚠️ [Notifications API] Fallback para query sem ordenação:', orderError instanceof Error ? orderError.message : 'Erro desconhecido');
      
      // Fallback: query simples sem ordenação
      query = adminDb.collection('notifications')
        .where('restaurantId', '==', restaurantId)
        .limit(limit);

      // Aplicar filtros novamente
      if (filter === 'unread') {
        query = query.where('read', '==', false);
      } else if (filter === 'order') {
        query = query.where('type', '==', 'order');
      } else if (filter === 'system') {
        query = query.where('type', '==', 'system');
      }

      snapshot = await query.get();
    }
    
    notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        type: data.type,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        read: data.read || false,
        priority: data.priority || 'normal',
        orderId: data.orderId,
        action: data.action,
        metadata: data.metadata
      };
    });

    // Ordenar no cliente se não foi possível no servidor
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Contar não lidas
    let unreadCount = 0;
    try {
      const unreadSnapshot = await adminDb.collection('notifications')
        .where('restaurantId', '==', restaurantId)
        .where('read', '==', false)
        .get();
      unreadCount = unreadSnapshot.size;
    } catch (unreadError) {
      console.log('⚠️ [Notifications API] Erro ao contar não lidas, usando fallback');
      unreadCount = notifications.filter(n => !n.read).length;
    }

    console.log('✅ [Notifications API] Retornando dados:', {
      totalNotifications: notifications.length,
      unreadCount,
      unreadFromArray: notifications.filter(n => !n.read).length
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });

  } catch (error) {
    console.error('❌ [Notifications API] Erro ao buscar notificações:', error);
    
    // Log detalhado para debug
    if (error instanceof Error) {
      console.error('❌ [Notifications API] Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova notificação
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

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
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

    const {
      title,
      message,
      type,
      priority = 'normal',
      orderId,
      action,
      metadata
    } = await request.json();

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Título, mensagem e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const notification = {
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      restaurantId,
      priority,
      orderId: orderId || null,
      action: action || null,
      metadata: metadata || null
    };

    const docRef = await adminDb.collection('notifications').add(notification);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...notification
      }
    });

  } catch (error) {
    console.error('❌ [Notifications API] Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar notificação (marcar como lida, etc.)
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

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const { notificationId, read, action } = await request.json();

      if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
      }

      // Verificar se a notificação pertence ao usuário
    const notificationDoc = await adminDb.collection('notifications').doc(notificationId).get();

      if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
      }

      const notificationData = notificationDoc.data();
    
    // Verificar se o restaurante pertence ao usuário
    const restaurantDoc = await adminDb.collection('restaurants').doc(notificationData!.restaurantId).get();
    
    if (!restaurantDoc.exists || restaurantDoc.data()!.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const updates: any = {};
    
    if (typeof read === 'boolean') {
      updates.read = read;
      if (read) {
        updates.readAt = new Date();
      }
    }

    if (action === 'markAllAsRead') {
      // Marcar todas as notificações do restaurante como lidas
      const batch = adminDb.batch();
      const unreadQuery = await adminDb.collection('notifications')
        .where('restaurantId', '==', notificationData!.restaurantId)
        .where('read', '==', false)
        .get();

      unreadQuery.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: new Date() });
      });

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas',
        updated: unreadQuery.size
      });
    }

    if (Object.keys(updates).length > 0) {
      await adminDb.collection('notifications').doc(notificationId).update(updates);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: notificationId,
        ...updates
      }
    });

  } catch (error) {
    console.error('❌ [Notifications API] Erro ao atualizar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar notificação
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'clearAll') {
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

      // Deletar todas as notificações do restaurante
        const batch = adminDb.batch();
      const allNotificationsQuery = await adminDb.collection('notifications')
        .where('restaurantId', '==', restaurantId)
        .get();
        
      allNotificationsQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();

      return NextResponse.json({
        success: true,
        message: 'Todas as notificações foram removidas',
        deleted: allNotificationsQuery.size
      });
      }

      if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
      }

      // Verificar se a notificação pertence ao usuário
    const notificationDoc = await adminDb.collection('notifications').doc(notificationId).get();

      if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
      }

      const notificationData = notificationDoc.data();
    
    // Verificar se o restaurante pertence ao usuário
    const restaurantDoc = await adminDb.collection('restaurants').doc(notificationData!.restaurantId).get();
    
    if (!restaurantDoc.exists || restaurantDoc.data()!.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    await adminDb.collection('notifications').doc(notificationId).delete();

    return NextResponse.json({
      success: true,
      message: 'Notificação removida com sucesso'
    });

  } catch (error) {
    console.error('❌ [Notifications API] Erro ao deletar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}