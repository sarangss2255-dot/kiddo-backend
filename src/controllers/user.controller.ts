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
  const update: Record<string, any> = {};

  if (typeof req.body?.firstName === 'string' && req.body.firstName.trim().length > 0) {
    update.firstName = req.body.firstName.trim();
  }
  if (typeof req.body?.lastName === 'string') {
    update.lastName = req.body.lastName.trim();
  }
  if (typeof req.body?.avatar === 'string' && req.body.avatar.trim().length > 0) {
    update.avatar = req.body.avatar.trim();
  }
  if (typeof req.body?.school === 'string') {
    update.school = req.body.school.trim();
  }
  if (typeof req.body?.notificationToken === 'string' && req.body.notificationToken.trim().length > 0) {
    update.notificationToken = req.body.notificationToken.trim();
  }
  if (typeof req.body?.gender === 'string' && ['male', 'female', 'other'].includes(req.body.gender)) {
    update.gender = req.body.gender;
  }
  if (typeof req.body?.settings === 'object' && req.body.settings !== null) {
    // Nested update for settings
    const settings = req.body.settings;
    for (const key in settings) {
      update[`settings.${key}`] = settings[key];
    }
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No update fields provided');
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: update },
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
  const standard = typeof req.body?.standard === 'number' && Number.isInteger(req.body.standard)
    ? req.body.standard
    : undefined;
  const school = typeof req.body?.school === 'string' ? req.body.school.trim() : undefined;

  if (firstName != null && firstName.length > 0) {
    child.firstName = firstName;
  }

  if (lastName != null) {
    child.lastName = lastName;
  }

  if (school != null) {
    child.school = school;
  }

  if (username != null && username.length > 0) {
    child.username = username;
  }

  if (avatar != null && avatar.length > 0) {
    child.avatar = avatar;
  }

  if (standard != null && standard >= 1 && standard <= 12) {
    child.standard = standard;
  }

  if (isActive != null) {
    child.isActive = isActive;
  }

  if (req.body.childLoginCode != null && req.body.childLoginCode.length >= 4) {
    child.childLoginCode = req.body.childLoginCode.toString().toUpperCase();
  }

  if (typeof req.body?.settings === 'object' && req.body.settings !== null) {
    // Deep merge settings to ensure no data loss
    const currentSettings = child.toObject().settings || {};
    child.settings = { ...currentSettings, ...req.body.settings };
    child.markModified('settings');
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

export const claimScroll = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const now = new Date();
  const lastScroll = user.lastScrollAt;
  if (lastScroll && lastScroll.toDateString() === now.toDateString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You have already read your magic scroll today!');
  }

  user.points += 20;
  user.xp += 100;
  user.lastScrollAt = now;
  await user.save();

  await Activity.create({
    familyId: req.user!.familyId,
    actorId: req.user!.id,
    type: 'game_reward_claimed',
    message: 'Unlocked the Daily Magic Scroll! ✨ (+20 pts, +100 XP)',
  });

  res.status(StatusCodes.OK).json(user);
});

export const logBrainBreak = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  // Award skill XP (Kindness for mindfulness)
  if (!user.skillXP) user.skillXP = { intelligence: 0, strength: 0, kindness: 0 };
  user.skillXP.kindness += 20;
  user.xp += 20;
  await user.save();

  await Activity.create({
    familyId: req.user!.familyId,
    actorId: req.user!.id,
    type: 'game_reward_claimed',
    message: 'Completed a Brain Break mindfulness exercise! 🧘‍♂️ (+20 Kindness XP)',
  });

  res.status(StatusCodes.OK).json(user);
});

export const regenerateChildCode = asyncHandler(async (req: Request, res: Response) => {
  const child = await authService.regenerateChildCode(getParam(req.params.userId), req.user!.familyId!);
  res.status(StatusCodes.OK).json(child.toObject());
});
