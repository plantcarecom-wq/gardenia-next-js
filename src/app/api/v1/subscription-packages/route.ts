import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { SubscriptionPackageModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { normalizeCategoryCode } from '@/modules/catalog/domain/category.utils';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  billingCycle: z.enum(['monthly', 'yearly']),
  commissionPercent: z.number().min(0).max(100),
  platformItemDiscountPercent: z.number().min(0).max(100),
  perks: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    await connectDB();
    // Admins manage the full catalog (including inactive packages);
    // everyone else (gardeners browsing to subscribe, public) sees only
    // active ones.
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    const filter = auth.authorized ? {} : { isActive: true };

    const packages = await SubscriptionPackageModel.find(filter).sort({ price: 1 }).lean();
    return NextResponse.json({ success: true, data: packages });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    // Same free-text-with-underscore, unique, dev-facing code convention as
    // categoryCode (requirements.md §5.11 / §4.2).
    const packageCode = normalizeCategoryCode(parsed.data.name);
    const existing = await SubscriptionPackageModel.findOne({ packageCode });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A package with this code already exists' }, { status: 409 });
    }

    const pkg = await SubscriptionPackageModel.create({ ...parsed.data, packageCode });
    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
