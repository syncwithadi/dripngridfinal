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
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const payment = searchParams.get('payment') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Default: exclude pending_payment orders unless explicitly filtered
    let filter = `_type == "order"`;
    const params: Record<string, string> = {};

    // ALWAYS exclude archived orders from main Orders view (all roles including super_admin)
    // Archived orders are only accessible via /admin/archive after unlock
    filter += ` && (isArchived != true)`;

    // Hidden data filter: non-super_admin cannot see hidden orders
    filter += getHiddenFilter(session.role);

    if (status) {
      filter += ` && status == $status`;
      params.status = status;
    } else {
      // By default, hide pending_payment orders from the admin view
      filter += ` && status != "pending_payment"`;
    }

    if (payment) { filter += ` && paymentMethod == $payment`; params.payment = payment; }
    if (from) { filter += ` && createdAt >= $from`; params.from = from; }
    if (to) { filter += ` && createdAt <= $to`; params.to = to; }
    if (search) {
      filter += ` && (orderNumber match $search || customer.name match $search || customer.email match $search)`;
      params.search = `*${search}*`;
    }

    // ── Global visibility cutoff (non-super_admin only) ──────────────────────
    const { clause, params: finalParams } = await getVisibilityFilter(session.role, params);
    filter += clause;

    const [orders, total] = await Promise.all([
      sanityClient.fetch(
        `*[${filter}] | order(createdAt desc)[${offset}...${offset + limit}]{
          _id, orderNumber, status, total, currency, createdAt, paymentMethod, trackingId,
          paymentStatus, paymentVerified, paidAmount, visibility,
          "customerName": customer.name,
          "customerEmail": customer.email,
          "customerPhone": customer.phone,
          "itemCount": count(items)
        }`,
        finalParams
      ),
      sanityClient.fetch(`count(*[${filter}])`, finalParams),
    ]);

    return NextResponse.json({ orders: orders || [], total: total || 0, page, limit });
  } catch (err) {
    console.error('[Admin Orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
