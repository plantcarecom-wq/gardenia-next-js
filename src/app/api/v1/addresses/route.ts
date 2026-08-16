import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { AddressModel } from '@/modules/users/infrastructure/address.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';

const createAddressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing in session' }, { status: 401 });
    }

    await connectDB();
    const addresses = await AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: addresses });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing in session' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createAddressSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    if (parsed.data.isDefault) {
      await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
    } else {
      const existingCount = await AddressModel.countDocuments({ userId });
      if (existingCount === 0) {
        parsed.data.isDefault = true;
      }
    }

    const newAddress = await AddressModel.create({
      ...parsed.data,
      userId,
    });

    return NextResponse.json({ success: true, data: newAddress }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
