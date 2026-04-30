import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';

    let filter = `_type == "adminResource"`;
    const params: Record<string, string> = {};

    // Visibility filter
    if (session.role === 'employee') {
      filter += ` && visibleTo == "all"`;
    } else if (session.role === 'admin') {
      filter += ` && visibleTo in ["all", "admin"]`;
    }
    // super_admin sees everything

    if (category) { filter += ` && category == $category`; params.category = category; }

    const resources = await sanityClient.fetch(
      `*[${filter}] | order(createdAt desc){
        _id, title, description, category, fileUrl, fileName, fileSize,
        externalLink, uploadedByName, visibleTo, createdAt
      }`, params
    );
    return NextResponse.json({ resources: resources || [] });
  } catch (err) {
    console.error('[Resources GET]', err);
    return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Admin+ only.' }, { status: 403 });
  }

  try {
    const { title, description, category, fileUrl, fileName, fileSize, externalLink, visibleTo } = await req.json();
    if (!title) return NextResponse.json({ error: 'Title required.' }, { status: 400 });

    const doc = await sanityWriteClient.create({
      _type: 'adminResource',
      title, description, category: category || 'guide',
      fileUrl: fileUrl || null, fileName: fileName || null, fileSize: fileSize || null,
      externalLink: externalLink || null,
      visibleTo: visibleTo || 'all',
      uploadedBy: session.employeeId,
      uploadedByName: session.name,
      createdAt: new Date().toISOString(),
    });

    logAction(session, {
      action: 'RESOURCE_CREATE', entity: 'adminResource', entityId: doc._id,
      details: `Uploaded: ${title}`,
    });

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[Resources POST]', err);
    return NextResponse.json({ error: 'Failed to create.' }, { status: 500 });
  }
}
