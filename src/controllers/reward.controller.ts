import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as rewardService from '../services/reward.service.js';

export const listRewards = asyncHandler(async (req: Request, res: Response) => {
  const rewards = await rewardService.listRewards(req.user!.familyId!, req.user!.id, req.user!.role);
  res.status(StatusCodes.OK).json(rewards);
});

export const createReward = asyncHandler(async (req: Request, res: Response) => {
  const reward = await rewardService.createReward(req.user!.familyId!, req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(reward);
});

export const redeemReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardService.redeemReward(req.params.rewardId, req.user!.id, req.user!.familyId!);
  res.status(StatusCodes.OK).json(result);
});

export const updateReward = asyncHandler(async (req: Request, res: Response) => {
  const reward = await rewardService.updateReward(
    req.params.rewardId,
    req.user!.familyId!,
    req.user!.id,
    req.body,
  );
  res.status(StatusCodes.OK).json(reward);
});

export const deleteReward = asyncHandler(async (req: Request, res: Response) => {
  await rewardService.deleteReward(req.params.rewardId, req.user!.familyId!, req.user!.id);
  res.status(StatusCodes.OK).json({ success: true });
});
