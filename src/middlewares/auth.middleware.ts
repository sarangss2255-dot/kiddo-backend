import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import type { Role } from '../constants/roles.js';
import { ApiError } from '../utils/api-error.js';

interface TokenPayload {
  sub: string;
  role: Role;
  familyId?: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Missing bearer token'));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
      familyId: payload.familyId,
    };
    return next();
  } catch {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
    }

    return next();
  };
}
