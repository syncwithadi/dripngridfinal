import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const landingDir = path.join(process.cwd(), 'public', 'images', 'landing');
    const files = fs.readdirSync(landingDir);

    const images = files
      .filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f))
      .sort() // alphabetical order so naming like "1.png, 2.png" controls sequence
      .map(f => `/images/landing/${encodeURIComponent(f)}`);

    return NextResponse.json({ images });
  } catch {
    // Fallback if folder doesn't exist yet
    return NextResponse.json({ images: [] });
  }
}
