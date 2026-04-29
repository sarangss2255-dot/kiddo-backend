import type { Role } from '../constants/roles.js';

export interface AuthUser {
  id: string;
  role: Role;
  familyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
