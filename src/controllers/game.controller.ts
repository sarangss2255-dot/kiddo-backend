import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { rewardChessWin, rewardExtraGameWin } from '../services/game.service.js';

export const claimChessReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardChessWin(req.user!.id, req.user!.familyId, req.body?.moves);
  res.status(StatusCodes.OK).json(result);
});

export const claimMemoryReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardExtraGameWin(req.user!.id, req.user!.familyId, 'memory', req.body?.score, req.body?.moves);
  res.status(StatusCodes.OK).json(result);
});

export const claimMathReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardExtraGameWin(req.user!.id, req.user!.familyId, 'math', req.body?.score, req.body?.moves);
  res.status(StatusCodes.OK).json(result);
});

export const claimPatternReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardExtraGameWin(req.user!.id, req.user!.familyId, 'pattern', req.body?.score, req.body?.moves);
  res.status(StatusCodes.OK).json(result);
});

export const claimPuzzleReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await rewardExtraGameWin(req.user!.id, req.user!.familyId, 'puzzle', req.body?.score, req.body?.moves);
  res.status(StatusCodes.OK).json(result);
});
