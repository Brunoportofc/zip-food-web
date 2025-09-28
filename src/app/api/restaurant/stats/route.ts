// src/app/api/restaurant/stats/route.ts
// API para obter estatísticas do restaurante

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const restaurantSnapshot = await restaurantQuery.get();
    
    if (restaurantSnapshot.empty) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantId = restaurantSnapshot.docs[0].id;
    const restaurantData = restaurantSnapshot.docs[0].data();

    console.log('📊 [Stats] Calculando estatísticas para restaurante:', restaurantId);

    // Buscar pedidos do restaurante
    const ordersQuery = adminDb.collection('orders')
      .where('restaurant_id', '==', restaurantId)
      .orderBy('created_at', 'desc')
      .limit(1000); // Limite para performance

    const ordersSnapshot = await ordersQuery.get();
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(doc.data().created_at),
      updated_at: doc.data().updated_at?.toDate?.() || new Date(doc.data().updated_at)
    }));

    // Calcular estatísticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Pedidos de hoje
    const todayOrders = orders.filter((order: any) => 
      order.created_at >= today
    );

    // Pedidos de ontem
    const yesterdayOrders = orders.filter((order: any) => 
      order.created_at >= yesterday && order.created_at < today
    );

    // Faturamento
    const todayRevenue = todayOrders.reduce((sum: number, order: any) => 
      sum + (order.total || 0), 0
    );
    
    const yesterdayRevenue = yesterdayOrders.reduce((sum: number, order: any) => 
      sum + (order.total || 0), 0
    );

    // Entregas ativas
    const activeDeliveries = orders.filter((order: any) => 
      ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
    ).length;

    // Tempo médio de entrega (baseado em pedidos entregues)
    const deliveredOrders = orders.filter((order: any) => order.status === 'delivered');
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum: number, order: any) => {
          const delivered = order.updated_at || order.created_at;
          const timeDiff = (delivered.getTime() - order.created_at.getTime()) / (1000 * 60);
          return sum + timeDiff;
        }, 0) / deliveredOrders.length
      : parseInt(restaurantData.estimated_delivery_time?.split('-')[0] || '30');

    // Clientes únicos
    const uniqueCustomers = new Set(orders.map((order: any) => order.customer_id)).size;

    // Taxa de conversão (pedidos hoje vs total de visualizações - simplificado)
    const conversionRate = orders.length > 0 
      ? Math.min((todayOrders.length / Math.max(orders.length, 1)) * 100, 100)
      : 0;

    // Horário de pico (baseado nos pedidos)
    const hourCounts: { [key: number]: number } = {};
    orders.forEach((order: any) => {
      const hour = order.created_at.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const peakHours = peakHour 
      ? `${peakHour[0].padStart(2, '0')}:00 - ${(parseInt(peakHour[0]) + 1).toString().padStart(2, '0')}:00`
      : 'N/A';

    // Calcular variações percentuais
    const orderVariation = yesterdayOrders.length > 0 
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : 0;

    const revenueVariation = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    const stats = {
      todayOrders: todayOrders.length,
      todayRevenue: todayRevenue,
      averageDeliveryTime: Math.round(avgDeliveryTime),
      activeDeliveries: activeDeliveries,
      customerRating: restaurantData.rating || 0,
      totalCustomers: uniqueCustomers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      peakHours: peakHours,
      // Variações em relação ao dia anterior
      orderVariation: Math.round(orderVariation * 100) / 100,
      revenueVariation: Math.round(revenueVariation * 100) / 100,
      // Pedidos recentes (últimos 10)
      recentOrders: orders.slice(0, 10).map((order: any) => ({
        id: order.id,
        customer: {
          name: order.customer_name || 'Cliente',
          phone: order.customer_phone || 'N/A'
        },
        items: order.items || [],
        total: order.total || 0,
        status: order.status || 'pending',
        createdAt: order.created_at,
        estimatedDeliveryTime: order.estimated_delivery_time 
          ? new Date(order.estimated_delivery_time)
          : undefined
      }))
    };

    console.log('✅ [Stats] Estatísticas calculadas:', {
      restaurantId,
      todayOrders: stats.todayOrders,
      todayRevenue: stats.todayRevenue,
      totalOrders: orders.length
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [Stats] Erro ao calcular estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
