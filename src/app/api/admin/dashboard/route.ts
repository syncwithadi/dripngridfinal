import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';
import { getSystemConfig } from '@/lib/admin/config';
import { getHiddenFilter } from '@/lib/admin/hiddenFilter';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // ── Global visibility cutoff ─────────────────────────────────────────────
    const isSuperAdmin = session.role === 'super_admin';
    const config = isSuperAdmin ? { visibleFrom: null } : await getSystemConfig();
    const cutoff = config.visibleFrom;

    // Build cutoff clause
    const cutoffClause = cutoff ? ` && createdAt >= "${cutoff}"` : '';
    const cutoffParams = cutoff ? { visibleFrom: cutoff } : {};

    // Hidden data filter
    const hiddenClause = getHiddenFilter(session.role);

    // Log visibility: admin can't see super_admin logs
    const logRoleClause =
      session.role === 'admin'
        ? ` && role != "super_admin"`
        : session.role === 'employee'
        ? ` && employeeId == "${session.employeeId}"`
        : '';

    const [ordersToday, pendingOrders, recentOrders, recentLogs, pendingRequests, lowStockProducts] =
      await Promise.all([
        // Orders today: apply cutoff, exclude pending_payment/failed/archived, apply hidden filter
        sanityClient.fetch(
          `count(*[_type == "order" && status != "pending_payment" && status != "failed" && (isArchived != true) && createdAt >= $today${cutoffClause}${hiddenClause}])`,
          { today: todayISO, ...cutoffParams }
        ),
        // Pending orders: confirmed but not yet shipped, exclude archived
        sanityClient.fetch(
          `count(*[_type == "order" && status == "confirmed" && (isArchived != true)${cutoffClause}${hiddenClause}])`,
          cutoffParams
        ),
        // Recent orders: exclude pending_payment and archived, apply cutoff + hidden filter
        sanityClient.fetch(
          `*[_type == "order" && status != "pending_payment" && (isArchived != true)${cutoffClause}${hiddenClause}] | order(createdAt desc)[0...10]{
            _id, orderNumber, status, total, currency, createdAt,
            "customerName": customer.name,
            "customerEmail": customer.email,
            paymentMethod, paymentStatus
          }`,
          cutoffParams
        ),
        // Recent logs: role-filtered
        sanityClient.fetch(
          `*[_type == "adminLog"${logRoleClause}] | order(timestamp desc)[0...8]{
            _id, timestamp, employeeName, action, entity, details
          }`,
          {}
        ),
        sanityClient.fetch(`count(*[_type == "couponRequest" && status == "pending"])`, {}),
        // Low stock alerts disabled — product schema uses sizes as string[],
        // not {size, stock} objects. Re-enable after adding per-size inventory.
        Promise.resolve([]),
      ]);

    // Low stock: disabled until schema supports per-size stock tracking
    const lowStock: any[] = [];

    return NextResponse.json({
      ordersToday: ordersToday || 0,
      pendingOrders: pendingOrders || 0,
      pendingRequests: pendingRequests || 0,
      lowStockCount: lowStock.length,
      recentOrders: recentOrders || [],
      recentLogs: recentLogs || [],
      lowStockProducts: lowStock.slice(0, 5),
      // Pass the cutoff so the UI can show an info banner
      visibleFrom: cutoff ?? null,
      role: session.role,
    });
  } catch (err) {
    console.error('[Admin Dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
