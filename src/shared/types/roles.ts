export const Roles = {
  CUSTOMER: 'customer',
  GARDENER: 'gardener',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = typeof Roles[keyof typeof Roles];
