import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploads = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploads, { recursive: true });

  const safeName = Date.now() + '-' + (file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'video.mp4');
  const filepath = join(uploads, safeName);

  await writeFile(filepath, buffer);
  return NextResponse.json({ url: `/uploads/${safeName}` });
}
