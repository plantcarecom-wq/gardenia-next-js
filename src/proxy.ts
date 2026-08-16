import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/shared/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect specific route groups
  const isCustomerRoute = pathname.startsWith('/dashboard');
  const isGardenerRoute = pathname.startsWith('/gardener');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isCustomerRoute || isGardenerRoute || isAdminRoute) {
    const session = await auth();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = (session.user as { role?: string }).role;
    
    if (isAdminRoute && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (isGardenerRoute && role !== 'gardener' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

