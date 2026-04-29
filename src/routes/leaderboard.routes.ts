import { Router } from 'express';
import { leaderboard } from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, leaderboard);

export default router;
