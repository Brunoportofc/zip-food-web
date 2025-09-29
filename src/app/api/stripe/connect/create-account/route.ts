import { NextRequest, NextResponse } from 'next/server';
import { stripeConnect } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, email, businessName, country = 'BR', type = 'express' } = body;

    if (!restaurantId || !email || !businessName) {
      return errorResponse('Missing required fields: restaurantId, email, businessName', 400);
    }

    // Check if restaurant already has a Stripe account
    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return errorResponse('Restaurant not found', 404);
    }

    const restaurantData = restaurantDoc.data();
    if (restaurantData?.stripeAccountId) {
      return errorResponse('Restaurant already has a Stripe Connect account', 400);
    }

    // Create Stripe Connect account
    const account = await stripeConnect.createConnectAccount({
      email,
      businessName,
      country,
      type,
    });

    // Save Stripe account ID to restaurant document
    await adminDb.collection('restaurants').doc(restaurantId).update({
      stripeAccountId: account.id,
      stripeAccountStatus: 'created',
      updatedAt: new Date(),
    });

    // Create account link for onboarding
    const refreshUrl = `${process.env.NEXTAUTH_URL}/restaurant/stripe/refresh`;
    const returnUrl = `${process.env.NEXTAUTH_URL}/restaurant/stripe/success`;
    
    const accountLink = await stripeConnect.createAccountLink(
      account.id,
      refreshUrl,
      returnUrl
    );

    return successResponse({
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Stripe Connect account created successfully',
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return serverErrorResponse('Failed to create Stripe Connect account');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return errorResponse('Missing restaurantId parameter', 400);
    }

    // Get restaurant data
    const restaurantDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return errorResponse('Restaurant not found', 404);
    }

    const restaurantData = restaurantDoc.data();
    const stripeAccountId = restaurantData?.stripeAccountId;

    if (!stripeAccountId) {
      return successResponse({
        hasAccount: false,
        message: 'No Stripe Connect account found',
      });
    }

    // Get account status from Stripe
    const accountStatus = await stripeConnect.getAccountStatus(stripeAccountId);

    // Update restaurant document with current status
    await adminDb.collection('restaurants').doc(restaurantId).update({
      stripeAccountStatus: {
        charges_enabled: accountStatus.charges_enabled,
        payouts_enabled: accountStatus.payouts_enabled,
        details_submitted: accountStatus.details_submitted,
        requirements: accountStatus.requirements,
      },
      updatedAt: new Date(),
    });

    return successResponse({
      hasAccount: true,
      accountId: stripeAccountId,
      status: accountStatus,
    });

  } catch (error) {
    console.error('Error getting Stripe Connect account status:', error);
    return serverErrorResponse('Failed to get account status');
  }
}