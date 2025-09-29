import { NextRequest, NextResponse } from 'next/server';
import { stripeConnect } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return errorResponse('Missing required field: restaurantId', 400);
    }

    // Get restaurant data
    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return errorResponse('Restaurant not found', 404);
    }

    const restaurantData = restaurantDoc.data();
    const stripeAccountId = restaurantData?.stripeAccountId;

    if (!stripeAccountId) {
      return errorResponse('Restaurant does not have a Stripe Connect account', 400);
    }

    // Create new account link
    const refreshUrl = `${process.env.NEXTAUTH_URL}/restaurant/stripe/refresh`;
    const returnUrl = `${process.env.NEXTAUTH_URL}/restaurant/stripe/success`;
    
    const accountLink = await stripeConnect.createAccountLink(
      stripeAccountId,
      refreshUrl,
      returnUrl
    );

    return successResponse({
      onboardingUrl: accountLink.url,
      message: 'New onboarding link created successfully',
    });

  } catch (error) {
    console.error('Error creating account link:', error);
    return serverErrorResponse('Failed to create account link');
  }
}