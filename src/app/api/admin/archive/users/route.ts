import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { verifyArchiveAccess } from '@/lib/admin/archiveAccess';
import { archiveClient } from '@/sanity/archiveClient';

/**
 * Archive Users API — Read-only access to users in the archive dataset.
 *
 * These users were physically moved from production to the archive dataset.
 * They no longer exist in production at all.
 *
 * Security: Super admin + archive access token (10-minute window) required.
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });

  const hasAccess = await verifyArchiveAccess(req);
  if (!hasAccess) return NextResponse.json({ error: 'Archive access expired or not granted.' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Archive dataset contains only archived users — no filter needed
    let filter = `_type == "user"`;
    const params: Record<string, string> = {};

    if (search) {
      filter += ` && (name match $search || email match $search)`;
      params.search = `*${search}*`;
    }

    const [users, total] = await Promise.all([
      archiveClient.fetch(
        `*[${filter}] | order(_createdAt desc)[${offset}...${offset + limit}]{
          _id, name, email, phone, role, isVerified, _createdAt, _archivedAt
        }`,
        params
      ),
      archiveClient.fetch(`count(*[${filter}])`, params),
    ]);

    return NextResponse.json({
      users: users || [],
      total: total || 0,
      page,
      limit,
      dataset: 'archive',
    });
  } catch (err) {
    console.error('[Archive Users]', err);
    return NextResponse.json({ error: 'Failed to fetch archive users.' }, { status: 500 });
  }
}
