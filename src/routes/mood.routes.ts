import { Router } from 'express';
import * as moodController from '../controllers/mood.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(ROLES.CHILD), moodController.logMood);
router.get('/me', authorize(ROLES.CHILD), moodController.getMyMoodHistory);
router.get('/family', authorize(ROLES.PARENT), moodController.getFamilyMoods);

export default router;
