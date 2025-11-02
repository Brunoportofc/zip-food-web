import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, subscriptions } from '@/lib/notifications';

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
      await sendNotification(userId, {
        title: '🎉 Bem-vindo ao ZipFood!',
        body: 'Você receberá notificações sobre seus pedidos aqui.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'welcome',
        data: { type: 'welcome', userId }
      });
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

