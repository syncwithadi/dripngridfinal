import { NextRequest, NextResponse } from 'next/server';
import { getRazorpay, convertToPaise } from '@/lib/razorpay';
import { getNextOrderNumber, syncUserProfile } from '@/lib/orderUtils';
import { sanityWriteClient } from '@/sanity/client';

interface CreateOrderRequest {
  items: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
    // priceINR intentionally NOT accepted from client
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
  discountCode?: string;
  // discountAmount intentionally NOT accepted from client
}

// ── Max qty per line item (prevents abuse) ──────────────────────────────────
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_ORDER = 20;

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { items, customer, shippingAddress, paymentMethod, discountCode } = body;

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json({ error: `Maximum ${MAX_ITEMS_PER_ORDER} items per order` }, { status: 400 });
    }
    if (!customer.email || !customer.name) {
      return NextResponse.json({ error: 'Customer details required' }, { status: 400 });
    }

    // ── 2. Validate quantities ───────────────────────────────────────────────
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}` },
          { status: 400 }
        );
      }
    }

    // ── 3. SERVER-SIDE PRICE LOOKUP (CRITICAL SECURITY) ─────────────────────
    // Fetch real prices from Sanity for ALL products in one query.
    // NEVER trust client-provided prices.
    const productIds = [...new Set(items.map(i => i.productId))];
    const products = await sanityWriteClient.fetch(
      `*[_type == "product" && _id in $ids]{ _id, name, priceINR, inStock, isHidden }`,
      { ids: productIds }
    );

    // Build a lookup map: productId → product data
    const productMap = new Map<string, { name: string; priceINR: number; inStock: boolean; isHidden: boolean }>();
    for (const p of products) {
      productMap.set(p._id, { name: p.name, priceINR: p.priceINR, inStock: p.inStock, isHidden: p.isHidden });
    }

    // Validate every item has a real product, is in stock, and is not hidden
    const resolvedItems: {
      productId: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
      priceINR: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.isHidden) {
        return NextResponse.json(
          { error: `Product "${product.name}" is no longer available` },
          { status: 400 }
        );
      }
      if (!product.inStock) {
        return NextResponse.json(
          { error: `Product "${product.name}" is out of stock` },
          { status: 400 }
        );
      }
      if (!product.priceINR || product.priceINR <= 0) {
        return NextResponse.json(
          { error: `Product "${product.name}" has invalid pricing` },
          { status: 400 }
        );
      }

      resolvedItems.push({
        productId: item.productId,
        productName: product.name,
        size: item.size || 'One Size',
        color: item.color || 'Default',
        quantity: item.quantity,
        priceINR: product.priceINR, // FROM DATABASE, not client
      });
    }

    // ── 4. Calculate subtotal from DB prices ─────────────────────────────────
    const subtotal = resolvedItems.reduce((sum, item) => {
      return sum + item.priceINR * item.quantity;
    }, 0);

    // ── 5. SERVER-SIDE COUPON VALIDATION (CRITICAL SECURITY) ────────────────
    // NEVER trust discountAmount from the client. Compute it here.
    let discountAmount = 0;
    let validatedCoupon: { _id: string; code: string; type: string; value: number; maxDiscount?: number } | null = null;

    if (discountCode) {
      const code = discountCode.toUpperCase().trim();
      const coupon = await sanityWriteClient.fetch(
        `*[_type == "coupon" && code == $code][0]`,
        { code }
      );

      if (coupon && coupon.active) {
        // Check expiry
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        // Check max total uses
        const notExhausted = !coupon.maxUses || (coupon.usedCount || 0) < coupon.maxUses;
        // Check per-user uses
        let userAllowed = true;
        if (coupon.maxUsesPerUser && customer.email && coupon.usages) {
          const userUses = (coupon.usages as any[]).filter(
            (u) => u.customerEmail === customer.email
          ).length;
          userAllowed = userUses < coupon.maxUsesPerUser;
        }
        // Check minimum order
        const meetsMinimum = !coupon.minOrder || subtotal >= coupon.minOrder;

        if (notExpired && notExhausted && userAllowed && meetsMinimum) {
          // Calculate discount server-side
          if (coupon.type === 'percent') {
            discountAmount = Math.round(subtotal * (coupon.value / 100));
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.value, subtotal);
          }
          validatedCoupon = {
            _id: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            maxDiscount: coupon.maxDiscount,
          };
        }
        // If coupon is invalid/expired/exhausted, silently ignore it — order still proceeds
      }
    }

    // ── 6. Calculate final totals ────────────────────────────────────────────
    const shippingCost = 0; // Temporarily disabled for testing
    const taxRate = 0.18;
    const tax = Math.round(subtotal * taxRate);
    const total = Math.max(0, subtotal - discountAmount + shippingCost + tax);

    // ── 7. Generate order number ─────────────────────────────────────────────
    const orderNumber = await getNextOrderNumber();

    // ── 8. Determine order type ──────────────────────────────────────────────
    const isCod = paymentMethod === 'cod';
    const isFree = total === 0 && !isCod;

    // ── 9. Create Razorpay order (skip for COD and free orders) ──────────────
    let razorpayOrderId = '';
    if (!isCod && !isFree) {
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

    // ── 10. Determine initial status ─────────────────────────────────────────
    // Free orders (₹0 via 100% coupon) are confirmed immediately like COD
    const initialStatus = (isCod || isFree) ? 'confirmed' : 'pending_payment';
    const initialPaymentStatus = isCod ? 'cod_pending' : isFree ? 'free' : 'pending';

    // ── 10. Create order in Sanity ───────────────────────────────────────────
    const sanityOrder = await sanityWriteClient.create({
      _type: 'order',
      orderNumber,
      customer,
      items: resolvedItems.map((item) => ({
        _key: `${item.productId}-${item.size}-${item.color}`,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        priceINR: item.priceINR, // FROM DATABASE
      })),
      subtotal,
      ...(validatedCoupon ? { discountCode: validatedCoupon.code } : {}),
      ...(discountAmount > 0 ? { discountAmount } : {}),
      shipping: shippingCost,
      tax,
      total,
      paidAmount: 0,
      currency: 'INR',
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      paymentVerified: isFree ? true : false,
      statusUpdatedAt: new Date().toISOString(),
      razorpayOrderId: razorpayOrderId || undefined,
      paymentMethod: paymentMethod || 'razorpay',
      shippingAddress,
      createdAt: new Date().toISOString(),
    });

    // ── 11. Coupon usage tracking ────────────────────────────────────────────
    // For Razorpay orders: coupon usage is tracked AFTER payment verification
    //   (see /api/payment/verify and /api/webhooks/razorpay)
    // For COD orders: track immediately since they're confirmed on creation
    if ((isCod || isFree) && validatedCoupon && discountAmount > 0) {
      trackCouponUsage(validatedCoupon._id, {
        orderNumber,
        customerEmail: customer.email,
        customerName: customer.name,
        discountAmount,
        orderTotal: total,
      }).catch(err => console.error('Failed to track coupon usage:', err));
    }

    // ── 12. Sync user profile (fire-and-forget) ──────────────────────────────
    syncUserProfile(customer.email, {
      phone: customer.phone,
      alternatePhone: customer.alternatePhone,
      address: shippingAddress,
    }).catch(err => console.error('Failed to sync user profile:', err));

    // ── 13. Send confirmation email immediately for COD and free orders ────────
    if (isCod || isFree) {
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/email');
        await sendOrderConfirmationEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          orderNumber,
          items: resolvedItems.map(i => ({
            productName: i.productName,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            priceINR: i.priceINR,
          })),
          total,
          shippingCost,
          paymentMethod: isCod ? 'cod' : 'free',
          shippingAddress: {
            line1: shippingAddress.line1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
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
        isFree,
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

// ── Shared coupon tracking helper (used by orders, verify, and webhook) ──────
export async function trackCouponUsage(
  couponId: string,
  data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    discountAmount: number;
    orderTotal: number;
  }
) {
  const couponDoc = await sanityWriteClient.fetch(
    `*[_type == "coupon" && _id == $id][0]{ _id, usedCount, totalDiscountGiven }`,
    { id: couponId }
  );
  if (!couponDoc) return;

  const newUsage = {
    _key: `${data.orderNumber}-${Date.now()}`,
    orderNumber: data.orderNumber,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    discountAmount: data.discountAmount,
    orderTotal: data.orderTotal,
    usedAt: new Date().toISOString(),
  };

  await sanityWriteClient
    .patch(couponDoc._id)
    .set({
      usedCount: (couponDoc.usedCount || 0) + 1,
      totalDiscountGiven: (couponDoc.totalDiscountGiven || 0) + data.discountAmount,
    })
    .append('usages', [newUsage])
    .commit();
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
      query = `*[_type == "order" && customer.email == $email && status != "pending_payment"] | order(createdAt desc) { ..., ${itemsProjection} }`;
      params = { email };
    }

    const result = await sanityWriteClient.fetch(query, params);

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
