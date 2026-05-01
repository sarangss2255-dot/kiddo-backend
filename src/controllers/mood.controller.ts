import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as moodService from '../services/mood.service.js';

export const logMood = asyncHandler(async (req: Request, res: Response) => {
  const mood = await moodService.logMood(req.user!.id, req.user!.familyId!, req.body);
  res.status(StatusCodes.CREATED).json(mood);
});

export const getMyMoodHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await moodService.getMoodHistory(req.user!.id);
  res.status(StatusCodes.OK).json(history);
});

export const getFamilyMoods = asyncHandler(async (req: Request, res: Response) => {
  const moods = await moodService.getFamilyMoods(req.user!.familyId!);
  res.status(StatusCodes.OK).json(moods);
});
