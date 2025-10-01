// src/app/api/notifications/stream/route.ts
// Server-Sent Events para notificações em tempo real

import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return new Response('Não autenticado', { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    
    if (restaurantSnapshot.empty) {
      return new Response('Restaurante não encontrado', { status: 404 });
    }

    const restaurantId = restaurantSnapshot.docs[0].id;

    // Configurar SSE
    const encoder = new TextEncoder();
    let lastNotificationTime = new Date();

    const stream = new ReadableStream({
      start(controller) {
        console.log('🔄 [SSE] Stream iniciado para restaurante:', restaurantId);
        
        // Enviar evento inicial
        const data = `data: ${JSON.stringify({ type: 'connected', message: 'Conectado ao stream de notificações' })}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Configurar listener para novas notificações
        const checkForNewNotifications = async () => {
          try {
            const newNotificationsQuery = await adminDb
              .collection('notifications')
              .where('restaurantId', '==', restaurantId)
              .where('timestamp', '>', lastNotificationTime)
              .orderBy('timestamp', 'desc')
              .get();

            if (!newNotificationsQuery.empty) {
              newNotificationsQuery.docs.forEach((doc: any) => {
                const notification = {
                  id: doc.id,
                  ...doc.data(),
                  timestamp: doc.data().timestamp.toDate()
                };

                const eventData = `data: ${JSON.stringify({
                  type: 'notification',
                  data: notification
                })}\n\n`;
                
                controller.enqueue(encoder.encode(eventData));
                
                // Atualizar último timestamp
                if (notification.timestamp > lastNotificationTime) {
                  lastNotificationTime = notification.timestamp;
                }
              });
            }
          } catch (error) {
            console.error('❌ [SSE] Erro ao verificar notificações:', error);
          }
        };

        // Verificar a cada 5 segundos
        const interval = setInterval(checkForNewNotifications, 5000);

        // Cleanup quando a conexão for fechada
        return () => {
          console.log('🔌 [SSE] Stream fechado para restaurante:', restaurantId);
          clearInterval(interval);
        };
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('❌ [SSE] Erro no stream:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}
