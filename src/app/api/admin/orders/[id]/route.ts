import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const order = await sanityClient.fetch(
      `*[_type == "order" && _id == $id][0]{
        _id, orderNumber, status, total, currency, createdAt, paymentMethod, trackingId,
        customer, items, shippingAddress, couponCode, discountAmount, notes,
        razorpayOrderId, razorpayPaymentId,
        paymentStatus, paymentVerified, paidAmount
      }`,
      { id }
    );

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[Admin Order GET]', err);
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, trackingId, notes } = body;

    // SECURITY: Fetch the current order to enforce payment rules
    const existingOrder = await sanityClient.fetch(
      `*[_type == "order" && _id == $id][0]{ paymentStatus, paymentVerified, status }`,
      { id }
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Block fulfillment actions on unpaid orders
    const fulfillmentStatuses = ['shipped', 'delivered', 'processing'];
    if (status && fulfillmentStatuses.includes(status)) {
      if (existingOrder.paymentStatus !== 'paid' && existingOrder.paymentStatus !== 'cod_pending' && existingOrder.paymentStatus !== 'free') {
        return NextResponse.json(
          { error: `Cannot set status to "${status}" — payment has not been verified. Current payment status: ${existingOrder.paymentStatus}` },
          { status: 400 }
        );
      }
    }

    const patch: Record<string, string> = {};
    if (status) {
      patch.status = status;
      patch.statusUpdatedAt = new Date().toISOString();
    }
    if (trackingId !== undefined) patch.trackingId = trackingId;
    if (notes !== undefined) patch.notes = notes;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    await sanityWriteClient.patch(id).set(patch).commit();

    logAction(session, {
      action: 'ORDER_UPDATE',
      entity: 'order',
      entityId: id,
      details: JSON.stringify(patch),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Order PATCH]', err);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
