import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const task = await sanityClient.fetch(
      `*[_type == "adminTask" && _id == $id][0]{ assignedTo, assignedBy, title, status }`, { id }
    );
    if (!task) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const canEdit = canAccess(session.role, 'admin') || task.assignedTo === session.employeeId;
    if (!canEdit) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const patch: Record<string, any> = {};
    if (body.status) {
      patch.status = body.status;
      if (body.status === 'done') patch.completedAt = new Date().toISOString();
    }
    if (body.title !== undefined) patch.title = body.title;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.deadline !== undefined) patch.deadline = body.deadline;

    await sanityWriteClient.patch(id).set(patch).commit();

    // Notify task creator when assignee marks it done
    const isDone = body.status === 'done';
    const notifyCreator = isDone && task.assignedBy && task.assignedBy !== session.employeeId;

    logAndTriggerEvent(session, {
      action: 'TASK_UPDATE', entity: 'adminTask', entityId: id,
      details: `Status → ${body.status || 'updated'}`,
      notify: notifyCreator ? {
        recipientId: task.assignedBy,
        type: 'task_done',
        title: `✅ Task completed`,
        message: `"${task.title}" was marked as done by ${session.name}.`,
        link: '/admin/tasks',
      } : undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Task PATCH]', err);
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
  }
}
