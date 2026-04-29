import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as authService from '../services/auth.service.js';

export const registerParent = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.registerParent(req.body);
  res.status(StatusCodes.CREATED).json(payload);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.login(req.body);
  res.status(StatusCodes.OK).json(payload);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getProfile(req.user!.id);
  res.status(StatusCodes.OK).json(profile);
});

export const createChild = asyncHandler(async (req: Request, res: Response) => {
  const child = await authService.createChild(req.user!.id, req.user!.familyId!, req.body);
  res.status(StatusCodes.CREATED).json(child);
});

export const childCodeLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.childCodeLogin(req.body.code);
  res.status(StatusCodes.OK).json(payload);
});

export const googleMobileLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.googleMobileLogin(req.body.idToken);
  res.status(StatusCodes.OK).json(payload);
});
