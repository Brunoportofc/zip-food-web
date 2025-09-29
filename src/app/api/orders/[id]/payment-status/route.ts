import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order data
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Check if user has access to this order
    const isCustomer = orderData?.customerId === session.user.id;
    const isRestaurantOwner = await checkRestaurantOwnership(session.user.id, orderData?.restaurantId);

    if (!isCustomer && !isRestaurantOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Extract payment information
    const paymentInfo = {
      status: orderData?.paymentStatus || 'pending',
      paymentIntentId: orderData?.paymentIntentId,
      amount: orderData?.total || 0,
      currency: 'brl',
      paymentMethod: orderData?.paymentMethod,
      createdAt: orderData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: orderData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      failureReason: orderData?.paymentFailureReason,
    };

    return NextResponse.json({
      success: true,
      payment: paymentInfo,
      order: {
        id: orderId,
        status: orderData?.status,
        restaurantId: orderData?.restaurantId,
        customerId: orderData?.customerId,
      },
    });

  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}

async function checkRestaurantOwnership(userId: string, restaurantId: string): Promise<boolean> {
  try {
    if (!restaurantId) return false;

    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    
    if (!restaurantDoc.exists) return false;

    const restaurantData = restaurantDoc.data();
    return restaurantData?.ownerId === userId;
  } catch (error) {
    console.error('Error checking restaurant ownership:', error);
    return false;
  }
}