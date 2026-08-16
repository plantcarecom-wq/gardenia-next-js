import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { AddressModel } from '@/modules/users/infrastructure/address.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const updateAddressSchema = z.object({
  label: z.string().min(1).optional(),
  line1: z.string().min(1).optional(),
  line2: z.string().optional(),
  city: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing in session' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = updateAddressSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    
    const address = await AddressModel.findOne({ _id: id, userId });
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    if (parsed.data.isDefault) {
      await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
    }

    Object.assign(address, parsed.data);
    await address.save();

    return NextResponse.json({ success: true, data: address });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing in session' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();
    const result = await AddressModel.findOneAndDelete({ _id: id, userId });
    
    if (!result) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Address deleted' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
