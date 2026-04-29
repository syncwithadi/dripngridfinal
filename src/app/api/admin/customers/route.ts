import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';
import { getVisibilityFilter } from '@/lib/admin/config';
import { getHiddenFilter } from '@/lib/admin/hiddenFilter';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Aggregate customers from CONFIRMED orders only (exclude pending_payment, cancelled, failed)
    let filter = `_type == "order" && status != "pending_payment" && status != "cancelled" && status != "failed"`;
    const params: Record<string, string> = {};

    // Hidden data filter: non-super_admin cannot see hidden orders
    filter += getHiddenFilter(session.role);

    if (search) {
      filter += ` && (customer.name match $search || customer.email match $search)`;
      params.search = `*${search}*`;
    }

    // ── Global visibility cutoff (non-super_admin only) ──────────────────────
    const { clause, params: finalParams } = await getVisibilityFilter(session.role, params);
    filter += clause;

    const orders = await sanityClient.fetch(
      `*[${filter}]{
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        total, createdAt, paymentStatus
      }`,
      finalParams
    );

    // Aggregate by email — only count paid orders in totalSpent
    const map = new Map<string, { name: string; email: string; phone: string; orderCount: number; totalSpent: number; lastOrderDate: string }>();
    for (const o of orders || []) {
      const key = o.email;
      if (!key) continue;
      const existing = map.get(key);
      // Only add to totalSpent if payment is verified (paid, cod_pending, or free)
      const isPaid = o.paymentStatus === 'paid' || o.paymentStatus === 'cod_pending' || o.paymentStatus === 'free';
      if (existing) {
        existing.orderCount++;
        if (isPaid) existing.totalSpent += o.total || 0;
        if (!existing.lastOrderDate || o.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = o.createdAt;
        }
      } else {
        map.set(key, { name: o.name, email: o.email, phone: o.phone || '', orderCount: 1, totalSpent: isPaid ? (o.total || 0) : 0, lastOrderDate: o.createdAt });
      }
    }

    const customers = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    return NextResponse.json({ customers });
  } catch (err) {
    console.error('[Admin Customers]', err);
    return NextResponse.json({ error: 'Failed to fetch customers.' }, { status: 500 });
  }
}
