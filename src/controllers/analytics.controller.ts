import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as analyticsService from '../services/analytics.service.js';
import { ApiError } from '../utils/api-error.js';

export const getFamilyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.familyId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not belong to a family');
  }

  const analytics = await analyticsService.getFamilyAnalytics(req.user.familyId);
  res.status(StatusCodes.OK).json(analytics);
});
