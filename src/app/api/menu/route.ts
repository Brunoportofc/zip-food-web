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

// GET - Listar itens do menu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const available = searchParams.get('available');

    let query = supabase
      .from('menu_items')
      .select(`
        *,
        restaurant:restaurants!menu_items_restaurant_id_fkey(name, category)
      `);

    // Filtrar por restaurante se especificado
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    // Filtrar por categoria se especificado
    if (category) {
      query = query.eq('category', category);
    }

    // Filtrar por disponibilidade se especificado
    if (available !== null) {
      query = query.eq('available', available === 'true');
    }

    const { data: menuItems, error } = await query.order('category').order('name');

    if (error) {
      console.error('Erro ao buscar itens do menu:', error);
      return NextResponse.json({ error: 'Erro ao buscar itens do menu' }, { status: 500 });
    }

    return NextResponse.json({ menuItems });

  } catch (error) {
    console.error('Erro na API de menu:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo item do menu
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user || user.userType !== 'restaurant') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { name, description, price, category, image, available = true } = await request.json();

    // Validação básica
    if (!name || !price || price <= 0) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar restaurante do usuário
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    // Criar item do menu
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurant.id,
        name,
        description,
        price,
        category,
        image,
        available
      })
      .select()
      .single();

    if (menuError) {
      console.error('Erro ao criar item do menu:', menuError);
      return NextResponse.json(
        { error: 'Erro ao criar item do menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Item do menu criado com sucesso',
      menuItem
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar item do menu:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar item do menu
export async function PUT(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user || user.userType !== 'restaurant') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id, name, description, price, category, image, available } = await request.json();

    // Validação básica
    if (!id || !name || !price || price <= 0) {
      return NextResponse.json(
        { error: 'ID, nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar restaurante do usuário
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o item pertence ao restaurante
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id')
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Atualizar item do menu
    const { data: menuItem, error: updateError } = await supabase
      .from('menu_items')
      .update({
        name,
        description,
        price,
        category,
        image,
        available,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar item do menu:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar item do menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Item do menu atualizado com sucesso',
      menuItem
    });

  } catch (error) {
    console.error('Erro ao atualizar item do menu:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar item do menu
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user || user.userType !== 'restaurant') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar restaurante do usuário
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o item pertence ao restaurante
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id')
      .eq('id', itemId)
      .eq('restaurant_id', restaurant.id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Deletar item do menu
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Erro ao deletar item do menu:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar item do menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Item do menu deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar item do menu:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}