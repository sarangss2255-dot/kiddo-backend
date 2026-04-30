import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.patch('/me', authenticate, userController.updateMe);
router.post('/me/notification-token', authenticate, userController.registerNotificationToken);
router.post('/me/claim-scroll', authenticate, userController.claimScroll);
router.post('/me/brain-break', authenticate, userController.logBrainBreak);
router.post('/:userId/regenerate-code', authenticate, authorize(ROLES.PARENT, ROLES.ADMIN), userController.regenerateChildCode);
router.patch('/:userId', authenticate, authorize(ROLES.PARENT, ROLES.ADMIN), userController.updateChild);
router.get('/family', authenticate, authorize(ROLES.PARENT, ROLES.ADMIN), userController.listFamilyUsers);
router.get('/all', authenticate, authorize(ROLES.ADMIN), userController.listAllUsers);

export default router;
