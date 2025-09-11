import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para verificar token JWT
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  } catch {
    return null;
  }
}

// GET - Listar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar apenas não lidas se solicitado
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }

    // Contar notificações não lidas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('read', false);

    return NextResponse.json({ 
      notifications,
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { userId, title, message, type, data } = await request.json();

    // Validação básica
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title e message são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão para enviar notificações
    // Por enquanto, apenas admins ou o próprio sistema podem criar notificações
    if (user.userType !== 'admin' && userId !== user.userId) {
      return NextResponse.json(
        { error: 'Sem permissão para criar notificações para outros usuários' },
        { status: 403 }
      );
    }

    // Criar notificação
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: type || 'general',
        data: data ? JSON.stringify(data) : null
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
      return NextResponse.json(
        { error: 'Erro ao criar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notificação criada com sucesso',
      notification
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar notificações como lidas
export async function PATCH(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Marcar todas as notificações do usuário como lidas
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.userId)
        .eq('read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return NextResponse.json(
          { error: 'Erro ao marcar notificações como lidas' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Todas as notificações foram marcadas como lidas'
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'IDs das notificações são obrigatórios' },
        { status: 400 }
      );
    }

    // Marcar notificações específicas como lidas
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('user_id', user.userId);

    if (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      return NextResponse.json(
        { error: 'Erro ao marcar notificações como lidas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notificações marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao atualizar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar notificações
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Deletar todas as notificações do usuário
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.userId);

      if (error) {
        console.error('Erro ao deletar todas as notificações:', error);
        return NextResponse.json(
          { error: 'Erro ao deletar notificações' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Todas as notificações foram deletadas'
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
    }

    // Deletar notificação específica
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.userId);

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notificação deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}