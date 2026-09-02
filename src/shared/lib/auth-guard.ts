import { auth } from '@/shared/lib/auth';
import { NextResponse } from 'next/server';
import { Role } from '@/shared/types/roles';

export const requireRole = async (allowedRoles: Role[]) => {
  const session = await auth();
  
  if (!session || !session.user) {
    return { authorized: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = session.user as { role?: string; status?: string };

  // Session status is refreshed from the DB on a short interval (see
  // auth.ts) but the JWT itself can still be up to that long stale, so a
  // suspended user must also be rejected here, not just at login.
  if (user.status === 'suspended') {
    return { authorized: false, response: NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 }) };
  }

  const userRole = user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    return { authorized: false, response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { authorized: true, user: session.user };
};

