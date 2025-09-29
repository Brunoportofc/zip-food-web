import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get restaurant data
    const restaurantDoc = await adminDb
      .collection('restaurants')
      .where('ownerId', '==', session.user.id)
      .limit(1)
      .get();

    if (restaurantDoc.empty) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const restaurant = restaurantDoc.docs[0].data();
    const restaurantId = restaurantDoc.docs[0].id;

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account not configured' 
      }, { status: 400 });
    }

    // Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: restaurant.stripeAccountId,
    });

    // Get recent transactions
    const transactions = await stripe.balanceTransactions.list({
      limit: 10,
    }, {
      stripeAccount: restaurant.stripeAccountId,
    });

    // Calculate totals
    const availableBalance = balance.available.reduce((total, item) => {
      if (item.currency === 'brl') {
        return total + item.amount;
      }
      return total;
    }, 0);

    const pendingBalance = balance.pending.reduce((total, item) => {
      if (item.currency === 'brl') {
        return total + item.amount;
      }
      return total;
    }, 0);

    // Get recent orders for additional context
    const recentOrders = await adminDb
      .collection('orders')
      .where('restaurantId', '==', restaurantId)
      .where('paymentStatus', '==', 'paid')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const orderData = recentOrders.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      balance: {
        available: availableBalance / 100, // Convert from cents
        pending: pendingBalance / 100,
        currency: 'brl',
      },
      transactions: transactions.data.map(tx => ({
        id: tx.id,
        amount: tx.amount / 100,
        currency: tx.currency,
        description: tx.description,
        fee: tx.fee / 100,
        net: tx.net / 100,
        status: tx.status,
        type: tx.type,
        created: new Date(tx.created * 1000).toISOString(),
      })),
      recentOrders: orderData,
    });

  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}