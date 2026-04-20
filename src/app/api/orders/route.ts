import { NextRequest, NextResponse } from 'next/server';
import { getRazorpay, convertToPaise } from '@/lib/razorpay';
import { getNextOrderNumber, syncUserProfile } from '@/lib/orderUtils';
import { sanityWriteClient } from '@/sanity/client';

interface CreateOrderRequest {
  items: {
    productId: string;
    productName: string;
    size: string;
    color: string;
    quantity: number;
    priceINR: number;
  }[];
  customer: {
    name: string;
    email: string;
    phone: string;
    alternatePhone?: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { items, customer, shippingAddress, paymentMethod } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!customer.email || !customer.name) {
      return NextResponse.json(
        { error: 'Customer details required' },
        { status: 400 }
      );
    }

    // Calculate totals (INR only)
    const subtotal = items.reduce((sum, item) => {
      return sum + item.priceINR * item.quantity;
    }, 0);

    // Shipping calculation (free above ₹1,500)
    const freeShippingThreshold = 1500;
    const shippingCost = 0; // Temporarily disabled for testing

    // Tax (18% GST for India)
    const taxRate = 0.18;
    const tax = Math.round(subtotal * taxRate);

    const total = subtotal + shippingCost + tax;

    // Generate SEQUENTIAL order number (DRIP-3001, DRIP-3002, etc.)
    const orderNumber = await getNextOrderNumber();

    let razorpayOrderId = '';

    // Create Razorpay order ONLY if payment method is NOT COD
    if (paymentMethod !== 'cod') {
      const razorpay = getRazorpay();
      const razorpayOrder = await razorpay.orders.create({
        amount: convertToPaise(total),
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          customerEmail: customer.email,
          orderNumber: orderNumber,
        },
      });
      razorpayOrderId = razorpayOrder.id;
    }

    // Create order in Sanity
    const sanityOrder = await sanityWriteClient.create({
      _type: 'order',
      orderNumber,
      customer,
      items: items.map((item) => ({
        _key: `${item.productId}-${item.size}-${item.color}`,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        priceINR: item.priceINR,
      })),
      subtotal,
      shipping: shippingCost,
      tax,
      total,
      currency: 'INR',
      status: 'processing', // Start as processing (matches new schema)
      paymentStatus: 'pending', // Default to pending
      statusUpdatedAt: new Date().toISOString(), // Track when status was set
      razorpayOrderId: razorpayOrderId || undefined, // Optional for COD
      paymentMethod: paymentMethod || 'razorpay', // Store payment method if possible (might need schema update, but fine to pass)
      shippingAddress,
      createdAt: new Date().toISOString(),
    });

    // AUTO-SYNC: Update user profile with checkout data (fills empty fields)
    syncUserProfile(customer.email, {
      phone: customer.phone,
      alternatePhone: customer.alternatePhone,
      address: shippingAddress,
    }).catch(err => console.error('Failed to sync user profile:', err));

    // Send confirmation email for COD orders immediately
    if (paymentMethod === 'cod') {
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/email');
        await sendOrderConfirmationEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          orderNumber: orderNumber,
          items: items.map(i => ({
            productName: i.productName,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            priceINR: i.priceINR
          })),
          total: total,
          shippingCost: shippingCost,
          paymentMethod: 'cod',
          shippingAddress: {
            line1: shippingAddress.line1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode
          }
        });
      } catch (emailErr) {
        console.error('Failed to send COD order confirmation email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: sanityOrder._id,
        orderNumber,
        razorpayOrderId,
        total,
        currency: 'INR',
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get order by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    if (!orderId && !email && !orderNumber) {
      return NextResponse.json(
        { error: 'Order ID, Number, or Email required' },
        { status: 400 }
      );
    }

    let query = '';
    let params: Record<string, string> = {};

    const itemsProjection = `items[] { ..., "imageUrl": *[_type == "product" && _id == ^.productId][0].images.front.asset->url }`;

    if (orderId) {
      query = `*[_type == "order" && _id == $orderId][0]{ ..., ${itemsProjection} }`;
      params = { orderId };
    } else if (orderNumber) {
      query = `*[_type == "order" && orderNumber == $orderNumber][0]{ ..., ${itemsProjection} }`;
      params = { orderNumber };
    } else if (email) {
      query = `*[_type == "order" && customer.email == $email] | order(createdAt desc) { ..., ${itemsProjection} }`;
      params = { email };
    }

    const result = await sanityWriteClient.fetch(query, params);

    // When querying by email the result is an array; handle both cases
    const isEmpty = Array.isArray(result) ? result.length === 0 : !result;
    if (isEmpty) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
