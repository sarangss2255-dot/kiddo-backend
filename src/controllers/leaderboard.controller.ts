import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as leaderboardService from '../services/leaderboard.service.js';

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { school, type } = req.query;
  
  if (type === 'global') {
    const data = await leaderboardService.getGlobalLeaderboard();
    return res.status(StatusCodes.OK).json(data);
  }

  if (type === 'school' && typeof school === 'string') {
    const data = await leaderboardService.getSchoolLeaderboard(school);
    return res.status(StatusCodes.OK).json(data);
  }

  const data = await leaderboardService.getLeaderboard(req.user!.familyId!, school as string);
  res.status(StatusCodes.OK).json(data);
});
