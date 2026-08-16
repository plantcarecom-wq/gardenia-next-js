import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { SiteSettingModel } from '@/modules/settings/infrastructure/site-setting.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { SUPPORTED_CURRENCIES } from '@/shared/lib/format-price';
import { KYC_REGIONS } from '@/shared/lib/kyc';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const settings = await SiteSettingModel.find().lean();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

const updateSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    // baseCurrency feeds Intl.NumberFormat on every price-rendering page
    // (formatPrice); an invalid code throws a RangeError there, which would
    // 500 the entire storefront. Restrict it to the supported set.
    if (
      parsed.data.key === 'baseCurrency' &&
      !SUPPORTED_CURRENCIES.includes(parsed.data.value)
    ) {
      return NextResponse.json(
        { success: false, error: `Unsupported currency. Must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    // kycRegion decides which Zod schema the Gardener application form
    // validates against server-side (src/app/api/v1/gardener/profile) — an
    // unrecognized value would silently fall through to the Pakistan schema
    // there, so reject anything outside the known set here instead.
    if (
      parsed.data.key === 'kycRegion' &&
      !KYC_REGIONS.includes(parsed.data.value)
    ) {
      return NextResponse.json(
        { success: false, error: `Unsupported KYC region. Must be one of: ${KYC_REGIONS.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const setting = await SiteSettingModel.findOneAndUpdate(
      { key: parsed.data.key },
      { value: parsed.data.value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: setting });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
