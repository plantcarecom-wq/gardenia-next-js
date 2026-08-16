import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({
      emailVerifyToken: parsed.data.token,
      emailVerifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification link' }, { status: 400 });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Email verified' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
