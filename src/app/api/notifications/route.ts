import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
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

    let query = supabaseAdmin
      .from('notifications')
      .select(`
        id,
        order_id,
        type,
        title,
        message,
        is_read,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar apenas não lidas se solicitado
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return serverErrorResponse('Erro ao buscar notificações');
    }

    // Contar total de notificações não lidas
    const { count: unreadCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (countError) {
      console.error('Erro ao contar notificações não lidas:', countError);
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

    // Criar notificação
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: targetUserId,
        order_id: body.orderId,
        type: body.type,
        title: body.title,
        message: body.message,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return serverErrorResponse('Erro ao criar notificação');
    }

    return successResponse(notification, 'Notificação criada com sucesso', 201);

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

    if (markAllAsRead) {
      // Marcar todas as notificações como lidas
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return serverErrorResponse('Erro ao atualizar notificações');
      }

      return successResponse(null, 'Todas as notificações foram marcadas como lidas');
    }

    if (!notificationId) {
      return errorResponse('ID da notificação é obrigatório');
    }

    // Verificar se a notificação pertence ao usuário
    const { data: existingNotification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNotification) {
      return notFoundResponse('Notificação não encontrada');
    }

    // Atualizar notificação
    const updateData: any = {};
    if (body.isRead !== undefined) {
      updateData.is_read = body.isRead;
    }

    const { data: updatedNotification, error } = await supabaseAdmin
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar notificação:', error);
      return serverErrorResponse('Erro ao atualizar notificação');
    }

    return successResponse(updatedNotification, 'Notificação atualizada com sucesso');

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

    if (deleteAll) {
      // Deletar todas as notificações lidas do usuário
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) {
        console.error('Erro ao deletar todas as notificações:', error);
        return serverErrorResponse('Erro ao deletar notificações');
      }

      return successResponse(null, 'Todas as notificações lidas foram removidas');
    }

    if (!notificationId) {
      return errorResponse('ID da notificação é obrigatório');
    }

    // Verificar se a notificação pertence ao usuário
    const { data: existingNotification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNotification) {
      return notFoundResponse('Notificação não encontrada');
    }

    // Deletar notificação
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      return serverErrorResponse('Erro ao deletar notificação');
    }

    return successResponse(null, 'Notificação removida com sucesso');

  } catch (error) {
    console.error('Erro interno ao deletar notificação:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}