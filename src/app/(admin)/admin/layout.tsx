import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { redirect } from 'next/navigation';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { AdminSidebar } from './_components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireRole([Roles.SUPER_ADMIN]);
  if (!auth.authorized) {
    redirect('/');
  }

  const showServices = isServicesModuleEnabled();

  return (
    <div className="flex h-screen bg-muted/20 flex-col md:flex-row">
      <AdminSidebar showServices={showServices} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
        {children}
      </main>
    </div>
  );
}
