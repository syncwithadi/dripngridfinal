import { NextResponse } from 'next/server';
import { sanityClient } from '@/sanity/client';
import { siteSettingsQuery } from '@/sanity/queries';

export const revalidate = 60;

export async function GET() {
  try {
    const settings = await sanityClient.fetch(siteSettingsQuery) ?? {};
    return NextResponse.json({
      brandLogo: settings.brandLogo ?? null,
      logoWidth: settings.logoWidth ?? 140,
      siteName: settings.siteName ?? 'DRIPNGRID',
    });
  } catch {
    return NextResponse.json({ brandLogo: null, logoWidth: 140, siteName: 'DRIPNGRID' });
  }
}
