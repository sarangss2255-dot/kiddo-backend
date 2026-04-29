import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as activityService from '../services/activity.service.js';

export const listFamilyActivity = asyncHandler(async (req: Request, res: Response) => {
  const items = await activityService.listFamilyActivity(req.user!.familyId!);
  res.status(StatusCodes.OK).json(items);
});
