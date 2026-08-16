import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const LEGAL_LINKS = [
  { href: '/legal/terms', label: 'Terms & Conditions' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/refund-policy', label: 'Refund & Cancellation Policy' },
  { href: '/legal/shipping-policy', label: 'Shipping & Delivery Policy' },
  { href: '/legal/gardener-agreement', label: 'Gardener Agreement' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-5xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-emerald-600 py-1.5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
