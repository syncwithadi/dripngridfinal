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
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body_data = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body_data)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Update order payment status to failed
      if (orderId) {
        await sanityWriteClient
          .patch(orderId)
          .set({
            paymentStatus: 'failed',
          })
          .commit();
      }

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified successfully - update order in Sanity
    if (orderId) {
      const updatedOrder = await sanityWriteClient
        .patch(orderId)
        .set({
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id,
          status: 'confirmed',
        })
        .commit();

      // Send confirmation email
      import('@/lib/email').then(({ sendOrderConfirmationEmail }) => {
        sendOrderConfirmationEmail({
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
            line1: updatedOrder.shippingAddress.line1,
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            postalCode: updatedOrder.shippingAddress.postalCode
          }
        });
      });
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
