import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';

/**
 * Auto-cancel stale pending_payment orders.
 *
 * Orders that remain in 'pending_payment' status for more than 30 minutes
 * are assumed abandoned and automatically cancelled.
 *
 * This endpoint can be called via:
 *   - A cron job (e.g. Vercel Cron, every 10 minutes)
 *   - Manually from admin panel
 *
 * Protected by a shared secret to prevent unauthorized calls.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cleanup secret (set in environment)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CLEANUP_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find orders stuck in pending_payment for more than 30 minutes
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const staleOrders = await sanityWriteClient.fetch(
      `*[_type == "order" && status == "pending_payment" && createdAt < $cutoff]{ _id, orderNumber }`,
      { cutoff }
    );

    if (!staleOrders || staleOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stale orders found',
        cancelled: 0,
      });
    }

    // Cancel each stale order
    let cancelled = 0;
    for (const order of staleOrders) {
      try {
        await sanityWriteClient
          .patch(order._id)
          .set({
            status: 'cancelled',
            paymentStatus: 'expired',
            statusUpdatedAt: new Date().toISOString(),
          })
          .commit();
        cancelled++;
        console.log(`[Cleanup] Cancelled stale order: ${order.orderNumber}`);
      } catch (err) {
        console.error(`[Cleanup] Failed to cancel order ${order.orderNumber}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${cancelled} stale orders`,
      cancelled,
      total: staleOrders.length,
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run cleanup' },
      { status: 500 }
    );
  }
}
