import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/shared/lib/db';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { auth } from '@/shared/lib/auth';
import { sendEmail } from '@/shared/lib/mailer';
import { env } from '@/config/env';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as { id?: string }).id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      html: `<p>Hi ${user.name},</p><p>Please verify your email address:</p><p><a href="${env.APP_URL}/verify-email?token=${emailVerifyToken}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
      text: `Verify your email: ${env.APP_URL}/verify-email?token=${emailVerifyToken} (expires in 24 hours)`,
    });

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
