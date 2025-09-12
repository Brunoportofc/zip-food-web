import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';

// Interface para criação de pedido
interface CreateOrderRequest {
  restaurantId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: 'credit-card' | 'debit-card' | 'pix' | 'cash';
  notes?: string;
}

// GET - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || !userType) {
      return unauthorizedResponse('Informações de usuário não encontradas');
    }

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        customer:customers(*),
        delivery_driver:delivery_drivers(*),
        order_items(*)
      `);

    // Filtrar pedidos baseado no tipo de usuário
    switch (userType) {
      case 'customer':
        query = query.eq('customer_id', userId);
        break;
      case 'restaurant':
        query = query.eq('restaurant_id', userId);
        break;
      case 'delivery':
        query = query.eq('delivery_driver_id', userId);
        break;
      default:
        return errorResponse('Tipo de usuário inválido');
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });

    const { data: orders, error } = await query;

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return serverErrorResponse('Erro ao buscar pedidos');
    }

    return successResponse(orders, 'Pedidos listados com sucesso');
  } catch (error) {
    console.error('Erro interno ao listar pedidos:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== 'customer') {
      return unauthorizedResponse('Apenas clientes podem criar pedidos');
    }

    const body: CreateOrderRequest = await request.json();

    // Validar dados obrigatórios
    if (!body.restaurantId || !body.items || body.items.length === 0) {
      return errorResponse('Dados obrigatórios não fornecidos');
    }

    // Calcular totais
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.00; // Valor fixo por enquanto
    const total = subtotal + deliveryFee;

    // Iniciar transação
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: userId,
        restaurant_id: body.restaurantId,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: body.deliveryAddress,
        payment_method: body.paymentMethod,
        notes: body.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError);
      return serverErrorResponse('Erro ao criar pedido');
    }

    // Inserir itens do pedido
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Erro ao inserir itens do pedido:', itemsError);
      // Reverter criação do pedido
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return serverErrorResponse('Erro ao processar itens do pedido');
    }

    // Buscar pedido completo com relacionamentos
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        customer:customers(*),
        order_items(*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar pedido completo:', fetchError);
      return successResponse(order, 'Pedido criado com sucesso');
    }

    return successResponse(completeOrder, 'Pedido criado com sucesso', 201);
  } catch (error) {
    console.error('Erro interno ao criar pedido:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}