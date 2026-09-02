import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { Roles } from '@/shared/types/roles';
import dayjs from 'dayjs';
import crypto from 'crypto';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Vercel Cron target per requirements.md §9.7 — but this project actually
 * deploys to Netlify (see netlify.toml), which has no equivalent to
 * vercel.json crons. This endpoint is instead invoked by a Netlify
 * Scheduled Function (netlify/functions/sweep-sla.ts) on the same schedule.
 * The CRON_SECRET check below is what actually keeps it safe to expose.
 */
export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || !provided || !timingSafeEqual(provided, secret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const slaMinutes = await getSiteSetting('gardenerResponseSlaMinutes', 60);
    const cutoff = dayjs().subtract(slaMinutes, 'minute').toDate();

    const candidates = await ServiceRequestModel.find(
      { status: 'ASSIGNED', assignedAt: { $lte: cutoff } },
      { _id: 1 }
    ).lean();

    const admins = candidates.length > 0 ? await UserModel.find({ role: Roles.SUPER_ADMIN }).lean() : [];

    let escalated = 0;
    for (const candidate of candidates) {
      try {
        // Atomic claim: the filter re-checks status/assignedAt at write
        // time, so a concurrent/overlapping sweep run can't both flip the
        // same request and send duplicate escalation notifications.
        const request = await ServiceRequestModel.findOneAndUpdate(
          { _id: candidate._id, status: 'ASSIGNED', assignedAt: { $lte: cutoff } },
          {
            $set: { status: 'PENDING_ASSIGNMENT' },
            $unset: { assignedGardenerId: '', assignedAt: '' },
            $push: {
              statusHistory: {
                status: 'PENDING_ASSIGNMENT',
                note: `Auto-escalated: no response within ${slaMinutes} minutes`,
              },
            },
          },
          { new: false }
        );
        if (!request) continue; // already claimed by another run

        escalated++;
        const missedGardenerId = request.assignedGardenerId;

        if (missedGardenerId) {
          await NotificationService.notify({
            userId: String(missedGardenerId),
            type: 'service_request_sla_missed',
            title: `Request ${request.requestNumber} reassigned`,
            body: `You didn't respond within ${slaMinutes} minutes, so this request has been reassigned.`,
            referenceType: 'service_request',
            referenceId: String(request._id),
          });
        }

        for (const admin of admins) {
          await NotificationService.notify({
            userId: String(admin._id),
            type: 'service_request_sla_escalated',
            title: `Request ${request.requestNumber} needs reassignment`,
            body: `The assigned gardener didn't respond in time. Please assign a new gardener.`,
            referenceType: 'service_request',
            referenceId: String(request._id),
          });
        }
      } catch (itemError) {
        // One bad request must not abort the whole sweep batch — log and
        // keep going so a retry doesn't redundantly reprocess ones that
        // already succeeded.
        console.error(`SLA sweep failed for request ${candidate._id}:`, itemError);
      }
    }

    return NextResponse.json({ success: true, data: { escalated } });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
