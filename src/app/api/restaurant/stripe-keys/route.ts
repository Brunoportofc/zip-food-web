import { NextRequest, NextResponse } from 'next/server';
import { restaurantStripeService } from '@/lib/stripe/restaurant-stripe';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

interface StripeKeysRequest {
  publishableKey: string;
  secretKey: string;
}

// GET - Get restaurant Stripe keys info
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

    // Get user's restaurant ID
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

    // Get Stripe keys info
    const stripeKeys = await restaurantStripeService.getRestaurantStripeKeys(restaurantId);

    return NextResponse.json({
      success: true,
      hasStripeKeys: !!stripeKeys,
      stripeKeys: stripeKeys ? {
        isActive: stripeKeys.isActive,
        isVerified: stripeKeys.isVerified,
        accountId: stripeKeys.accountId,
        publishableKey: stripeKeys.stripePublishableKey,
        lastVerifiedAt: stripeKeys.lastVerifiedAt,
        createdAt: stripeKeys.createdAt,
      } : null
    });

  } catch (error) {
    console.error('❌ [Stripe Keys GET] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get Stripe keys information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Save/Update restaurant Stripe keys
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

    // Get user's restaurant ID
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

    const body: StripeKeysRequest = await request.json();
    const { publishableKey, secretKey } = body;

    // Validate required fields
    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { error: 'Missing required fields: publishableKey, secretKey' },
        { status: 400 }
      );
    }

    // Validate and save keys
    const result = await restaurantStripeService.saveStripeKeys(
      restaurantId,
      publishableKey,
      secretKey
    );

    if (result.success) {
      console.log(`✅ [Stripe Keys POST] Chaves salvas para restaurante ${restaurantId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Chaves Stripe salvas e verificadas com sucesso!'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [Stripe Keys POST] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save Stripe keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove restaurant Stripe keys
export async function DELETE(request: NextRequest) {
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

    // Get user's restaurant ID
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

    // Delete keys
    const success = await restaurantStripeService.deleteStripeKeys(restaurantId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Chaves Stripe removidas com sucesso!'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete Stripe keys' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [Stripe Keys DELETE] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete Stripe keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
