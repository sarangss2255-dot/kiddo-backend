import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as interactionService from '../services/interaction.service.js';

export const sendInteraction = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId, type, activityId } = req.body;
  const interaction = await interactionService.sendInteraction(
    req.user!.familyId!,
    req.user!.id,
    receiverId,
    type,
    activityId,
  );
  res.status(StatusCodes.CREATED).json(interaction);
});

export const getMyInteractions = asyncHandler(async (req: Request, res: Response) => {
  const interactions = await interactionService.getInteractions(req.user!.id);
  res.status(StatusCodes.OK).json(interactions);
});
