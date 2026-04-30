import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/admin/upload
 *
 * Accepts a multipart/form-data with a single field "file".
 * Uploads the image to Sanity's asset pipeline and returns { url }.
 *
 * Auth: any authenticated admin role.
 * Max size: 8 MB. Allowed types: JPEG, PNG, WebP, GIF.
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.` },
        { status: 415 }
      );
    }

    // Size check
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.` },
        { status: 413 }
      );
    }

    // Convert File → Buffer for Sanity upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Sanity
    const asset = await sanityWriteClient.assets.upload('image', buffer, {
      filename: file.name || `upload-${Date.now()}`,
      contentType: file.type,
    });

    // Return the CDN URL
    const url = asset.url;
    return NextResponse.json({ url, assetId: asset._id });
  } catch (err: any) {
    console.error('[Admin Upload]', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
