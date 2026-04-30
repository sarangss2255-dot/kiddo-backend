import { Router } from 'express';
import * as powerupController from '../controllers/powerup.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.CHILD));

router.get('/brain-break/tip', powerupController.getBrainBreakTip);
router.post('/brain-break/complete', powerupController.completeBrainBreak);
router.post('/focus/complete', powerupController.completeFocusSession);
router.get('/knowledge-quest', powerupController.getKnowledgeQuest);
router.post('/knowledge-quest/answer', powerupController.answerKnowledgeQuest);

export default router;
