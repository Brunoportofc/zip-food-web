import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
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

    let orders: any[] = [];
    
    try {
      let ordersQuery: any = adminDb.collection('orders');

      // Filtrar pedidos baseado no tipo de usuário
      switch (userType) {
        case 'customer':
          ordersQuery = ordersQuery.where('customer_id', '==', userId);
          break;
        case 'restaurant':
          // Para restaurantes, buscar pelo owner_id no restaurante
          const restaurantQuery = await adminDb.collection('restaurants')
            .where('owner_id', '==', userId)
            .get();
          
          if (!restaurantQuery.empty) {
            const restaurantId = restaurantQuery.docs[0].id;
            ordersQuery = ordersQuery.where('restaurant_id', '==', restaurantId);
          } else {
            // Se não encontrar restaurante, retornar lista vazia
            return successResponse([], 'Nenhum pedido encontrado');
          }
          break;
        case 'delivery':
          ordersQuery = ordersQuery.where('delivery_driver_id', '==', userId);
          break;
        default:
          return errorResponse('Tipo de usuário inválido');
      }

      // Ordenar por data de criação (mais recentes primeiro)
      ordersQuery = ordersQuery.orderBy('created_at', 'desc');

      const ordersSnapshot = await ordersQuery.get();

      for (const doc of ordersSnapshot.docs) {
        const orderData = { id: doc.id, ...doc.data() };
        
        // Buscar dados relacionados
        if (orderData.restaurant_id) {
          const restaurantDoc = await adminDb.collection('restaurants').doc(orderData.restaurant_id).get();
          if (restaurantDoc.exists) {
            orderData.restaurant = { id: restaurantDoc.id, ...restaurantDoc.data() };
          }
        }

        if (orderData.customer_id) {
          const customerDoc = await adminDb.collection('users').doc(orderData.customer_id).get();
          if (customerDoc.exists) {
            orderData.customer = { id: customerDoc.id, ...customerDoc.data() };
          }
        }

        if (orderData.delivery_driver_id) {
          const driverDoc = await adminDb.collection('delivery_drivers').doc(orderData.delivery_driver_id).get();
          if (driverDoc.exists) {
            orderData.delivery_driver = { id: driverDoc.id, ...driverDoc.data() };
          }
        }

        // Buscar itens do pedido
        const itemsSnapshot = await adminDb.collection('order_items')
          .where('order_id', '==', doc.id)
          .get();
        
        orderData.order_items = itemsSnapshot.docs.map(itemDoc => ({
          id: itemDoc.id,
          ...itemDoc.data()
        }));

        orders.push(orderData);
      }
    } catch (firestoreError) {
      console.error('Erro ao buscar pedidos no Firestore:', firestoreError);
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

    try {
      // Criar pedido no Firestore
      const orderData = {
        customer_id: userId,
        restaurant_id: body.restaurantId,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: body.deliveryAddress,
        payment_method: body.paymentMethod,
        notes: body.notes,
        created_at: new Date(),
        updated_at: new Date()
      };

      const orderRef = await adminDb.collection('orders').add(orderData);
      const orderDoc = await orderRef.get();
      const order = { id: orderDoc.id, ...orderDoc.data() } as any;

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

      // Adicionar itens do pedido
      const itemPromises = orderItems.map(item => 
        adminDb.collection('order_items').add(item)
      );

      await Promise.all(itemPromises);

      // Buscar dados relacionados para resposta completa
      let completeOrder = { ...order };

      // Buscar dados do restaurante
      if (order.restaurant_id) {
        const restaurantDoc = await adminDb.collection('restaurants').doc(order.restaurant_id).get();
        if (restaurantDoc.exists) {
          completeOrder.restaurant = { id: restaurantDoc.id, ...restaurantDoc.data() };
        }
      }

      // Buscar dados do cliente
      if (order.customer_id) {
        const customerDoc = await adminDb.collection('users').doc(order.customer_id).get();
        if (customerDoc.exists) {
          completeOrder.customer = { id: customerDoc.id, ...customerDoc.data() };
        }
      }

      // Buscar itens do pedido
      const itemsSnapshot = await adminDb.collection('order_items')
        .where('order_id', '==', order.id)
        .get();
      
      completeOrder.order_items = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data()
      }));

      // Criar notificação para o restaurante
      try {
        const itemsText = body.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
        
        await adminDb.collection('notifications').add({
          title: '🛒 Novo Pedido Recebido',
          message: `Pedido #${order.id} - ${itemsText} (R$ ${total.toFixed(2)})`,
          type: 'order',
          priority: 'high',
          timestamp: new Date(),
          read: false,
          restaurantId: body.restaurantId,
          orderId: order.id,
          action: {
            label: 'Ver Pedido',
            url: `/restaurant/pedidos?id=${order.id}`
          },
          metadata: {
            customerName: 'Cliente',
            total,
            itemCount: body.items.length,
            paymentMethod: body.paymentMethod
          }
        });
        
        console.log('✅ [Orders API] Notificação de novo pedido criada');
      } catch (notificationError) {
        console.error('❌ [Orders API] Erro ao criar notificação:', notificationError);
        // Não falhar o pedido se a notificação falhar
      }

      return successResponse(completeOrder, 'Pedido criado com sucesso', 201);
    } catch (firestoreError) {
      console.error('Erro ao criar pedido no Firestore:', firestoreError);
      return serverErrorResponse('Erro ao criar pedido');
    }
  } catch (error) {
    console.error('Erro interno ao criar pedido:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}