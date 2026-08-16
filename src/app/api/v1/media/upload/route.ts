import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { MediaModel } from '@/modules/media/infrastructure/media.model';
import { getMediaStorageProvider } from '@/modules/media/infrastructure/media-storage.factory';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    await connectDB();
    const provider = getMediaStorageProvider();
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await provider.upload({
      buffer,
      filename: file.name,
      mimeType: file.type,
      folder,
    });

    const media = await MediaModel.create({
      provider: provider.key,
      publicId: result.publicId,
      url: result.url,
      mimeType: file.type,
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
