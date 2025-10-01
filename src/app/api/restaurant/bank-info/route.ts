import { NextRequest, NextResponse } from 'next/server';
import { payoutSystemService } from '@/lib/stripe/payout-system';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

interface BankInfoRequest {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}

// GET - Get restaurant bank information
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

    const decodedToken = await verifySessionCookie();
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

    // Get bank information
    const bankInfo = await payoutSystemService.getRestaurantBankInfo(restaurantId);

    if (!bankInfo) {
      return NextResponse.json({
        success: true,
        bankInfo: null,
        message: 'No bank information found'
      });
    }

    // Return bank info (mask sensitive data)
    return NextResponse.json({
      success: true,
      bankInfo: {
        id: bankInfo.id,
        restaurantId: bankInfo.restaurantId,
        bankName: bankInfo.bankName,
        accountNumber: `***${bankInfo.accountNumber.slice(-4)}`, // Masked
        routingNumber: bankInfo.routingNumber,
        accountHolderName: bankInfo.accountHolderName,
        isActive: bankInfo.isActive,
        verifiedAt: bankInfo.verifiedAt,
        createdAt: bankInfo.createdAt,
      }
    });

  } catch (error) {
    console.error('❌ [Bank Info GET] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get bank information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Save/Update restaurant bank information
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

    const decodedToken = await verifySessionCookie();
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

    const body: BankInfoRequest = await request.json();
    const { bankName, accountNumber, routingNumber, accountHolderName } = body;

    // Validate required fields
    if (!bankName || !accountNumber || !routingNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Missing required fields: bankName, accountNumber, routingNumber, accountHolderName' },
        { status: 400 }
      );
    }

    // Validate account number (basic validation)
    if (accountNumber.length < 5 || accountNumber.length > 20) {
      return NextResponse.json(
        { error: 'Account number must be between 5 and 20 characters' },
        { status: 400 }
      );
    }

    // Validate routing number (basic validation for Israeli banks)
    if (routingNumber.length !== 3) {
      return NextResponse.json(
        { error: 'Routing number must be 3 digits for Israeli banks' },
        { status: 400 }
      );
    }

    // Save bank information
    const bankInfoId = await payoutSystemService.saveRestaurantBankInfo({
      restaurantId,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      isActive: true,
    });

    console.log(`✅ [Bank Info POST] Informações bancárias salvas para restaurante ${restaurantId}`);

    return NextResponse.json({
      success: true,
      bankInfoId,
      message: 'Bank information saved successfully'
    });

  } catch (error) {
    console.error('❌ [Bank Info POST] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save bank information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
