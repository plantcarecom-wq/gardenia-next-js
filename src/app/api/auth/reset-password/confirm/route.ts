import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { hashPassword } from '@/shared/lib/password';
import { z } from 'zod';

const confirmSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({
      resetToken: parsed.data.token,
      resetTokenExpiry: { $gt: new Date() },
    });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);

    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
