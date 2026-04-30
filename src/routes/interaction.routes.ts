import { Router } from 'express';
import * as interactionController from '../controllers/interaction.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.CHILD, ROLES.PARENT));

router.post('/', interactionController.sendInteraction);
router.get('/me', interactionController.getMyInteractions);

export default router;
