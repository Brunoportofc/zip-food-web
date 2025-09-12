import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configurar VAPID keys (em produção, use variáveis de ambiente)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@zipfood.com'
};

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Simulação de banco de dados para subscriptions
// Em produção, use um banco de dados real
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'userId e subscription são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato da subscription
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { error: 'Formato de subscription inválido' },
        { status: 400 }
      );
    }

    // Armazenar subscription
    subscriptions.set(userId, {
      ...subscription,
      userId,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    console.log(`Subscription registrada para usuário ${userId}`);

    // Enviar notificação de boas-vindas
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'ZipFood - Notificações Ativadas! 🎉',
          body: 'Você receberá atualizações sobre seus pedidos em tempo real.',
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          tag: 'welcome',
          data: {
            type: 'welcome',
            timestamp: Date.now()
          }
        })
      );
    } catch (pushError) {
      console.error('Erro ao enviar notificação de boas-vindas:', pushError);
      // Não falhar a requisição por causa disso
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Subscription registrada com sucesso',
        subscriptionId: userId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao processar subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Remover subscription
    const deleted = subscriptions.delete(userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Subscription não encontrada' },
        { status: 404 }
      );
    }

    console.log(`Subscription removida para usuário ${userId}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Subscription removida com sucesso'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao remover subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const subscription = subscriptions.get(userId);

    if (!subscription) {
      return NextResponse.json(
        { subscribed: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        subscribed: true,
        subscription: {
          userId: subscription.userId,
          createdAt: subscription.createdAt,
          isActive: subscription.isActive
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao verificar subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar notificações (pode ser chamada por outros serviços)
export async function sendPushNotification(
  userId: string, 
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }
) {
  const subscription = subscriptions.get(userId);
  
  if (!subscription) {
    throw new Error(`Subscription não encontrada para usuário ${userId}`);
  }

  const notificationPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/notification-icon.png',
    badge: payload.badge || '/icons/badge-icon.png',
    tag: payload.tag || 'general',
    data: payload.data || {},
    actions: payload.actions || [],
    timestamp: Date.now()
  };

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(notificationPayload)
    );
    
    console.log(`Notificação enviada para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao enviar notificação para usuário ${userId}:`, error);
    
    // Se a subscription expirou ou é inválida, remover
    if (error.statusCode === 410 || error.statusCode === 404) {
      subscriptions.delete(userId);
      console.log(`Subscription inválida removida para usuário ${userId}`);
    }
    
    throw error;
  }
}

// Exportar função para uso em outros módulos
export { sendPushNotification as sendNotification, subscriptions };