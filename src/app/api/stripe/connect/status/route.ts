import { NextRequest, NextResponse } from 'next/server';
import { stripeConnectService } from '@/lib/stripe/connect';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decodedToken = await verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Get restaurant data
    const restaurantSnapshot = await adminDb
      .collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1)
      .get();

    if (restaurantSnapshot.empty) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const restaurantId = restaurantSnapshot.docs[0].id;

    // Get Stripe account information
    const account = await stripeConnectService.getRestaurantAccount(restaurantId);
    
    if (!account) {
      return NextResponse.json({
        hasAccount: false,
        message: 'No Stripe account found'
      });
    }

    // Get account balance if account is active
    let balance = null;
    if (account.chargesEnabled) {
      balance = await stripeConnectService.getAccountBalance(restaurantId);
    }

    return NextResponse.json({
      hasAccount: true,
      account: {
        id: account.stripeAccountId,
        status: account.accountStatus,
        onboardingComplete: account.onboardingComplete,
        payoutsEnabled: account.payoutsEnabled,
        chargesEnabled: account.chargesEnabled,
        detailsSubmitted: account.detailsSubmitted,
        canReceivePayments: await stripeConnectService.canReceivePayments(restaurantId),
      },
      balance: balance ? {
        available: balance.available,
        pending: balance.pending,
      } : null,
    });

  } catch (error) {
    console.error('Error getting Stripe Connect status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get Stripe Connect status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}