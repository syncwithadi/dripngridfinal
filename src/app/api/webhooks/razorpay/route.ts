import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanityWriteClient } from '@/sanity/client';
import { trackCouponUsage } from '@/app/api/orders/route';

/**
 * Razorpay Webhook Handler
 *
 * Server-to-server fallback that ensures payments are captured
 * even if the user's browser closes or the frontend callback fails.
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://dripngrid.in/api/webhooks/razorpay
 *   Events: payment.captured
 *   Secret: Set RAZORPAY_WEBHOOK_SECRET in .env
 */
export async function POST(request: NextRequest) {
  console.log('[Webhook] Received incoming webhook request');

  try {
    // ── 1. Read raw body BEFORE any JSON parsing (required for signature) ─────
    const rawBody = await request.text();

    // ── 2. Validate webhook secret exists ────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // ── 3. Verify x-razorpay-signature header exists ─────────────────────────
    const receivedSignature = request.headers.get('x-razorpay-signature');
    if (!receivedSignature) {
      console.error('[Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // ── 4. Compute expected HMAC-SHA256 signature ────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // ── 5. Timing-safe signature comparison (prevents timing attacks) ────────
    const sigBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('[Webhook] Invalid signature — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Webhook] Signature verified successfully');

    // ── 6. Parse event payload (safe to parse now — signature is valid) ──────
    const event = JSON.parse(rawBody);
    const eventType: string = event.event;

    // ── 7. Only process payment.captured — ignore all other events safely ────
    if (eventType !== 'payment.captured') {
      console.log(`[Webhook] Ignoring event type: ${eventType}`);
      return NextResponse.json({ status: 'ignored', event: eventType }, { status: 200 });
    }

    // ── 8. Extract payment data from payload ─────────────────────────────────
    const payment = event.payload?.payment?.entity;
    if (!payment) {
      console.error('[Webhook] No payment entity found in payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const razorpayOrderId: string = payment.order_id;
    const razorpayPaymentId: string = payment.id;
    const amountPaise: number = payment.amount;
    const amountRupees: number = amountPaise / 100;

    if (!razorpayOrderId) {
      console.error('[Webhook] No order_id in payment entity');
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    console.log(`[Webhook] Processing payment.captured — order: ${razorpayOrderId}, payment: ${razorpayPaymentId}, amount: ₹${amountRupees}`);

    // ── 9. Find order in Sanity by razorpayOrderId ───────────────────────────
    const existingOrder = await sanityWriteClient.fetch(
      `*[_type == "order" && razorpayOrderId == $rzpOrderId][0]{
        _id, paymentVerified, total, status, orderNumber,
        discountCode, discountAmount,
        "customerEmail": customer.email,
        "customerName": customer.name
      }`,
      { rzpOrderId: razorpayOrderId }
    );

    if (!existingOrder) {
      console.warn(`[Webhook] Order not found for razorpayOrderId: ${razorpayOrderId}`);
      return NextResponse.json({ status: 'order_not_found' }, { status: 200 });
    }

    // ── 10. Idempotency: skip if already verified ────────────────────────────
    if (existingOrder.paymentVerified === true) {
      console.log(`[Webhook] Order ${existingOrder.orderNumber} already verified — skipping (idempotent)`);
      return NextResponse.json({ status: 'already_verified' }, { status: 200 });
    }

    // ── 11. AMOUNT VALIDATION (CRITICAL) ─────────────────────────────────────
    // Verify the captured amount matches what the order expects.
    const expectedPaise = Math.round(existingOrder.total * 100);
    if (amountPaise !== expectedPaise) {
      console.error(
        `[Webhook] AMOUNT MISMATCH — Order ${existingOrder.orderNumber}: ` +
        `expected ₹${existingOrder.total} (${expectedPaise}p), ` +
        `got ₹${amountRupees} (${amountPaise}p). NOT marking as paid.`
      );
      // Return 200 so Razorpay doesn't retry, but do NOT mark as paid
      return NextResponse.json({ status: 'amount_mismatch' }, { status: 200 });
    }

    // ── 12. Handle cancelled order recovery ──────────────────────────────────
    if (existingOrder.status === 'cancelled') {
      console.log(`[Webhook] Order ${existingOrder.orderNumber} was cancelled — recovering with verified payment`);
    }

    // ── 13. Update order to confirmed + paid ─────────────────────────────────
    await sanityWriteClient
      .patch(existingOrder._id)
      .set({
        paymentStatus: 'paid',
        paymentId: razorpayPaymentId,
        paidAmount: amountRupees,
        paymentVerified: true,
        status: 'confirmed',
        statusUpdatedAt: new Date().toISOString(),
      })
      .commit();

    console.log(`[Webhook] Order ${existingOrder.orderNumber} confirmed via webhook (payment: ${razorpayPaymentId})`);

    // ── 14. POST-PAYMENT COUPON TRACKING ─────────────────────────────────────
    // Track coupon usage only after verified payment — prevents coupon exhaustion DoS
    if (existingOrder.discountCode && existingOrder.discountAmount > 0) {
      try {
        const coupon = await sanityWriteClient.fetch(
          `*[_type == "coupon" && code == $code][0]{ _id }`,
          { code: existingOrder.discountCode }
        );
        if (coupon?._id) {
          await trackCouponUsage(coupon._id, {
            orderNumber: existingOrder.orderNumber,
            customerEmail: existingOrder.customerEmail,
            customerName: existingOrder.customerName,
            discountAmount: existingOrder.discountAmount,
            orderTotal: existingOrder.total,
          });
          console.log(`[Webhook] Coupon ${existingOrder.discountCode} usage tracked for order ${existingOrder.orderNumber}`);
        }
      } catch (couponErr) {
        console.error('[Webhook] Failed to track coupon usage:', couponErr);
      }
    }

    // ── 15. Send confirmation email (best-effort) ────────────────────────────
    try {
      const updatedOrder = await sanityWriteClient.fetch(
        `*[_type == "order" && _id == $id][0]`,
        { id: existingOrder._id }
      );
      if (updatedOrder?.customer?.email) {
        const { sendOrderConfirmationEmail } = await import('@/lib/email');
        await sendOrderConfirmationEmail({
          customerName: updatedOrder.customer.name,
          customerEmail: updatedOrder.customer.email,
          orderNumber: updatedOrder.orderNumber,
          items: updatedOrder.items.map((i: any) => ({
            productName: i.productName,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            priceINR: i.priceINR
          })),
          total: updatedOrder.total,
          shippingCost: updatedOrder.shipping,
          paymentMethod: 'razorpay',
          shippingAddress: {
            line1: updatedOrder.shippingAddress?.line1,
            city: updatedOrder.shippingAddress?.city,
            state: updatedOrder.shippingAddress?.state,
            postalCode: updatedOrder.shippingAddress?.postalCode
          }
        });
        console.log(`[Webhook] Confirmation email sent to ${updatedOrder.customer.email}`);
      }
    } catch (emailErr) {
      console.error('[Webhook] Failed to send confirmation email:', emailErr);
    }

    // ── 16. Return 200 OK (Razorpay requires this) ───────────────────────────
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] Unhandled error:', error);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}
