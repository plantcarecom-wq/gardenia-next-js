import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import '@/modules/users/infrastructure/user.model';

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    await connectDB();

    const requests = await ServiceRequestModel.find({ commissionSettlementStatus: { $exists: true } })
      .populate('assignedGardenerId', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const byGardener = new Map<string, {
      gardenerId: string;
      gardenerName: string;
      pendingTotal: number;
      settledTotal: number;
      waivedTotal: number;
    }>();

    for (const r of requests) {
      const gardener = r.assignedGardenerId as unknown as { _id: string; name: string } | undefined;
      const gardenerId = gardener?._id ? String(gardener._id) : 'unknown';
      const entry = byGardener.get(gardenerId) ?? {
        gardenerId,
        gardenerName: gardener?.name ?? 'Unknown',
        pendingTotal: 0,
        settledTotal: 0,
        waivedTotal: 0,
      };
      const amount = r.platformCommissionAmount ?? 0;
      if (r.commissionSettlementStatus === 'PENDING') entry.pendingTotal += amount;
      else if (r.commissionSettlementStatus === 'SETTLED') entry.settledTotal += amount;
      else if (r.commissionSettlementStatus === 'WAIVED') entry.waivedTotal += amount;
      byGardener.set(gardenerId, entry);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: Array.from(byGardener.values()),
        requests,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
