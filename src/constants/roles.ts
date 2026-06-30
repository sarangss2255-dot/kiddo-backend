export const ROLES = {
  ADMIN: 'admin',
  PARENT: 'parent',
  CHILD: 'child',
  TEACHER: 'teacher',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
