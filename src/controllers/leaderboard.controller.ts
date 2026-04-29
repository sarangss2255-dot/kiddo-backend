import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { getLeaderboard } from '../services/leaderboard.service.js';

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await getLeaderboard(req.user!.familyId!);
  res.status(StatusCodes.OK).json(data);
});
