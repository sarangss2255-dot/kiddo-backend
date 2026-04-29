import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, activityController.listFamilyActivity);

export default router;
