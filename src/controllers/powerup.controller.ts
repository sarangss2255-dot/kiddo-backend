import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as powerupService from '../services/powerup.service.js';

export const getBrainBreakTip = asyncHandler(async (req: Request, res: Response) => {
  const tip = powerupService.getRandomBrainBreakTip();
  res.status(StatusCodes.OK).json({ tip });
});

export const completeBrainBreak = asyncHandler(async (req: Request, res: Response) => {
  const result = await powerupService.completeBrainBreak(req.user!.id, req.user!.familyId);
  res.status(StatusCodes.OK).json(result);
});

export const completeFocusSession = asyncHandler(async (req: Request, res: Response) => {
  const { durationSeconds } = req.body;
  const result = await powerupService.completeFocusSession(req.user!.id, req.user!.familyId, durationSeconds);
  res.status(StatusCodes.OK).json(result);
});

export const getKnowledgeQuest = asyncHandler(async (req: Request, res: Response) => {
  const question = powerupService.getRandomQuestion();
  res.status(StatusCodes.OK).json(question);
});

export const answerKnowledgeQuest = asyncHandler(async (req: Request, res: Response) => {
  const { questionId, answer } = req.body;
  const result = await powerupService.answerQuestion(req.user!.id, req.user!.familyId, questionId, answer);
  res.status(StatusCodes.OK).json(result);
});
