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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let filter = `_type == "productRequest"`;
    const params: Record<string, string> = {};

    if (session.role === 'employee') {
      filter += ` && submittedBy == $empId`;
      params.empId = session.employeeId;
    }
    if (status) { filter += ` && status == $status`; params.status = status; }

    const [requests, total] = await Promise.all([
      sanityClient.fetch(
        `*[${filter}] | order(createdAt desc)[${offset}...${offset + limit}]{
          _id, title, status, submittedByName, submittedAt, createdAt,
          price, comparePrice, category, gender, badge,
          sizes, colors, description, material,
          imageAssetsJson,
          reviewNote, reviewedBy, reviewedAt, internalNotes
        }`, params),
      sanityClient.fetch(`count(*[${filter}])`, params),
    ]);

    return NextResponse.json({ requests: requests || [], total: total || 0, page, limit });
  } catch (err) {
    console.error('[ProductRequests GET]', err);
    return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title, description, category, categoryId, gender,
      price, comparePrice, badge,
      sizes, colors, material, tags, internalNotes,
      imageAssetsJson,
      submitForReview,
    } = body;

    if (!title) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });

    const doc = await sanityWriteClient.create({
      _type: 'productRequest',
      title,
      description,
      category,
      categoryId,
      gender,
      price: price ? Number(price) : undefined,
      comparePrice: comparePrice ? Number(comparePrice) : undefined,
      badge,
      sizes: sizes || [],
      colors: colors || [],
      material,
      tags,
      internalNotes,
      imageAssetsJson: imageAssetsJson || null,
      status: submitForReview ? 'pending' : 'draft',
      submittedBy: session.employeeId,
      submittedByName: session.name,
      submittedAt: submitForReview ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    });

    logAction(session, {
      action: 'PRODUCT_REQUEST_CREATE',
      entity: 'productRequest',
      entityId: doc._id,
      details: `${submitForReview ? 'Submitted for review' : 'Saved as draft'}: ${title}`,
    });

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[ProductRequests POST]', err);
    return NextResponse.json({ error: 'Failed to create.' }, { status: 500 });
  }
}
