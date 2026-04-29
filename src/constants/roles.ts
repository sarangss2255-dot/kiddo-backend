export const ROLES = {
  ADMIN: 'admin',
  PARENT: 'parent',
  CHILD: 'child',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
