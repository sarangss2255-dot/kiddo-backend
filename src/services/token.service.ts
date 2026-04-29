import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../constants/roles.js';

export function createAccessToken(payload: { sub: string; role: Role; familyId?: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function createRefreshToken(payload: { sub: string; role: Role; familyId?: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}
