'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Leaf, ShoppingBag, User as UserIcon, Menu, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isServicesModuleEnabledClient } from '@/config/feature-flags';
import { Roles } from '@/shared/types/roles';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { useStore } from '@/shared/store';

export function Navbar() {
  const { data: session, status } = useSession();
  const [showServices] = useState(isServicesModuleEnabledClient());
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, fetchCart } = useStore();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === 'authenticated' && role === Roles.CUSTOMER) {
      fetchCart();
    }
  }, [status, role, fetchCart]);

  useEffect(() => {
    setMobileOpen(false);
  }, [status]);

  const dashboardHref = role === Roles.SUPER_ADMIN ? '/admin' : role === Roles.GARDENER && showServices ? '/gardener' : '/dashboard';
  const dashboardLabel = role === Roles.SUPER_ADMIN ? 'Admin Panel' : role === Roles.GARDENER && showServices ? 'Gardener Dashboard' : 'Dashboard';
  const DashboardIcon = role === Roles.SUPER_ADMIN ? ShieldCheck : UserIcon;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            Gardenia
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Shop Plants
          </Link>
          {showServices && (
            <Link href="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Gardening Services
            </Link>
          )}
          <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Plant Care Guides
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {session && <NotificationBell />}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative group">
              <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </Link>

          {status === 'loading' ? (
            <div className="hidden md:flex items-center gap-2" aria-hidden>
              <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          ) : session ? (
            <div className="hidden md:flex items-center gap-4">
              <Link href={dashboardHref}>
                <Button variant="ghost" className="flex gap-2">
                  <DashboardIcon className="h-4 w-4" />
                  {dashboardLabel}
                </Button>
              </Link>
              <Button variant="outline" onClick={() => signOut()} size="sm">
                Log out
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary text-primary-foreground shadow hover:bg-primary/90">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <Link href="/products" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
              Shop Plants
            </Link>
            {showServices && (
              <Link href="/services" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                Gardening Services
              </Link>
            )}
            <Link href="/blog" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
              Plant Care Guides
            </Link>
            <Link href="/cart" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
              Cart
            </Link>
            <div className="h-px bg-border my-2" />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <div className="h-px bg-border my-2" />
            {session ? (
              <>
                <Link href={dashboardHref} className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="py-2.5 text-sm font-medium text-left text-destructive"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="py-2.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
