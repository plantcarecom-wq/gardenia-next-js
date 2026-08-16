'use client';

import { usePathname } from 'next/navigation';

/**
 * Hides storefront chrome (announcement bar, navbar, footer) on admin
 * routes, which have their own sidebar-based shell in (admin)/admin/layout.tsx.
 * Server components can be passed in as `children` here even though this
 * itself is a client component.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
