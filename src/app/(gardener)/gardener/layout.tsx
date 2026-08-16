import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { redirect, notFound } from 'next/navigation';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { GardenerSidebar } from './_components/GardenerSidebar';

export default async function GardenerLayout({ children }: { children: React.ReactNode }) {
  if (!isServicesModuleEnabled()) {
    notFound();
  }

  const auth = await requireRole([Roles.GARDENER, Roles.SUPER_ADMIN]);
  if (!auth.authorized) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <aside className="w-full md:w-48 shrink-0 md:sticky md:top-20">
          <GardenerSidebar />
        </aside>
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
