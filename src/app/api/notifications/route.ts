import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

// Interface para criação de notificação
interface CreateNotificationRequest {
  userId?: string; // Opcional, pode ser inferido do middleware
  orderId?: string;
  type: string;
  title: string;
  message: string;
}

// Interface para atualização de notificação
interface UpdateNotificationRequest {
  isRead?: boolean;
}

// GET - Listar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let notifications: any[] = [];
    let unreadCount = 0;
    
    try {
      let notificationsQuery = adminDb.collection('notifications')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc');

      // Filtrar apenas não lidas se solicitado
      if (unreadOnly) {
        notificationsQuery = notificationsQuery.where('is_read', '==', false);
      }

      // Aplicar paginação
      notificationsQuery = notificationsQuery.offset(offset).limit(limit);

      const notificationsSnapshot = await notificationsQuery.get();
      notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Contar total de notificações não lidas
      const unreadQuery = adminDb.collection('notifications')
        .where('user_id', '==', userId)
        .where('is_read', '==', false);
      
      const unreadSnapshot = await unreadQuery.get();
      unreadCount = unreadSnapshot.size;
    } catch (firestoreError) {
      console.error('Erro ao buscar notificações no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao buscar notificações');
    }

    return successResponse({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      hasMore: notifications && notifications.length === limit
    }, 'Notificações listadas com sucesso');

  } catch (error) {
    console.error('Erro interno ao listar notificações:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const currentUserId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!currentUserId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    const body: CreateNotificationRequest = await request.json();

    // Validar dados obrigatórios
    if (!body.type || !body.title || !body.message) {
      return errorResponse('Tipo, título e mensagem são obrigatórios');
    }

    // Determinar o usuário de destino
    const targetUserId = body.userId || currentUserId;

    // Verificar se o usuário tem permissão para criar notificação para outro usuário
    if (body.userId && body.userId !== currentUserId) {
      // Apenas o sistema ou administradores podem criar notificações para outros usuários
      // Por enquanto, permitir apenas para o próprio usuário
      return unauthorizedResponse('Não é possível criar notificação para outro usuário');
    }

    try {
      // Criar notificação
      const notificationData = {
        user_id: targetUserId,
        order_id: body.orderId,
        type: body.type,
        title: body.title,
        message: body.message,
        is_read: false,
        created_at: new Date()
      };

      const docRef = await adminDb.collection('notifications').add(notificationData);
      const newNotification = await docRef.get();
      const notification = { id: newNotification.id, ...newNotification.data() };

      return successResponse(notification, 'Notificação criada com sucesso', 201);
    } catch (firestoreError) {
      console.error('Erro ao criar notificação no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao criar notificação');
    }

  } catch (error) {
    console.error('Erro interno ao criar notificação:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// PATCH - Atualizar notificação (marcar como lida/não lida)
export async function PATCH(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const markAllAsRead = searchParams.get('markAllAsRead') === 'true';

    const body: UpdateNotificationRequest = await request.json();

    try {
      if (markAllAsRead) {
        // Marcar todas as notificações como lidas
        const unreadQuery = adminDb.collection('notifications')
          .where('user_id', '==', userId)
          .where('is_read', '==', false);
        
        const unreadSnapshot = await unreadQuery.get();
        const batch = adminDb.batch();
        
        unreadSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { is_read: true });
        });
        
        await batch.commit();
        return successResponse(null, 'Todas as notificações foram marcadas como lidas');
      }

      if (!notificationId) {
        return errorResponse('ID da notificação é obrigatório');
      }

      // Verificar se a notificação pertence ao usuário
      const notificationRef = adminDb.collection('notifications').doc(notificationId);
      const notificationDoc = await notificationRef.get();

      if (!notificationDoc.exists) {
        return notFoundResponse('Notificação não encontrada');
      }

      const notificationData = notificationDoc.data();
      if (notificationData?.user_id !== userId) {
        return notFoundResponse('Notificação não encontrada');
      }

      // Atualizar notificação
      const updateData: any = {};
      if (body.isRead !== undefined) {
        updateData.is_read = body.isRead;
      }

      await notificationRef.update(updateData);
      
      // Buscar dados atualizados
      const updatedDoc = await notificationRef.get();
      const updatedNotification = { id: updatedDoc.id, ...updatedDoc.data() };

      return successResponse(updatedNotification, 'Notificação atualizada com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao atualizar notificação no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao atualizar notificação');
    }

  } catch (error) {
    console.error('Erro interno ao atualizar notificação:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// DELETE - Remover notificação
export async function DELETE(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return unauthorizedResponse('Usuário não autenticado');
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    try {
      if (deleteAll) {
        // Deletar todas as notificações lidas do usuário
        const readQuery = adminDb.collection('notifications')
          .where('user_id', '==', userId)
          .where('is_read', '==', true);
        
        const readSnapshot = await readQuery.get();
        const batch = adminDb.batch();
        
        readSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        return successResponse(null, 'Todas as notificações lidas foram removidas');
      }

      if (!notificationId) {
        return errorResponse('ID da notificação é obrigatório');
      }

      // Verificar se a notificação pertence ao usuário
      const notificationRef = adminDb.collection('notifications').doc(notificationId);
      const notificationDoc = await notificationRef.get();

      if (!notificationDoc.exists) {
        return notFoundResponse('Notificação não encontrada');
      }

      const notificationData = notificationDoc.data();
      if (notificationData?.user_id !== userId) {
        return notFoundResponse('Notificação não encontrada');
      }

      // Deletar notificação
      await notificationRef.delete();

      return successResponse(null, 'Notificação removida com sucesso');
    } catch (firestoreError) {
      console.error('Erro ao deletar notificação no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao deletar notificação');
    }

  } catch (error) {
    console.error('Erro interno ao deletar notificação:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}