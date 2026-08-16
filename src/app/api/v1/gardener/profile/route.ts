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
import { getSiteKycRegion } from '@/shared/lib/get-site-kyc-region';
import { z } from 'zod';

const baseFields = {
  bio: z.string().optional(),
  serviceAreaCities: z.array(z.string()).min(1),
  experienceYears: z.number().min(0),
  cvMediaId: z.string().min(1, 'Please upload your CV'),
  licenseNumber: z.string().trim().optional(),
};

const pakistanSchema = z.object({
  ...baseFields,
  cnicNumber: z
    .string()
    .trim()
    .regex(/^\d{5}-\d{7}-\d$/, 'CNIC must be in the format 12345-1234567-1'),
  cnicFrontMediaId: z.string().min(1, 'Please upload the front of your CNIC'),
  cnicBackMediaId: z.string().min(1, 'Please upload the back of your CNIC'),
});

const europeSchema = z.object({
  ...baseFields,
  nationalIdNumber: z.string().trim().min(3, 'Please provide your national ID or passport number'),
  idDocumentMediaId: z.string().min(1, 'Please upload your national ID or passport'),
  taxId: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const profile = await GardenerProfileModel.findOne({ userId: auth.user?.id })
      .populate('cvMediaId', 'url mimeType')
      .populate('cnicFrontMediaId', 'url mimeType')
      .populate('cnicBackMediaId', 'url mimeType')
      .populate('idDocumentMediaId', 'url mimeType')
      .lean();

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    // The active KYC region is decided by the site-wide setting, not by
    // whatever the client happens to send — otherwise a stale form (open
    // before an admin flips the region) could submit data validated
    // against the wrong region's rules.
    const kycRegion = await getSiteKycRegion();
    const schema = kycRegion === 'europe' ? europeSchema : pakistanSchema;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    await connectDB();

    let profile = await GardenerProfileModel.findOne({ userId: auth.user?.id });

    if (profile) {
      // Update existing profile (can only update if not already approved, or re-submitting)
      Object.assign(profile, parsed.data);
      profile.kycRegion = kycRegion;
      // Clear out fields specific to the other region so a resubmission
      // under a new region doesn't leave stale data from the old one.
      if (kycRegion === 'pakistan') {
        profile.nationalIdNumber = undefined;
        profile.idDocumentMediaId = undefined;
        profile.taxId = undefined;
      } else {
        profile.cnicNumber = undefined;
        profile.cnicFrontMediaId = undefined;
        profile.cnicBackMediaId = undefined;
      }
      if (profile.verificationStatus === 'rejected') {
        profile.verificationStatus = 'pending';
      }
      await profile.save();
    } else {
      // Create new profile
      profile = await GardenerProfileModel.create({
        userId: auth.user?.id,
        ...parsed.data,
        kycRegion,
        verificationStatus: 'pending',
      });
    }

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
