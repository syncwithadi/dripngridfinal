import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    let filter = `_type == "adminTask"`;
    const params: Record<string, string> = {};

    // Employees see tasks assigned to them
    if (session.role === 'employee') {
      filter += ` && assignedTo == $empId`;
      params.empId = session.employeeId;
    }
    if (status) { filter += ` && status == $status`; params.status = status; }

    const tasks = await sanityClient.fetch(
      `*[${filter}] | order(createdAt desc){
        _id, title, description, status, priority, assignedTo, assignedToName,
        assignedBy, assignedByName, deadline, completedAt, linkedEntity, linkedEntityId, createdAt
      }`, params
    );
    return NextResponse.json({ tasks: tasks || [] });
  } catch (err) {
    console.error('[Tasks GET]', err);
    return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Only Admin+ can create tasks.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, priority, assignedTo, assignedToName, deadline, linkedEntity, linkedEntityId } = body;

    if (!title || !assignedTo) return NextResponse.json({ error: 'Title and assignee required.' }, { status: 400 });

    const doc = await sanityWriteClient.create({
      _type: 'adminTask',
      title, description, priority: priority || 'medium',
      assignedTo, assignedToName: assignedToName || assignedTo,
      assignedBy: session.employeeId, assignedByName: session.name,
      status: 'todo',
      deadline: deadline || null,
      linkedEntity: linkedEntity || null,
      linkedEntityId: linkedEntityId || null,
      createdAt: new Date().toISOString(),
    });

    // Fire event log + notify the assignee (fire-and-forget)
    logAndTriggerEvent(session, {
      action: 'TASK_CREATE', entity: 'adminTask', entityId: doc._id,
      details: `Assigned "${title}" to ${assignedToName || assignedTo}`,
      notify: {
        recipientId: assignedTo,
        type: 'task_assigned',
        title: `📋 New task assigned to you`,
        message: `"${title}" was assigned to you by ${session.name}.${
          priority === 'high' ? ' ⚠ High priority.' : ''
        }`,
        link: '/admin/tasks',
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[Tasks POST]', err);
    return NextResponse.json({ error: 'Failed to create.' }, { status: 500 });
  }
}
