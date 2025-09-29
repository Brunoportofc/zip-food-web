import { NextRequest, NextResponse } from 'next/server';
import { payoutSystemService } from '@/lib/stripe/payout-system';
import { adminDb } from '@/lib/firebase/admin';
import { verifySessionCookie } from '@/lib/firebase/admin';

// GET - Get restaurant payout history and pending earnings
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Get payout history
    const payoutHistory = await payoutSystemService.getRestaurantPayoutHistory(restaurantId, limit);

    // Get pending earnings
    const pendingEarnings = await payoutSystemService.getRestaurantPendingEarnings(restaurantId);

    // Calculate statistics
    const completedPayouts = payoutHistory.filter(p => p.status === 'completed');
    const totalEarnings = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const lastPayoutDate = completedPayouts.length > 0 ? completedPayouts[0].processedDate : null;

    return NextResponse.json({
      success: true,
      data: {
        payoutHistory: payoutHistory.map(payout => ({
          ...payout,
          // Convert dates to ISO strings for JSON serialization
          scheduledDate: payout.scheduledDate?.toISOString(),
          processedDate: payout.processedDate?.toISOString(),
          createdAt: payout.createdAt?.toISOString(),
          updatedAt: payout.updatedAt?.toISOString(),
        })),
        pendingEarnings,
        statistics: {
          totalEarnings,
          totalPayouts: completedPayouts.length,
          lastPayoutDate: lastPayoutDate?.toISOString(),
          averagePayoutAmount: completedPayouts.length > 0 ? Math.round(totalEarnings / completedPayouts.length) : 0,
        }
      }
    });

  } catch (error) {
    console.error('❌ [Restaurant Payouts GET] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get payout information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Manually trigger payout processing (admin feature)
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

    // Check if user is admin (you can implement this check based on your user roles)
    // For now, we'll allow restaurant owners to trigger their own payouts
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

    // Trigger payout processing
    await payoutSystemService.processScheduledPayouts();

    console.log(`✅ [Restaurant Payouts POST] Processamento de repasses acionado manualmente por ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Payout processing triggered successfully'
    });

  } catch (error) {
    console.error('❌ [Restaurant Payouts POST] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger payout processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
