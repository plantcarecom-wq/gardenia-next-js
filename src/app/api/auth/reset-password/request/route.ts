import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { isEmailConfigured, sendEmail } from '@/shared/lib/mailer';
import { env } from '@/config/env';
import { z } from 'zod';
import crypto from 'crypto';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: parsed.data.email });
    
    if (!user) {
      // Don't leak user existence
      return NextResponse.json({ success: true, message: 'If email exists, a reset token has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    if (isEmailConfigured()) {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Hi ${user.name},</p><p>We received a request to reset your password. This link expires in 1 hour:</p><p><a href="${env.APP_URL}/forgot-password?token=${resetToken}">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
        text: `Reset your password: ${env.APP_URL}/forgot-password?token=${resetToken} (expires in 1 hour)`,
      });
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    // No email transport configured yet. In production this must never
    // hand the token back to whoever called the endpoint (anyone can supply
    // an arbitrary email — that would be a full account-takeover oracle);
    // log it server-side for admin-assisted delivery instead. Only in
    // non-production do we echo it back, as a dev convenience.
    console.warn(`[reset-password] Email not configured — reset token for ${user.email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Email delivery is not configured yet — contact an admin to complete your password reset.'
          : 'Email delivery is not configured yet — use this token to reset your password.',
      ...(process.env.NODE_ENV === 'production' ? {} : { debug_token: resetToken }),
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
