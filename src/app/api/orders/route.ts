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

// GET - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(name, phone, address),
        restaurant:restaurants!orders_restaurant_id_fkey(name, address),
        delivery_driver:delivery_drivers!orders_delivery_driver_id_fkey(
          id,
          vehicle_type,
          user:users!delivery_drivers_user_id_fkey(name, phone)
        )
      `);

    // Filtrar por restaurante se especificado
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    // Filtrar por status se especificado
    if (status) {
      query = query.eq('status', status);
    }

    // Se for restaurante, mostrar apenas seus pedidos
    if (user.userType === 'restaurant') {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.userId)
        .single();
      
      if (restaurant) {
        query = query.eq('restaurant_id', restaurant.id);
      }
    }

    // Se for cliente, mostrar apenas seus pedidos
    if (user.userType === 'customer') {
      query = query.eq('customer_id', user.userId);
    }

    // Se for entregador, mostrar pedidos atribuídos ou disponíveis
    if (user.userType === 'delivery') {
      const { data: driver } = await supabase
        .from('delivery_drivers')
        .select('id')
        .eq('user_id', user.userId)
        .single();
      
      if (driver) {
        query = query.or(`delivery_driver_id.eq.${driver.id},status.eq.confirmed`);
      }
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
    }

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Erro na API de pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { restaurantId, items, deliveryAddress, paymentMethod, notes } = await request.json();

    // Validação básica
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Dados do pedido inválidos' },
        { status: 400 }
      );
    }

    // Calcular total do pedido
    let totalAmount = 0;
    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Itens do pedido inválidos' },
          { status: 400 }
        );
      }

      // Buscar preço do item no menu
      const { data: menuItem } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', item.menuItemId)
        .single();

      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
      }
    }

    // Buscar taxa de entrega do restaurante
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('delivery_fee, minimum_order')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    // Verificar pedido mínimo
    if (totalAmount < restaurant.minimum_order) {
      return NextResponse.json(
        { error: `Pedido mínimo de R$ ${restaurant.minimum_order.toFixed(2)}` },
        { status: 400 }
      );
    }

    totalAmount += restaurant.delivery_fee;

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.userId,
        restaurant_id: restaurantId,
        items: JSON.stringify(items),
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError);
      return NextResponse.json(
        { error: 'Erro ao criar pedido' },
        { status: 500 }
      );
    }

    // Criar notificação para o restaurante
    await supabase
      .from('notifications')
      .insert({
        user_id: restaurantId,
        title: 'Novo Pedido',
        message: `Novo pedido #${order.id} recebido`,
        type: 'order',
        data: JSON.stringify({ orderId: order.id })
      });

    return NextResponse.json({
      message: 'Pedido criado com sucesso',
      order
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}