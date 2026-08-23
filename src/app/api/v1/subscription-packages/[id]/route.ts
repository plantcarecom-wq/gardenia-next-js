import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { SubscriptionPackageModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { normalizeCategoryCode } from '@/modules/catalog/domain/category.utils';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  platformItemDiscountPercent: z.number().min(0).max(100).optional(),
  perks: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.name) {
      updateData.packageCode = normalizeCategoryCode(parsed.data.name);
      const existing = await SubscriptionPackageModel.findOne({ packageCode: updateData.packageCode, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'A package with this code already exists' }, { status: 409 });
      }
    }

    const updated = await SubscriptionPackageModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
