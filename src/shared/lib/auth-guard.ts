import { auth } from '@/shared/lib/auth';
import { NextResponse } from 'next/server';
import { Role } from '@/shared/types/roles';

export const requireRole = async (allowedRoles: Role[]) => {
  const session = await auth();
  
  if (!session || !session.user) {
    return { authorized: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const userRole = (session.user as { role?: string }).role as Role;
  
  if (!allowedRoles.includes(userRole)) {
    return { authorized: false, response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { authorized: true, user: session.user };
};

