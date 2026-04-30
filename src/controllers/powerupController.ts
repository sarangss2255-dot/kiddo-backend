import { Request, Response, NextFunction } from 'express';
import { PowerupLog } from '../models/powerupLog';
import { verifyToken } from '../middlewares/auth';

// POST /powerups/focus
export const completeFocusTimer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId; // set by verifyToken
    const { durationSeconds } = req.body;
    const log = await PowerupLog.create({ userId, type: 'focus', data: { durationSeconds } });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// POST /powerups/brain-break
export const completeBrainBreak = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const log = await PowerupLog.create({ userId, type: 'brain_break', data: {} });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// POST /powerups/knowledge-quest
export const completeKnowledgeQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { answer, questionId } = req.body;
    const log = await PowerupLog.create({ userId, type: 'knowledge_quest', data: { questionId, answer } });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};
