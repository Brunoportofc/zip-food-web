import { adminDb } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { StripeErrorHandler } from './error-handler';

export interface PaymentTrackingInfo {
  orderId: string;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  lastUpdated: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export class PaymentTracker {
  /**
   * Track payment status and update order accordingly
   */
  static async trackPayment(orderId: string, paymentIntentId: string): Promise<PaymentTrackingInfo> {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Get current order data
      const orderDoc = await adminDb.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      const currentStatus = orderData?.paymentStatus;
      const newStatus = this.mapStripeStatusToOrderStatus(paymentIntent.status);

      // Update order if status changed
      if (currentStatus !== newStatus) {
        await this.updateOrderPaymentStatus(orderId, newStatus, paymentIntent);
      }

      return {
        orderId,
        paymentIntentId,
        status: newStatus,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        lastUpdated: new Date(),
        failureReason: paymentIntent.last_payment_error?.message,
        metadata: paymentIntent.metadata,
      };

    } catch (error: any) {
      StripeErrorHandler.logError('PaymentTracker.trackPayment', error, { orderId, paymentIntentId });
      throw error;
    }
  }

  /**
   * Get payment history for an order
   */
  static async getPaymentHistory(orderId: string): Promise<any[]> {
    try {
      const logsSnapshot = await adminDb
        .collection('payment_logs')
        .where('orderId', '==', orderId)
        .orderBy('timestamp', 'desc')
        .get();

      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString(),
      }));

    } catch (error: any) {
      StripeErrorHandler.logError('PaymentTracker.getPaymentHistory', error, { orderId });
      return [];
    }
  }

  /**
   * Monitor payment for real-time updates
   */
  static async monitorPayment(
    orderId: string, 
    paymentIntentId: string,
    onStatusChange?: (status: string) => void
  ): Promise<void> {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const trackingInfo = await this.trackPayment(orderId, paymentIntentId);
        
        if (onStatusChange) {
          onStatusChange(trackingInfo.status);
        }

        // Stop monitoring if payment is in final state
        if (['paid', 'failed', 'canceled', 'refunded'].includes(trackingInfo.status)) {
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        }

      } catch (error: any) {
        StripeErrorHandler.logError('PaymentTracker.monitorPayment', error, { orderId, paymentIntentId });
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      }
    };

    // Start monitoring
    checkStatus();
  }

  /**
   * Create payment log entry
   */
  static async logPaymentEvent(
    orderId: string,
    event: string,
    status: string,
    details?: any
  ): Promise<void> {
    try {
      await adminDb.collection('payment_logs').add({
        orderId,
        event,
        status,
        details: details || {},
        timestamp: new Date(),
      });

    } catch (error: any) {
      StripeErrorHandler.logError('PaymentTracker.logPaymentEvent', error, { orderId, event, status });
    }
  }

  /**
   * Get payment analytics for a restaurant
   */
  static async getPaymentAnalytics(restaurantId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('restaurantId', '==', restaurantId)
        .where('createdAt', '>=', startDate)
        .get();

      const analytics = {
        totalOrders: 0,
        paidOrders: 0,
        failedOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        successRate: 0,
      };

      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        analytics.totalOrders++;

        switch (order.paymentStatus) {
          case 'paid':
            analytics.paidOrders++;
            analytics.totalRevenue += order.total || 0;
            break;
          case 'failed':
            analytics.failedOrders++;
            break;
          case 'pending':
          case 'processing':
            analytics.pendingOrders++;
            break;
        }
      });

      analytics.averageOrderValue = analytics.paidOrders > 0 
        ? analytics.totalRevenue / analytics.paidOrders 
        : 0;

      analytics.successRate = analytics.totalOrders > 0 
        ? (analytics.paidOrders / analytics.totalOrders) * 100 
        : 0;

      return analytics;

    } catch (error: any) {
      StripeErrorHandler.logError('PaymentTracker.getPaymentAnalytics', error, { restaurantId, days });
      throw error;
    }
  }

  /**
   * Map Stripe payment intent status to order status
   */
  private static mapStripeStatusToOrderStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'processing',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'paid',
      'canceled': 'canceled',
    };

    return statusMap[stripeStatus] || 'failed';
  }

  /**
   * Update order payment status in Firestore
   */
  private static async updateOrderPaymentStatus(
    orderId: string,
    status: string,
    paymentIntent: any
  ): Promise<void> {
    try {
      const updateData: any = {
        paymentStatus: status,
        updatedAt: new Date(),
      };

      if (status === 'paid') {
        updateData.paidAt = new Date();
        updateData.status = 'confirmed';
      } else if (status === 'failed') {
        updateData.paymentFailureReason = paymentIntent.last_payment_error?.message;
      }

      await adminDb.collection('orders').doc(orderId).update(updateData);

      // Log the status change
      await this.logPaymentEvent(orderId, 'status_change', status, {
        previousStatus: status,
        paymentIntentId: paymentIntent.id,
        stripeStatus: paymentIntent.status,
      });

    } catch (error: any) {
      StripeErrorHandler.logError('PaymentTracker.updateOrderPaymentStatus', error, { orderId, status });
      throw error;
    }
  }
}
