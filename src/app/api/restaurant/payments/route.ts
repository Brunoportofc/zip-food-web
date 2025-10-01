import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getBalance, listTransactions } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const period = searchParams.get('period') || 'month';

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'restaurantId é obrigatório' },
        { status: 400 }
      );
    }

    // Get restaurant data to check Stripe account
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    const restaurantData = restaurantDoc.data();
    const stripeAccountId = restaurantData?.stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json(
        { success: false, message: 'Conta Stripe não configurada' },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get balance from Stripe
    const balance = await getBalance(stripeAccountId);

    // Get transactions from Stripe
    const transactions = await listTransactions(stripeAccountId, {
      limit: 20,
      created: {
        gte: Math.floor(startDate.getTime() / 1000)
      }
    });

    // Get payment logs from Firebase for additional data
    const paymentLogsQuery = await db
      .collection('paymentLogs')
      .where('restaurantId', '==', restaurantId)
      .where('createdAt', '>=', startDate.toISOString())
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const paymentLogs = paymentLogsQuery.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate totals
    const totalEarnings = paymentLogs
      .filter((log: any) => log.status === 'succeeded')
      .reduce((sum: number, log: any) => sum + (log.amount || 0), 0) / 100; // Convert from cents

    const pendingPayouts = balance.pending.reduce((sum: number, pending: any) => 
      sum + pending.amount, 0) / 100;

    const completedPayouts = balance.available.reduce((sum: number, available: any) => 
      sum + available.amount, 0) / 100;

    // Format recent transactions
    const recentTransactions = transactions.data.map((transaction: any) => ({
      id: transaction.id,
      orderId: transaction.metadata?.orderId || 'N/A',
      amount: transaction.amount / 100,
      currency: transaction.currency.toUpperCase(),
      status: transaction.status,
      type: transaction.type === 'charge' ? 'payment' : 
            transaction.type === 'payout' ? 'payout' : 'other',
      createdAt: new Date(transaction.created * 1000).toISOString(),
      description: transaction.description || 
                  (transaction.type === 'charge' ? 'Pagamento recebido' : 
                   transaction.type === 'payout' ? 'Transferência bancária' : 'Transação')
    }));

    // Calculate monthly earnings
    const monthlyEarnings = [];
    const monthlyData = new Map();

    paymentLogs
      .filter((log: any) => log.status === 'succeeded')
      .forEach((log: any) => {
        const date = new Date(log.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { earnings: 0, orders: 0 });
        }
        
        const data = monthlyData.get(monthKey);
        data.earnings += (log.amount || 0) / 100;
        data.orders += 1;
      });

    // Convert to array and format
    for (const [monthKey, data] of monthlyData.entries()) {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      });
      
      monthlyEarnings.push({
        month: monthName,
        earnings: data.earnings,
        orders: data.orders
      });
    }

    // Sort by date (most recent first)
    monthlyEarnings.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        pendingPayouts,
        completedPayouts,
        recentTransactions: recentTransactions.slice(0, 10),
        monthlyEarnings: monthlyEarnings.slice(0, 6)
      }
    });

  } catch (error) {
    console.error('Error fetching payment data:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
