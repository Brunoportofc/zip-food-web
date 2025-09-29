import { NextRequest, NextResponse } from 'next/server';
import { stripeConnectService } from '@/lib/stripe/connect';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Stripe Connect Create] Iniciando criação de conta Stripe');
    
    // Verify authentication
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('❌ [Stripe Connect Create] Session cookie não encontrado');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 [Stripe Connect Create] Verificando session cookie');
    const decodedToken = await verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;
    console.log('✅ [Stripe Connect Create] Token verificado para usuário:', userId);

    // Check if adminDb is available
    if (!adminDb) {
      console.error('❌ [Stripe Connect Create] Firebase Admin DB não está inicializado');
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    console.log('🔍 [Stripe Connect Create] Buscando dados do restaurante');
    // Get restaurant data
    const restaurantSnapshot = await adminDb
      .collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1)
      .get();

    if (restaurantSnapshot.empty) {
      console.log('❌ [Stripe Connect Create] Restaurante não encontrado para usuário:', userId);
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const restaurantDoc = restaurantSnapshot.docs[0];
    const restaurantData = restaurantDoc.data();
    const restaurantId = restaurantDoc.id;
    console.log('✅ [Stripe Connect Create] Restaurante encontrado:', restaurantId);

    console.log('🔍 [Stripe Connect Create] Verificando conta Stripe existente');
    // Check if Stripe account already exists
    const existingAccount = await stripeConnectService.getRestaurantAccount(restaurantId);
    
    if (existingAccount) {
      console.log('✅ [Stripe Connect Create] Conta Stripe existente encontrada:', existingAccount.stripeAccountId);
      
      if (!existingAccount.isActive) {
        console.log('🔍 [Stripe Connect Create] Criando link de onboarding para conta existente');
        const onboardingUrl = await stripeConnectService.createOnboardingLink(existingAccount.stripeAccountId);
        
        return NextResponse.json({
          success: true,
          accountId: existingAccount.stripeAccountId,
          onboardingUrl,
          message: 'Stripe account exists but needs onboarding'
        });
      }
      
      console.log('✅ [Stripe Connect Create] Conta Stripe já está ativa');
      return NextResponse.json({
        success: true,
        accountId: existingAccount.stripeAccountId,
        message: 'Stripe account already exists and is active'
      });
    }

    console.log('🔍 [Stripe Connect Create] Preparando dados para criação de nova conta');
    // Prepare restaurant data for Stripe account creation
    const stripeAccountData = {
      name: restaurantData.name,
      email: restaurantData.email,
      phone: restaurantData.phone,
      address: {
        street: restaurantData.address,
        city: restaurantData.city,
        state: 'SP', // Default to São Paulo, should be configurable
        zipCode: '01000-000', // Default, should be from restaurant data
      },
    };

    console.log('🔍 [Stripe Connect Create] Criando conta Stripe Connect');
    // Create Stripe Connect account
    const { accountId, onboardingUrl } = await stripeConnectService.createConnectAccount(
      restaurantId,
      stripeAccountData
    );

    console.log('✅ [Stripe Connect Create] Conta Stripe criada com sucesso:', accountId);
    return NextResponse.json({
      success: true,
      accountId,
      onboardingUrl,
      message: 'Stripe Connect account created successfully'
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create Stripe Connect account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}