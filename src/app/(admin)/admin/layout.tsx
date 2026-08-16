import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { isServicesModuleEnabled } from '@/config/feature-flags';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireRole([Roles.SUPER_ADMIN]);
  if (!auth.authorized) {
    redirect('/');
  }

  const showServices = isServicesModuleEnabled();

  return (
    <div className="flex h-screen bg-muted/20">
      <aside className="w-64 bg-background border-r border-border/50 flex flex-col shadow-sm">
        <div className="p-6 border-b border-border/50 flex items-center justify-between gap-2">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
              Gardenia Admin
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog</p>
          </div>
          <Link href="/admin/category-types">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <ListTree className="mr-3 h-5 w-5" />
              Category Types
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Tags className="mr-3 h-5 w-5" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Package className="mr-3 h-5 w-5" />
              Products
            </Button>
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <ClipboardList className="mr-3 h-5 w-5" />
              Orders
            </Button>
          </Link>
          <Link href="/admin/revenue">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Wallet className="mr-3 h-5 w-5" />
              Revenue & Payments
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Ticket className="mr-3 h-5 w-5" />
              Coupons
            </Button>
          </Link>
          <Link href="/admin/reviews">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Star className="mr-3 h-5 w-5" />
              Reviews
            </Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Newspaper className="mr-3 h-5 w-5" />
              Blog
            </Button>
          </Link>

          {showServices && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gardener Services</p>
              </div>
              <Link href="/admin/gardener-verifications">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                  <UserCheck className="mr-3 h-5 w-5" />
                  Gardener Verifications
                </Button>
              </Link>
              <Link href="/admin/service-requests">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                  <Handshake className="mr-3 h-5 w-5" />
                  Service Requests
                </Button>
              </Link>
            </>
          )}

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users & Settings</p>
          </div>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Users className="mr-3 h-5 w-5" />
              Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
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

      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
        {children}
      </main>
    </div>
  );
}
