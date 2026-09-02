import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { MediaModel } from '@/modules/media/infrastructure/media.model';
import { getMediaStorageProvider } from '@/modules/media/infrastructure/media-storage.factory';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
// Only plain, single-segment folder names — blocks path traversal
// (`../`), absolute paths, and null bytes reaching the storage provider.
const SAFE_FOLDER = /^[a-zA-Z0-9_-]+$/;

/**
 * Sniffs the file's actual type from its magic bytes rather than trusting
 * the client-supplied Content-Type, which is trivially spoofable (e.g. an
 * HTML/script payload declared as image/png).
 */
function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a')) {
    return 'image/gif';
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  return null;
}

/**
 * POST /api/v1/media/upload
 * Upload a file. Auth required, size/type validated.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (folder && !SAFE_FOLDER.test(folder)) {
      return NextResponse.json({ success: false, error: 'Invalid folder name' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    await connectDB();
    const buffer = Buffer.from(await file.arrayBuffer());

    const sniffedType = sniffMimeType(buffer);
    if (!sniffedType || !ALLOWED_TYPES.includes(sniffedType)) {
      return NextResponse.json({ success: false, error: 'File content does not match an allowed type' }, { status: 400 });
    }

    const provider = getMediaStorageProvider();
    const result = await provider.upload({
      buffer,
      filename: file.name,
      mimeType: sniffedType,
      folder,
    });

    const media = await MediaModel.create({
      provider: provider.key,
      publicId: result.publicId,
      url: result.url,
      mimeType: sniffedType,
      size: result.bytes || file.size,
      width: result.width,
      height: result.height,
      uploadedBy: auth.user?.id,
    });

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
