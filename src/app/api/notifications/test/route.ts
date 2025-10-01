// src/app/api/notifications/test/route.ts
// API para criar notificações de teste

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

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
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
    const restaurantData = restaurantSnapshot.docs[0].data();

    // Criar notificações de teste
    const testNotifications = [
      {
        title: '🛒 Novo Pedido Recebido',
        message: `Pedido #${Math.floor(Math.random() * 9999)} - Pizza Margherita para João Silva (R$ 45.90)`,
        type: 'order',
        priority: 'high',
        orderId: `ORD-${Date.now()}`,
        action: {
          label: 'Ver Pedido',
          url: '/restaurant/pedidos'
        },
        metadata: {
          customerName: 'João Silva',
          total: 45.90,
          items: 'Pizza Margherita'
        }
      },
      {
        title: '⭐ Nova Avaliação (5/5)',
        message: 'Maria Santos avaliou seu pedido com 5 estrelas: "Comida excelente!"',
        type: 'success',
        priority: 'normal',
        metadata: {
          rating: 5,
          customerName: 'Maria Santos',
          comment: 'Comida excelente!'
        }
      },
      {
        title: '⚠️ Estoque Baixo',
        message: 'Mussarela está com apenas 3 unidades restantes',
        type: 'warning',
        priority: 'high',
        metadata: {
          item: 'Mussarela',
          quantity: 3
        }
      },
      {
        title: '💰 Pagamento Confirmado',
        message: `Pedido #${Math.floor(Math.random() * 9999)} - Pagamento de R$ 67.50 via PIX foi confirmado`,
        type: 'success',
        priority: 'normal',
        metadata: {
          amount: 67.50,
          paymentMethod: 'PIX'
        }
      },
      {
        title: '🚚 Entregador Designado',
        message: `Pedido #${Math.floor(Math.random() * 9999)} - Carlos Silva foi designado para a entrega`,
        type: 'info',
        priority: 'normal',
        metadata: {
          driverName: 'Carlos Silva',
          deliveryStatus: 'assigned'
        }
      }
    ];

    // Salvar todas as notificações
    const batch = adminDb.batch();
    const createdNotifications = [];

    for (const notification of testNotifications) {
      const docRef = adminDb.collection('notifications').doc('test-notification-' + Math.random());
      const notificationData = {
        ...notification,
        timestamp: new Date(),
        read: false,
        restaurantId
      };
      
      batch.set(docRef, notificationData);
      createdNotifications.push({
        id: docRef.id,
        ...notificationData
      });
    }

    await batch.commit();

    console.log('✅ [Test Notifications] Notificações de teste criadas:', createdNotifications.length);

    return NextResponse.json({
      success: true,
      message: `${createdNotifications.length} notificações de teste criadas com sucesso`,
      data: {
        created: createdNotifications.length,
        restaurantId,
        restaurantName: restaurantData.name
      }
    });

  } catch (error) {
    console.error('❌ [Test Notifications] Erro ao criar notificações de teste:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
