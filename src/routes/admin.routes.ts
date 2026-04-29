import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/dashboard', adminController.getDashboard);
router.get('/tasks', adminController.moderateTasks);
router.get('/rewards', adminController.moderateRewards);

export default router;
