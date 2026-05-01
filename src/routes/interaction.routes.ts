import { Router } from 'express';
import * as interactionController from '../controllers/interaction.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sendInteractionSchema } from '../schemas/interaction.schema.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.CHILD, ROLES.PARENT));

router.post('/', validate(sendInteractionSchema), interactionController.sendInteraction);
router.get('/me', interactionController.getMyInteractions);

export default router;
