import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';
// Side-effect import: registers the "Media" model so the populate() calls
// below resolve even if this route is the first code path to run in a
// fresh serverless instance.
import '@/modules/media/infrastructure/media.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const status = req.nextUrl.searchParams.get('status');

    await connectDB();

    const query = status && status !== 'all' ? { verificationStatus: status } : {};
    
    const profiles = await GardenerProfileModel.find(query)
      .populate('userId', 'name email')
      .populate('cvMediaId', 'url mimeType')
      .populate('cnicFrontMediaId', 'url mimeType')
      .populate('cnicBackMediaId', 'url mimeType')
      .populate('idDocumentMediaId', 'url mimeType')
      .populate('documentMediaIds', 'url mimeType')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
