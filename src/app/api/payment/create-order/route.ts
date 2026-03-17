import { NextRequest, NextResponse } from 'next/server';
import { getRazorpay, convertToPaise } from '@/lib/razorpay';

interface CreatePaymentOrderRequest {
  amount: number;
  currency: 'INR' | 'USD';
  receipt: string;
  notes?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentOrderRequest = await request.json();
    const { amount, currency, receipt, notes } = body;

    // Validate request
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Razorpay only supports INR for Indian merchants
    // For USD, you would need international payment support
    if (currency !== 'INR') {
      return NextResponse.json(
        { error: 'Only INR payments are currently supported' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: convertToPaise(amount),
      currency: 'INR',
      receipt: receipt || `order_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
