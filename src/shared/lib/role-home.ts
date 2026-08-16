import { Roles } from '@/shared/types/roles';

/**
 * Where a logged-in user should land. `/dashboard` is customer-only
 * (guarded server-side), so admin/gardener accounts must never be sent
 * there — doing so bounces them straight back to /login.
 */
export function roleHomePath(role: string | undefined, showServices: boolean): string {
  if (role === Roles.SUPER_ADMIN) return '/admin';
  if (role === Roles.GARDENER && showServices) return '/gardener';
  return '/dashboard';
}
