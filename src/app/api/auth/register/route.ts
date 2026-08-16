import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { registerSchema } from '@/shared/schemas/auth.schema';
import { userRepository } from '@/modules/users/infrastructure/UserRepository';
import { hashPassword } from '@/shared/lib/password';
import { Roles } from '@/shared/types/roles';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { sendEmail } from '@/shared/lib/mailer';
import { env } from '@/config/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    const { name, email, password, phone, isGardener } = parsed.data;

    // Check if services module is disabled, gardener registration is forbidden
    if (isGardener && !isServicesModuleEnabled()) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    
    // If Gardener, status is 'pending' requiring admin approval.
    const role = isGardener ? Roles.GARDENER : Roles.CUSTOMER;
    const status = isGardener ? 'pending' : 'active';

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const newUser = await userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      role,
      status,
      emailVerified: false,
      emailVerifyToken,
      emailVerifyTokenExpiry,
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Hi ${name},</p><p>Welcome! Please verify your email address to finish setting up your account:</p><p><a href="${env.APP_URL}/verify-email?token=${emailVerifyToken}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
      text: `Verify your email: ${env.APP_URL}/verify-email?token=${emailVerifyToken} (expires in 24 hours)`,
    });

    // In a full implementation, we'd also create a GardenerProfile if role === GARDENER here

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

