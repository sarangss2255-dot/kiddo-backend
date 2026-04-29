import { Router } from 'express';
import * as rewardController from '../controllers/reward.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { rewardCreateSchema, rewardUpdateSchema } from '../schemas/reward.schema.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);
router.get('/', rewardController.listRewards);
router.post('/', authorize(ROLES.PARENT, ROLES.ADMIN), validate(rewardCreateSchema), rewardController.createReward);
router.patch(
  '/:rewardId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  validate(rewardUpdateSchema),
  rewardController.updateReward,
);
router.delete('/:rewardId', authorize(ROLES.PARENT, ROLES.ADMIN), rewardController.deleteReward);
router.post(
  '/:rewardId/redeem',
  authorize(ROLES.CHILD),
  rewardController.redeemReward,
);

export default router;
