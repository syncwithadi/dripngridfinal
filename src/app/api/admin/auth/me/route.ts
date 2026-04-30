import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await sanityClient.fetch(
      `*[_type == "adminUser" && _id == $id && active == true][0]{
        sessionVersion, active, mustChangePassword, name,
        "profileImage": profileImage.asset->url,
        department, internalTitle, phone,
        lastLogin, lastLoginIP
      }`,
      { id: session.sub }
    );

    if (!user) {
      return NextResponse.json({ error: 'Account disabled or not found.' }, { status: 401 });
    }

    const dbVersion = user.sessionVersion ?? 1;
    const tokenVersion = session.sv ?? 1;

    if (tokenVersion < dbVersion) {
      return NextResponse.json({ error: 'Session terminated. Please log in again.' }, { status: 401 });
    }

    return NextResponse.json({
      employeeId: session.employeeId,
      name: user.name || session.name,
      role: session.role,
      email: session.email,
      mustChangePassword: user.mustChangePassword || false,
      profileImage: user.profileImage || null,
      department: user.department || null,
      internalTitle: user.internalTitle || null,
      phone: user.phone || null,
      lastLogin: user.lastLogin || null,
      lastLoginIP: user.lastLoginIP || null,
    });
  } catch (err) {
    console.error('[Admin Me]', err);
    return NextResponse.json({
      employeeId: session.employeeId,
      name: session.name,
      role: session.role,
      email: session.email,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    const patch: any = {};
    if (name && name.trim().length > 0) patch.name = name.trim();

    // New staff fields
    const department = formData.get('department') as string | null;
    const internalTitle = formData.get('internalTitle') as string | null;
    const phone = formData.get('phone') as string | null;
    if (department !== null) patch.department = department.trim();
    if (internalTitle !== null) patch.internalTitle = internalTitle.trim();
    if (phone !== null) patch.phone = phone.trim();

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const asset = await sanityWriteClient.assets.upload('image', buffer, {
        filename: file.name,
        contentType: file.type,
      });
      patch.profileImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      };
    }

    if (Object.keys(patch).length > 0) {
      await sanityWriteClient.patch(session.sub).set(patch).commit();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Me PATCH]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
