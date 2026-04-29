import { Router } from 'express';
import * as gameController from '../controllers/game.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.CHILD));
router.post('/chess/reward', gameController.claimChessReward);
router.post('/memory/reward', gameController.claimMemoryReward);
router.post('/math/reward', gameController.claimMathReward);
router.post('/pattern/reward', gameController.claimPatternReward);
router.post('/puzzle/reward', gameController.claimPuzzleReward);

export default router;
