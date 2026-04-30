import { Router } from 'express';
import * as shopController from '../controllers/shop.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/items', authenticate, shopController.listItems);
router.post('/purchase', authenticate, shopController.purchaseItem);
router.post('/equip', authenticate, shopController.equipItem);
router.post('/seed', shopController.seedItems); // Temporary seed endpoint

export default router;
