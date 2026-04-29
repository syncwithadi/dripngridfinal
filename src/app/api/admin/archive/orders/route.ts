import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { verifyArchiveAccess } from '@/lib/admin/archiveAccess';
import { archiveClient } from '@/sanity/archiveClient';
import { sanityClient } from '@/sanity/client';

/**
 * Archive Orders API
 *
 * Reads from TWO sources and merges them:
 *
 * 1. Production dataset — orders flagged with isArchived: true
 *    (these were archived using the old flag-based approach and
 *     haven't been physically migrated to the archive dataset yet)
 *
 * 2. Archive dataset (archive_x7k9p2m4v) — orders physically moved
 *    here via the true cross-dataset migration
 *
 * After the true migration runs, source 1 will be empty (those docs
 * get deleted from production) and everything will live in source 2.
 *
 * Security: Super admin + archive access token (10-minute window).
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });

  const hasAccess = await verifyArchiveAccess(req);
  if (!hasAccess) return NextResponse.json({ error: 'Archive access expired or not granted. Please unlock archive.' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const limit = 20;
    const offset = (page - 1) * limit;

    const params: Record<string, string> = {};
    let searchClause = '';
    if (search) {
      searchClause = ` && (orderNumber match $search || customer.name match $search || customer.email match $search)`;
      params.search = `*${search}*`;
    }

    const projection = `{
      _id, orderNumber, status, total, currency, createdAt, paymentMethod,
      paymentStatus, paymentVerified, archivedAt, _archivedAt,
      "customerName": customer.name,
      "customerEmail": customer.email,
      "itemCount": count(items),
      "_source": "production"
    }`;

    const archiveProjection = `{
      _id, orderNumber, status, total, currency, createdAt, paymentMethod,
      paymentStatus, paymentVerified, _archivedAt,
      "customerName": customer.name,
      "customerEmail": customer.email,
      "itemCount": count(items),
      "_source": "archive"
    }`;

    // Fetch from both sources in parallel
    const [productionFlagged, archiveDataset] = await Promise.all([
      // Source 1: production orders with isArchived flag (old approach)
      sanityClient.fetch(
        `*[_type == "order" && isArchived == true${searchClause}] | order(createdAt desc)${projection}`,
        params
      ),
      // Source 2: archive dataset (new approach, may be empty until migration runs)
      archiveClient.fetch(
        `*[_type == "order"${searchClause}] | order(createdAt desc)${archiveProjection}`,
        params
      ).catch(() => [] as any[]), // gracefully handle if archive dataset doesn't exist yet
    ]);

    // Merge and sort by createdAt desc, deduplicate by _id
    const seen = new Set<string>();
    const merged = [
      ...(archiveDataset || []),      // archive dataset takes priority
      ...(productionFlagged || []),   // then production flagged
    ].filter(o => {
      if (seen.has(o._id)) return false;
      seen.add(o._id);
      return true;
    }).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = merged.length;
    const paginated = merged.slice(offset, offset + limit);

    return NextResponse.json({
      orders: paginated,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('[Archive Orders]', err);
    return NextResponse.json({ error: 'Failed to fetch archive orders.' }, { status: 500 });
  }
}
