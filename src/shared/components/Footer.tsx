import Link from 'next/link';
import { Leaf, Mail } from 'lucide-react';
import { auth } from '@/shared/lib/auth';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { env } from '@/config/env';
import { roleHomePath } from '@/shared/lib/role-home';
import { Roles } from '@/shared/types/roles';

export async function Footer() {
  const session = await auth();
  const showServices = isServicesModuleEnabled();
  const year = new Date().getFullYear();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = roleHomePath(role, showServices);
  const isCustomer = role === Roles.CUSTOMER;

  return (
    <footer className="w-full border-t border-border/40 bg-muted/20 mt-auto">
      <div className="container mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              Gardenia
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Premium plants, pots, and gardening care{showServices ? ' — plus trusted local Gardener services' : ''}, delivered across Pakistan.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">All Plants</Link></li>
            {showServices && (
              <li><Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors">Gardening Services</Link></li>
            )}
            <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Plant Care Guides</Link></li>
            <li><Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Account</h3>
          <ul className="space-y-2 text-sm">
            {session ? (
              <>
                <li><Link href={dashboardHref} className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                {isCustomer && (
                  <li><Link href="/dashboard/orders" className="text-muted-foreground hover:text-foreground transition-colors">Order History</Link></li>
                )}
                {showServices && isCustomer && (
                  <li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Sell as a Gardener</Link></li>
                )}
              </>
            ) : (
              <>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Log in</Link></li>
                <li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Create account</Link></li>
                {showServices && (
                  <li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Sell as a Gardener</Link></li>
                )}
              </>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`mailto:support@${env.APP_NAME}.pk`} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> support@{env.APP_NAME}.pk
              </a>
            </li>
            <li><Link href="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">Reset password</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="container mx-auto px-4 py-5 flex flex-col gap-3">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs">
            <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</Link>
            <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/legal/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">Refund & Cancellation</Link>
            <Link href="/legal/shipping-policy" className="text-muted-foreground hover:text-foreground transition-colors">Shipping & Delivery</Link>
            {showServices && (
              <Link href="/legal/gardener-agreement" className="text-muted-foreground hover:text-foreground transition-colors">Gardener Agreement</Link>
            )}
          </nav>
          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {year} Gardenia. All rights reserved.</span>
            <span>Made for plant lovers in Pakistan.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
