import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { getAdminAnalytics } from '../services/analytics.service.js';
import { Task } from '../models/task.model.js';
import { Reward } from '../models/reward.model.js';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAdminAnalytics();
  res.status(StatusCodes.OK).json(analytics);
});

export const moderateTasks = asyncHandler(async (_req: Request, res: Response) => {
  const tasks = await Task.find().sort({ createdAt: -1 }).limit(50).lean();
  res.status(StatusCodes.OK).json(tasks);
});

export const moderateRewards = asyncHandler(async (_req: Request, res: Response) => {
  const rewards = await Reward.find().sort({ createdAt: -1 }).limit(50).lean();
  res.status(StatusCodes.OK).json(rewards);
});
