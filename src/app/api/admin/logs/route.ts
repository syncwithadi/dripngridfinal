import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || '';
    const action = searchParams.get('action') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25;
    const offset = (page - 1) * limit;

    let filter = `_type == "adminLog"`;
    const params: Record<string, string> = {};

    if (employeeId) { filter += ` && employeeId == $empId`; params.empId = employeeId; }
    if (action) { filter += ` && action == $action`; params.action = action; }
    if (from) { filter += ` && timestamp >= $from`; params.from = from; }
    if (to) { filter += ` && timestamp <= $to`; params.to = to; }
    if (search) {
      filter += ` && (employeeName match $search || details match $search || entity match $search)`;
      params.search = `*${search}*`;
    }

    // ── Role-based log visibility ────────────────────────────────────────────
    // super_admin → sees all logs
    // admin       → sees employee logs only (cannot see super_admin activity)
    // employee    → sees only their own logs
    if (session.role === 'admin') {
      filter += ` && role != "super_admin"`;
    } else if (session.role === 'employee') {
      // Employees only see their own logs; employeeId param is forced to self
      params.empId = session.employeeId;
      // Replace any existing empId filter with forced self filter
      if (!filter.includes('employeeId == $empId')) {
        filter += ` && employeeId == $empId`;
      }
    }

    const [logs, total] = await Promise.all([
      sanityClient.fetch(
        `*[${filter}] | order(timestamp desc)[${offset}...${offset + limit}]{
          _id, timestamp, employeeId, employeeName, role, action, entity, entityId, details, ip
        }`,
        params
      ),
      sanityClient.fetch(`count(*[${filter}])`, params),
    ]);

    return NextResponse.json({ logs: logs || [], total: total || 0, page, limit });
  } catch (err) {
    console.error('[Admin Logs]', err);
    return NextResponse.json({ error: 'Failed to fetch logs.' }, { status: 500 });
  }
}
