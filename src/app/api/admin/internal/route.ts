import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    let filter = `_type == "internalReport"`;
    const params: Record<string, string> = {};

    if (session.role === 'employee') {
      filter += ` && submittedBy == $empId`;
      params.empId = session.employeeId;
    }
    if (status) { filter += ` && status == $status`; params.status = status; }
    if (type) { filter += ` && type == $type`; params.type = type; }

    const reports = await sanityClient.fetch(
      `*[${filter}] | order(createdAt desc){
        _id, title, type, priority, status, submittedByName, submittedBy,
        responseNote, resolvedByName, createdAt, resolvedAt
      }`, params
    );
    return NextResponse.json({ reports: reports || [] });
  } catch (err) {
    console.error('[Internal GET]', err);
    return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, type, description, priority } = await req.json();
    if (!title || !description) return NextResponse.json({ error: 'Title and description required.' }, { status: 400 });

    const doc = await sanityWriteClient.create({
      _type: 'internalReport',
      title, type: type || 'issue',
      description, priority: priority || 'medium',
      status: 'open',
      submittedBy: session.employeeId,
      submittedByName: session.name,
      createdAt: new Date().toISOString(),
    });

    logAction(session, {
      action: 'INTERNAL_REPORT_CREATE', entity: 'internalReport', entityId: doc._id,
      details: `${type || 'issue'}: ${title}`,
    });

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[Internal POST]', err);
    return NextResponse.json({ error: 'Failed to submit.' }, { status: 500 });
  }
}
