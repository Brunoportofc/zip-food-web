import { NextRequest, NextResponse } from 'next/server';
import { stripeConnectService } from '@/lib/stripe/connect';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
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

    // Check if restaurant can access dashboard
    const canReceivePayments = await stripeConnectService.canReceivePayments(restaurantId);
    
    if (!canReceivePayments) {
      return NextResponse.json(
        { error: 'Stripe account setup not complete' },
        { status: 400 }
      );
    }

    // Create login link for Stripe Express Dashboard
    const loginUrl = await stripeConnectService.createLoginLink(restaurantId);

    return NextResponse.json({
      success: true,
      loginUrl,
      message: 'Dashboard login link created successfully'
    });

  } catch (error) {
    console.error('Error creating dashboard login link:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create dashboard login link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}