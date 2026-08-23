'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTree,
  Tags,
  ShoppingBag,
  Package,
  Settings,
  Users,
  LogOut,
  ClipboardList,
  Wallet,
  Star,
  UserCheck,
  Handshake,
  Ticket,
  Newspaper,
  Menu,
  X,
  PackageCheck,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

interface AdminSidebarProps {
  showServices: boolean;
}

export function AdminSidebar({ showServices }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Hamburger Button & Header */}
      <div className="md:hidden p-4 flex items-center justify-between border-b border-border/50 bg-background sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
            Gardenia Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border/50 flex flex-col shadow-sm transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-border/50 flex items-center justify-between gap-2">
          <Link href="/admin" className="flex items-center gap-2" onClick={closeSidebar}>
            <div className="bg-primary/20 p-2 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent hidden md:inline">
              Gardenia Admin
            </span>
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <Link href="/admin" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog</p>
          </div>
          <Link href="/admin/category-types" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/category-types' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <ListTree className="mr-3 h-5 w-5" />
              Category Types
            </Button>
          </Link>
          <Link href="/admin/categories" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/categories' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Tags className="mr-3 h-5 w-5" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/products" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/products' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Package className="mr-3 h-5 w-5" />
              Products
            </Button>
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders</p>
          </div>
          <Link href="/admin/orders" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/orders' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <ClipboardList className="mr-3 h-5 w-5" />
              Orders
            </Button>
          </Link>
          <Link href="/admin/revenue" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/revenue' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Wallet className="mr-3 h-5 w-5" />
              Revenue & Payments
            </Button>
          </Link>
          <Link href="/admin/coupons" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/coupons' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Ticket className="mr-3 h-5 w-5" />
              Coupons
            </Button>
          </Link>
          <Link href="/admin/reviews" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/reviews' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Star className="mr-3 h-5 w-5" />
              Reviews
            </Button>
          </Link>
          <Link href="/admin/blog" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/blog' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Newspaper className="mr-3 h-5 w-5" />
              Blog
            </Button>
          </Link>

          {showServices && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gardener Services</p>
              </div>
              <Link href="/admin/gardener-verifications" onClick={closeSidebar}>
                <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/gardener-verifications' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
                  <UserCheck className="mr-3 h-5 w-5" />
                  Gardener Verifications
                </Button>
              </Link>
              <Link href="/admin/service-requests" onClick={closeSidebar}>
                <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/service-requests' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Handshake className="mr-3 h-5 w-5" />
                  Service Requests
                </Button>
              </Link>
              <Link href="/admin/subscription-packages" onClick={closeSidebar}>
                <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/subscription-packages' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
                  <PackageCheck className="mr-3 h-5 w-5" />
                  Subscription Packages
                </Button>
              </Link>
              <Link href="/admin/commission-ledger" onClick={closeSidebar}>
                <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/commission-ledger' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Receipt className="mr-3 h-5 w-5" />
                  Commission Ledger
                </Button>
              </Link>
            </>
          )}

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users & Settings</p>
          </div>
          <Link href="/admin/users" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/users' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Users className="mr-3 h-5 w-5" />
              Users
            </Button>
          </Link>
          <Link href="/admin/settings" onClick={closeSidebar}>
            <Button variant="ghost" className={`w-full justify-start ${pathname === '/admin/settings' ? 'bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-border/50">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start text-muted-foreground">
              <LogOut className="mr-3 h-4 w-4" />
              Exit Admin
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
