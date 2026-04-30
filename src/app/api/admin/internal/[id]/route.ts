import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) return NextResponse.json({ error: 'Admin+ only.' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  try {
    // Fetch current report to get submitter for notification
    const existing = await sanityClient.fetch(
      `*[_type == "internalReport" && _id == $id][0]{ submittedBy, submittedByName, title }`,
      { id }
    );

    const patch: Record<string, any> = {};
    if (body.status) patch.status = body.status;
    if (body.responseNote !== undefined) patch.responseNote = body.responseNote;
    if (body.status === 'resolved') {
      patch.resolvedBy = session.employeeId;
      patch.resolvedByName = session.name;
      patch.resolvedAt = new Date().toISOString();
    }

    await sanityWriteClient.patch(id).set(patch).commit();

    // Notify the submitter if a response was given or report was resolved
    const shouldNotify = existing?.submittedBy &&
      (body.status === 'resolved' || body.responseNote);

    logAndTriggerEvent(session, {
      action: 'INTERNAL_REPORT_UPDATE', entity: 'internalReport', entityId: id,
      details: `Status → ${body.status || 'updated'}`,
      notify: shouldNotify ? {
        recipientId: existing.submittedBy,
        type: 'report_resolved',
        title: body.status === 'resolved'
          ? `✅ Your report has been resolved`
          : `💬 Response added to your report`,
        message: body.status === 'resolved'
          ? `"${existing.title}" was marked as resolved by ${session.name}.`
          : `${session.name} responded to "${existing.title}".${
              body.responseNote ? ` Note: ${body.responseNote}` : ''
            }`,
        link: '/admin/internal',
      } : undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Internal PATCH]', err);
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
  }
}
