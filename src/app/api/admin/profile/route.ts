import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const patch: Record<string, any> = {};
    const details: string[] = [];

    // Allow members to update their own profile details
    if (body.name) { patch.name = body.name; details.push(`name=${body.name}`); }
    if (body.department !== undefined) { patch.department = body.department; details.push(`dept=${body.department}`); }
    if (body.internalTitle !== undefined) { patch.internalTitle = body.internalTitle; details.push(`title=${body.internalTitle}`); }
    if (body.phone !== undefined) { patch.phone = body.phone; details.push(`phone=${body.phone}`); }
    if (body.profileImageBase64) {
      const buffer = Buffer.from(body.profileImageBase64, 'base64');
      const asset = await sanityWriteClient.assets.upload('image', buffer, { filename: 'profile.jpg' });
      patch.profileImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
      details.push('profileImage');
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 });
    }

    await sanityWriteClient.patch(session.sub).set(patch).commit();
    await logAction(session, { action: 'USER_UPDATE', details: `Updated own profile: ${details.join(', ')}` });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin Profile PATCH]', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
