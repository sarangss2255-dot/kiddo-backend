import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../constants/roles.js';

const accessTokenExpiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'];
const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'];

export function createAccessToken(payload: { sub: string; role: Role; familyId?: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: accessTokenExpiresIn,
  });
}

export function createRefreshToken(payload: { sub: string; role: Role; familyId?: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiresIn,
  });
}
