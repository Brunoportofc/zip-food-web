import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { 
  configurePayoutSchedule, 
  getPayoutSettings, 
  PayoutSchedule,
  getEstimatedPayoutDate 
} from '@/lib/stripe/payouts';

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

    const restaurantId = restaurantDoc.docs[0].id;
    const restaurant = restaurantDoc.docs[0].data();

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account not configured' 
      }, { status: 400 });
    }

    // Get current payout settings
    const settings = await getPayoutSettings(restaurantId);

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        success: true,
        settings: {
          restaurantId,
          stripeAccountId: restaurant.stripeAccountId,
          schedule: {
            interval: 'daily',
            minimumAmount: 50, // R$ 50 minimum
          },
          enabled: false,
        },
        estimatedNextPayout: null,
      });
    }

    const estimatedNextPayout = settings.enabled 
      ? getEstimatedPayoutDate(settings.schedule)
      : null;

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        createdAt: settings.createdAt?.toISOString?.() || settings.createdAt,
        updatedAt: settings.updatedAt?.toISOString?.() || settings.updatedAt,
      },
      estimatedNextPayout: estimatedNextPayout?.toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching payout settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schedule, enabled } = await request.json();

    // Validate schedule
    if (!schedule || !schedule.interval) {
      return NextResponse.json({ 
        error: 'Invalid payout schedule' 
      }, { status: 400 });
    }

    const validIntervals = ['daily', 'weekly', 'monthly', 'manual'];
    if (!validIntervals.includes(schedule.interval)) {
      return NextResponse.json({ 
        error: 'Invalid interval' 
      }, { status: 400 });
    }

    if (schedule.interval === 'weekly' && schedule.weeklyAnchor) {
      const validAnchors = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validAnchors.includes(schedule.weeklyAnchor)) {
        return NextResponse.json({ 
          error: 'Invalid weekly anchor' 
        }, { status: 400 });
      }
    }

    if (schedule.interval === 'monthly' && schedule.monthlyAnchor) {
      if (schedule.monthlyAnchor < 1 || schedule.monthlyAnchor > 31) {
        return NextResponse.json({ 
          error: 'Invalid monthly anchor' 
        }, { status: 400 });
      }
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

    const restaurantId = restaurantDoc.docs[0].id;
    const restaurant = restaurantDoc.docs[0].data();

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account not configured' 
      }, { status: 400 });
    }

    // Configure payout schedule
    await configurePayoutSchedule(restaurantId, restaurant.stripeAccountId, schedule);

    // Update enabled status
    await adminDb
      .collection('payoutSettings')
      .doc(restaurantId)
      .update({
        enabled,
        updatedAt: new Date(),
      });

    // Get updated settings
    const updatedSettings = await getPayoutSettings(restaurantId);
    const estimatedNextPayout = updatedSettings?.enabled 
      ? getEstimatedPayoutDate(updatedSettings.schedule)
      : null;

    // Create notification
    await adminDb.collection('notifications').add({
      type: 'payout.settings.updated',
      recipientId: restaurantId,
      recipientType: 'restaurant',
      title: 'Configurações de Saque Atualizadas',
      message: `Configurações de saque automático foram ${enabled ? 'ativadas' : 'desativadas'}`,
      data: {
        interval: schedule.interval,
        enabled,
        estimatedNextPayout: estimatedNextPayout?.toISOString(),
      },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payout settings updated successfully',
      settings: updatedSettings,
      estimatedNextPayout: estimatedNextPayout?.toISOString(),
    });

  } catch (error: any) {
    console.error('Error updating payout settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}