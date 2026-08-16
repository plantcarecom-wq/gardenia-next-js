'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/gardener', label: 'My Profile' },
  { href: '/gardener/offerings', label: 'My Services' },
  { href: '/gardener/requests', label: 'Requests' },
];

export function GardenerSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
      {links.map((link) => {
        const active = link.href === '/gardener' ? pathname === '/gardener' : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
