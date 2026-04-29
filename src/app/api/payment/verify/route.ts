import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanityWriteClient } from '@/sanity/client';

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string; // Sanity order ID
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    // Validate request
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 }
      );
    }
    const body_data = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body_data)
      .digest('hex');

    // Timing-safe signature comparison (prevents timing attacks)
    const sigBuffer = Buffer.from(razorpay_signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const isValid = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      // DO NOT modify order state — prevents malicious state manipulation
      // by attackers who might guess an orderId and send garbage signatures.
      // The webhook will handle legitimate payment failures.
      console.warn(`[Verify] Invalid signature for order: ${orderId || 'unknown'}`);

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified successfully - update order in Sanity
    if (orderId) {
      // SECURITY: Fetch the Sanity order first and verify the Razorpay order ID
      // matches what was originally created. This prevents an attacker from paying
      // ₹1 with their own Razorpay order and marking an expensive order as paid.
      const existingOrder = await sanityWriteClient.fetch(
        `*[_type == "order" && _id == $orderId][0]{
          razorpayOrderId, paymentVerified, total, orderNumber,
          discountCode, discountAmount,
          "customerEmail": customer.email,
          "customerName": customer.name
        }`,
        { orderId }
      );

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Idempotency: if already verified, return success without double-updating
      if (existingOrder.paymentVerified === true) {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
          paymentId: razorpay_payment_id,
        });
      }

      if (existingOrder.razorpayOrderId !== razorpay_order_id) {
        return NextResponse.json(
          { error: 'Payment order mismatch' },
          { status: 400 }
        );
      }

      // ── AMOUNT VALIDATION (CRITICAL) ──────────────────────────────────────
      // Fetch the actual payment from Razorpay to verify the captured amount
      // matches what we expected. This prevents partial payment exploits.
      try {
        const { getRazorpay } = await import('@/lib/razorpay');
        const razorpay = getRazorpay();
        const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
        const paidPaise = Number(rzpPayment.amount);
        const expectedPaise = Math.round(existingOrder.total * 100);

        if (paidPaise !== expectedPaise) {
          console.error(
            `[Verify] AMOUNT MISMATCH — Order ${existingOrder.orderNumber}: ` +
            `expected ₹${existingOrder.total} (${expectedPaise}p), ` +
            `got ₹${paidPaise / 100} (${paidPaise}p)`
          );
          return NextResponse.json(
            { error: 'Payment amount does not match order total' },
            { status: 400 }
          );
        }
      } catch (rzpErr) {
        console.error('[Verify] Failed to fetch payment from Razorpay:', rzpErr);
        // If we can't verify amount, still accept — the signature proves
        // the payment was made against our Razorpay order (which was created
        // with the correct amount). The webhook will also validate.
      }

      const updatedOrder = await sanityWriteClient
        .patch(orderId)
        .set({
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id,
          paidAmount: existingOrder.total,
          paymentVerified: true,
          status: 'confirmed',
          statusUpdatedAt: new Date().toISOString(),
        })
        .commit();

      // Coupon tracking is handled exclusively by the webhook route
      // to prevent race-condition double-counting when both fire simultaneously.

      // Send confirmation email
      try {
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
      } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
