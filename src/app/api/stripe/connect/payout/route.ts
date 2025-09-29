import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'brl' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
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

    // Check if account can receive payouts
    const account = await stripe.accounts.retrieve(restaurant.stripeAccountId);
    if (!account.payouts_enabled) {
      return NextResponse.json({ 
        error: 'Account not enabled for payouts' 
      }, { status: 400 });
    }

    // Create payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      method: 'instant', // or 'standard'
    }, {
      stripeAccount: restaurant.stripeAccountId,
    });

    // Log payout in database
    await adminDb.collection('payouts').add({
      restaurantId,
      stripePayoutId: payout.id,
      amount,
      currency,
      status: payout.status,
      method: payout.method,
      arrivalDate: new Date(payout.arrival_date * 1000),
      createdAt: new Date(),
    });

    // Create notification
    await adminDb.collection('notifications').add({
      type: 'payout.created',
      recipientId: restaurantId,
      recipientType: 'restaurant',
      title: 'Saque Solicitado',
      message: `Saque de R$ ${amount.toFixed(2)} foi solicitado`,
      data: {
        payoutId: payout.id,
        amount,
        currency,
        method: payout.method,
      },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount,
        currency,
        status: payout.status,
        method: payout.method,
        arrivalDate: payout.arrival_date,
      },
    });

  } catch (error: any) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 500 }
    );
  }
}

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

    // Get payouts from Stripe
    const payouts = await stripe.payouts.list({
      limit: 20,
    }, {
      stripeAccount: restaurant.stripeAccountId,
    });

    // Get payout history from database
    const payoutHistory = await adminDb
      .collection('payouts')
      .where('restaurantId', '==', restaurantId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const payoutData = payoutHistory.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      arrivalDate: doc.data().arrivalDate?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      payouts: payouts.data,
      payoutHistory: payoutData,
    });

  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}