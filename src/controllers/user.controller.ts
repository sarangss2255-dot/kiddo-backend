import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { ROLES } from '../constants/roles.js';
import { Activity } from '../models/activity.model.js';
import * as authService from '../services/auth.service.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const listFamilyUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ familyId: req.user!.familyId })
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json(users);
});

export const listAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.status(StatusCodes.OK).json(users);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.trim() : undefined;
  const notificationToken = typeof req.body?.notificationToken === 'string'
    ? req.body.notificationToken.trim()
    : undefined;
  if (!avatar && !notificationToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Avatar or notification token is required');
  }

  const update: Record<string, string> = {};
  if (avatar && avatar.length > 0) {
    update.avatar = avatar;
  }
  if (notificationToken && notificationToken.length > 0) {
    update.notificationToken = notificationToken;
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    update,
    { new: true },
  ).select('-passwordHash').lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  res.status(StatusCodes.OK).json(user);
});

export const registerNotificationToken = asyncHandler(async (req: Request, res: Response) => {
  const notificationToken = typeof req.body?.notificationToken === 'string'
    ? req.body.notificationToken.trim()
    : '';

  if (!notificationToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Notification token is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { notificationToken },
    { new: true },
  ).select('-passwordHash').lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  res.status(StatusCodes.OK).json({ success: true, notificationToken: user.notificationToken });
});

export const updateChild = asyncHandler(async (req: Request, res: Response) => {
  const child = await User.findOne({
    _id: getParam(req.params.userId),
    familyId: req.user!.familyId,
    role: ROLES.CHILD,
  });

  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : undefined;
  const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : undefined;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : undefined;
  const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.trim() : undefined;
  const isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined;

  if (firstName != null && firstName.length > 0) {
    child.firstName = firstName;
  }

  if (lastName != null) {
    child.lastName = lastName;
  }

  if (username != null && username.length > 0) {
    child.username = username;
  }

  if (avatar != null && avatar.length > 0) {
    child.avatar = avatar;
  }

  if (isActive != null) {
    child.isActive = isActive;
  }

  await child.save();

  await Activity.create({
    familyId: req.user!.familyId,
    actorId: req.user!.id,
    type: 'child_updated',
    message: `Updated child account for "${child.firstName}"`,
    metadata: { childId: child.id },
  });

  const updatedChild = await User.findById(child.id).select('-passwordHash').lean();
  res.status(StatusCodes.OK).json(updatedChild);
});

export const regenerateChildCode = asyncHandler(async (req: Request, res: Response) => {
  const child = await authService.regenerateChildCode(getParam(req.params.userId), req.user!.familyId!);
  res.status(StatusCodes.OK).json(child.toObject());
});
