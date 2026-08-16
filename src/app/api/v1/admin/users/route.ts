import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { userRepository } from '@/modules/users/infrastructure/UserRepository';
import { IUser } from '@/modules/users/infrastructure/user.model';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'suspended']),
});

function sanitizeUser(user: IUser) {
  const { passwordHash, resetToken, resetTokenExpiry, ...safe } = user as IUser & Record<string, unknown>;
  void passwordHash;
  void resetToken;
  void resetTokenExpiry;
  return safe;
}

export async function GET() {
  try {
    const authCheck = await requireRole([Roles.SUPER_ADMIN]);
    if (!authCheck.authorized) return authCheck.response;

    const users = await userRepository.findAll();
    const safeUsers = users.map(sanitizeUser);

    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authCheck = await requireRole([Roles.SUPER_ADMIN]);
    if (!authCheck.authorized) return authCheck.response;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    const { id, status } = parsed.data;

    const currentUserId = (authCheck.user as { id?: string })?.id;
    if (currentUserId && currentUserId === id) {
      return NextResponse.json({ success: false, error: 'You cannot change your own status' }, { status: 400 });
    }

    const updated = await userRepository.updateStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sanitizeUser(updated) });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
